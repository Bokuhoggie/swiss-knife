use std::fs;
use std::path::{Path, PathBuf};

use lopdf::{dictionary, Document, Object, ObjectId};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Serialize)]
pub struct PdfResult {
    pub success: bool,
    #[serde(rename = "outputPath", skip_serializing_if = "Option::is_none")]
    pub output_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(rename = "savedBytes", skip_serializing_if = "Option::is_none")]
    pub saved_bytes: Option<i64>,
    #[serde(rename = "originalSize", skip_serializing_if = "Option::is_none")]
    pub original_size: Option<u64>,
    #[serde(rename = "finalSize", skip_serializing_if = "Option::is_none")]
    pub final_size: Option<u64>,
}

#[derive(Serialize)]
pub struct SplitResult {
    pub success: bool,
    #[serde(rename = "outputPath", skip_serializing_if = "Option::is_none")]
    pub output_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range: Option<PageRange>,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct PageRange {
    pub start: u32,
    pub end: u32,
}

#[derive(Deserialize)]
pub struct MergeArgs {
    #[serde(rename = "filePaths")]
    pub file_paths: Vec<String>,
    #[serde(rename = "outputDir")]
    pub output_dir: String,
}

#[derive(Deserialize)]
pub struct SplitArgs {
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "outputDir")]
    pub output_dir: String,
    pub ranges: Vec<PageRange>,
}

#[derive(Deserialize)]
pub struct CompressArgs {
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "outputDir")]
    pub output_dir: String,
    #[serde(rename = "compressionLevel")]
    pub compression_level: Option<String>,
}

#[derive(Deserialize)]
pub struct CompressToSizeArgs {
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "outputDir")]
    pub output_dir: String,
    #[serde(rename = "targetSizeMB")]
    pub target_size_mb: f64,
}

#[tauri::command]
pub async fn pdf_merge(args: MergeArgs) -> PdfResult {
    let result = (|| -> Result<String, String> {
        if args.file_paths.is_empty() {
            return Err("No files provided".into());
        }

        // Collect all documents
        let mut documents: Vec<Document> = Vec::new();
        for fp in &args.file_paths {
            let doc = Document::load(fp).map_err(|e| e.to_string())?;
            documents.push(doc);
        }

        // Merge using lopdf's lower-level API
        let mut merged = Document::with_version("1.5");
        let mut max_id = 1u32;
        let mut all_pages: Vec<Object> = Vec::new();

        for mut doc in documents {
            doc.renumber_objects_with(max_id);
            max_id = doc.max_id + 1;

            // Collect page references from this document
            let pages = doc.get_pages();
            let page_ids: Vec<ObjectId> = pages.into_values().collect();

            for page_id in &page_ids {
                all_pages.push(Object::Reference(*page_id));
            }

            // Copy all objects into merged document
            for (id, object) in doc.objects {
                merged.objects.insert(id, object);
            }
        }

        // Build the pages dictionary
        let pages_id = merged.new_object_id();
        let pages_dict = lopdf::dictionary! {
            "Type" => "Pages",
            "Kids" => all_pages,
            "Count" => merged.objects.len() as u32, // Will be corrected
        };
        merged.objects.insert(pages_id, Object::Dictionary(pages_dict));

        // Update all page objects to point to the new Pages parent
        let page_refs: Vec<ObjectId> = merged.objects.iter()
            .filter_map(|(id, obj)| {
                if let Object::Dictionary(dict) = obj {
                    if let Ok(type_val) = dict.get(b"Type") {
                        if let Ok(name) = type_val.as_name_str() {
                            if name == "Page" {
                                return Some(*id);
                            }
                        }
                    }
                }
                None
            })
            .collect();

        let page_count = page_refs.len() as u32;
        for page_id in &page_refs {
            if let Ok(Object::Dictionary(ref mut dict)) = merged.objects.get_mut(page_id).ok_or("") {
                dict.set("Parent", Object::Reference(pages_id));
            }
        }

        // Fix the page count
        if let Ok(Object::Dictionary(ref mut pages_dict)) = merged.objects.get_mut(&pages_id).ok_or("") {
            pages_dict.set("Count", Object::Integer(page_count as i64));
        }

        // Build catalog
        let catalog_id = merged.new_object_id();
        let catalog = lopdf::dictionary! {
            "Type" => "Catalog",
            "Pages" => Object::Reference(pages_id),
        };
        merged.objects.insert(catalog_id, Object::Dictionary(catalog));
        merged.trailer.set("Root", Object::Reference(catalog_id));
        merged.max_id = max_id;

        let timestamp = chrono::Utc::now().timestamp_millis();
        let out_path = PathBuf::from(&args.output_dir).join(format!("merged_{}.pdf", timestamp));
        merged
            .save(&out_path)
            .map_err(|e| e.to_string())?;

        Ok(out_path.to_string_lossy().to_string())
    })();

    match result {
        Ok(path) => PdfResult {
            success: true,
            output_path: Some(path),
            error: None,
            saved_bytes: None,
            original_size: None,
            final_size: None,
        },
        Err(e) => PdfResult {
            success: false,
            output_path: None,
            error: Some(e),
            saved_bytes: None,
            original_size: None,
            final_size: None,
        },
    }
}

#[tauri::command]
pub async fn pdf_split(args: SplitArgs) -> Vec<SplitResult> {
    let mut results = Vec::new();

    let doc = match Document::load(&args.file_path) {
        Ok(d) => d,
        Err(e) => {
            return vec![SplitResult {
                success: false,
                output_path: None,
                error: Some(e.to_string()),
                range: None,
            }];
        }
    };

    let page_count = doc.get_pages().len() as u32;

    for range in &args.ranges {
        let result = (|| -> Result<String, String> {
            let start = range.start.max(1);
            let end = range.end.min(page_count);

            if start > end {
                return Err(format!("Invalid range: {}-{}", range.start, range.end));
            }

            // Create a new document with only the specified pages
            let mut new_doc = doc.clone();

            // Get all page numbers and remove pages not in range
            let all_pages: Vec<u32> = new_doc.get_pages().keys().cloned().collect();
            for &page_num in &all_pages {
                if page_num < start || page_num > end {
                    new_doc.delete_pages(&[page_num]);
                }
            }

            let timestamp = chrono::Utc::now().timestamp_millis();
            let out_path = PathBuf::from(&args.output_dir)
                .join(format!("split_{}-{}_{}.pdf", start, end, timestamp));
            new_doc.save(&out_path).map_err(|e| e.to_string())?;

            Ok(out_path.to_string_lossy().to_string())
        })();

        match result {
            Ok(path) => results.push(SplitResult {
                success: true,
                output_path: Some(path),
                error: None,
                range: Some(range.clone()),
            }),
            Err(e) => results.push(SplitResult {
                success: false,
                output_path: None,
                error: Some(e),
                range: Some(range.clone()),
            }),
        }
    }

    results
}

#[tauri::command]
pub async fn pdf_compress(args: CompressArgs) -> PdfResult {
    let result = (|| -> Result<(String, u64, u64), String> {
        let bytes = fs::read(&args.file_path).map_err(|e| e.to_string())?;
        let original_size = bytes.len() as u64;

        let mut doc = Document::load_mem(&bytes).map_err(|e| e.to_string())?;
        doc.compress();

        let out_name = format!("compressed_{}", Path::new(&args.file_path).file_name().unwrap_or_default().to_string_lossy());
        let out_path = PathBuf::from(&args.output_dir).join(out_name);
        doc.save(&out_path).map_err(|e| e.to_string())?;

        let final_size = fs::metadata(&out_path).map_err(|e| e.to_string())?.len();
        Ok((out_path.to_string_lossy().to_string(), original_size, final_size))
    })();

    match result {
        Ok((path, original_size, final_size)) => PdfResult {
            success: true,
            output_path: Some(path),
            error: None,
            saved_bytes: Some((original_size as i64 - final_size as i64).max(0)),
            original_size: Some(original_size),
            final_size: Some(final_size),
        },
        Err(e) => PdfResult {
            success: false,
            output_path: None,
            error: Some(e),
            saved_bytes: None,
            original_size: None,
            final_size: None,
        },
    }
}

#[tauri::command]
pub async fn pdf_compress_to_size(app: AppHandle, args: CompressToSizeArgs) -> serde_json::Value {
    let result = (|| -> Result<serde_json::Value, String> {
        let bytes = fs::read(&args.file_path).map_err(|e| e.to_string())?;
        let original_size = bytes.len() as u64;
        let target_bytes = (args.target_size_mb * 1024.0 * 1024.0) as u64;

        // If already under target, just do a light optimization pass
        if original_size <= target_bytes {
            let mut doc = Document::load_mem(&bytes).map_err(|e| e.to_string())?;
            doc.compress();

            let out_name = format!("compressed_{}", Path::new(&args.file_path).file_name().unwrap_or_default().to_string_lossy());
            let out_path = PathBuf::from(&args.output_dir).join(&out_name);
            doc.save(&out_path).map_err(|e| e.to_string())?;
            let final_size = fs::metadata(&out_path).map_err(|e| e.to_string())?.len();

            return Ok(serde_json::json!({
                "success": true,
                "outputPath": out_path.to_string_lossy(),
                "savedBytes": (original_size as i64 - final_size as i64).max(0),
                "originalSize": original_size,
                "finalSize": final_size,
                "passes": 1,
                "hitTarget": final_size <= target_bytes,
            }));
        }

        // Iterative compression
        let max_passes = 6;
        let mut pass = 0;
        let mut last_size = original_size;
        let mut best_path = String::new();

        while pass < max_passes {
            pass += 1;
            let _ = app.emit(
                "pdf:compressProgress",
                serde_json::json!({
                    "pass": pass,
                    "maxPasses": max_passes,
                    "status": format!("Pass {}", pass),
                }),
            );

            let mut doc = Document::load_mem(&bytes).map_err(|e| e.to_string())?;
            doc.compress();

            let out_name = format!("compressed_{}", Path::new(&args.file_path).file_name().unwrap_or_default().to_string_lossy());
            let out_path = PathBuf::from(&args.output_dir).join(&out_name);
            doc.save(&out_path).map_err(|e| e.to_string())?;

            let final_size = fs::metadata(&out_path).map_err(|e| e.to_string())?.len();
            best_path = out_path.to_string_lossy().to_string();

            if final_size <= target_bytes {
                return Ok(serde_json::json!({
                    "success": true,
                    "outputPath": best_path,
                    "savedBytes": (original_size as i64 - final_size as i64).max(0),
                    "originalSize": original_size,
                    "finalSize": final_size,
                    "passes": pass,
                    "hitTarget": true,
                }));
            }

            // lopdf compress is deterministic, so further passes won't help
            // without image recompression. Break early.
            if final_size >= last_size {
                break;
            }
            last_size = final_size;
        }

        let final_size = if !best_path.is_empty() {
            fs::metadata(&best_path).map(|m| m.len()).unwrap_or(original_size)
        } else {
            original_size
        };

        Ok(serde_json::json!({
            "success": true,
            "outputPath": best_path,
            "savedBytes": (original_size as i64 - final_size as i64).max(0),
            "originalSize": original_size,
            "finalSize": final_size,
            "passes": pass,
            "hitTarget": final_size <= target_bytes,
        }))
    })();

    match result {
        Ok(v) => v,
        Err(e) => serde_json::json!({ "success": false, "error": e }),
    }
}

#[tauri::command]
pub async fn pdf_file_size(file_path: String) -> serde_json::Value {
    match fs::metadata(&file_path) {
        Ok(meta) => serde_json::json!({ "success": true, "size": meta.len() }),
        Err(e) => serde_json::json!({ "success": false, "error": e.to_string() }),
    }
}

#[tauri::command]
pub async fn pdf_to_images() -> serde_json::Value {
    serde_json::json!({ "success": false, "error": "PDF to Image: Feature coming soon." })
}
