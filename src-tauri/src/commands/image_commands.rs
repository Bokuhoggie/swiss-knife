use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};

use base64::Engine;
use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView, ImageFormat, ImageReader, RgbaImage};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct ConvertResult {
    pub success: bool,
    #[serde(rename = "inputPath", skip_serializing_if = "Option::is_none")]
    pub input_path: Option<String>,
    #[serde(rename = "outputPath", skip_serializing_if = "Option::is_none")]
    pub output_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Deserialize)]
pub struct ImageConvertArgs {
    #[serde(rename = "filePaths")]
    pub file_paths: Vec<String>,
    #[serde(rename = "outputFormat")]
    pub output_format: String,
    #[serde(rename = "outputDir")]
    pub output_dir: String,
    pub quality: Option<u32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    #[serde(rename = "keepMetadata")]
    pub keep_metadata: Option<bool>,
    #[serde(rename = "outputName")]
    pub output_name: Option<String>,
    #[serde(rename = "icoSizes")]
    pub ico_sizes: Option<Vec<u32>>,
}

#[derive(Deserialize)]
pub struct RemoveBgArgs {
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "outputDir")]
    pub output_dir: String,
    #[serde(rename = "outputName")]
    pub output_name: Option<String>,
    pub tolerance: Option<f64>,
    pub mode: Option<String>,
    #[serde(rename = "customColor")]
    pub custom_color: Option<String>,
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| {
            if "<>:\"/\\|?*".contains(c) || (c as u32) < 0x20 {
                '_'
            } else {
                c
            }
        })
        .collect()
}

fn str_to_format(ext: &str) -> Option<ImageFormat> {
    match ext {
        "jpg" | "jpeg" => Some(ImageFormat::Jpeg),
        "png" => Some(ImageFormat::Png),
        "webp" => Some(ImageFormat::WebP),
        "gif" => Some(ImageFormat::Gif),
        "bmp" => Some(ImageFormat::Bmp),
        "tiff" => Some(ImageFormat::Tiff),
        "avif" => Some(ImageFormat::Avif),
        _ => None,
    }
}

fn build_ico(img: &DynamicImage, sizes: &[u32]) -> Vec<u8> {
    let count = sizes.len();
    let header_size = 6 + 16 * count;

    // Render each size as PNG into memory
    let mut png_buffers: Vec<(u32, Vec<u8>)> = Vec::new();
    for &size in sizes {
        let resized = img.resize_exact(size, size, FilterType::Lanczos3);
        let mut buf = Vec::new();
        let mut cursor = Cursor::new(&mut buf);
        resized
            .write_to(&mut cursor, ImageFormat::Png)
            .unwrap_or_default();
        png_buffers.push((size, buf));
    }

    let total_data: usize = png_buffers.iter().map(|(_, b)| b.len()).sum();
    let mut ico = vec![0u8; header_size + total_data];

    // ICO header
    ico[2] = 1; // type = ICO
    ico[4] = count as u8;

    let mut data_offset = header_size;
    for (i, (size, buf)) in png_buffers.iter().enumerate() {
        let dir_offset = 6 + i * 16;
        ico[dir_offset] = if *size >= 256 { 0 } else { *size as u8 };
        ico[dir_offset + 1] = if *size >= 256 { 0 } else { *size as u8 };
        // color planes = 1
        ico[dir_offset + 4] = 1;
        // bits per pixel = 32
        ico[dir_offset + 6] = 32;
        // image data size (little-endian u32)
        let len = buf.len() as u32;
        ico[dir_offset + 8..dir_offset + 12].copy_from_slice(&len.to_le_bytes());
        // offset to data
        let off = data_offset as u32;
        ico[dir_offset + 12..dir_offset + 16].copy_from_slice(&off.to_le_bytes());
        // Copy PNG data
        ico[data_offset..data_offset + buf.len()].copy_from_slice(buf);
        data_offset += buf.len();
    }

    ico
}

#[tauri::command]
pub async fn image_convert(args: ImageConvertArgs) -> Vec<ConvertResult> {
    let mut results = Vec::new();
    let ext = args.output_format.to_lowercase();
    let single = args.file_paths.len() == 1;

    for file_path in &args.file_paths {
        let input_path = file_path.clone();
        let result = (|| -> Result<String, String> {
            let p = Path::new(&file_path);
            let auto_name = p
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let safe_name = args
                .output_name
                .as_ref()
                .map(|n| sanitize_filename(n.trim()))
                .unwrap_or_default();

            let base_name = if !safe_name.is_empty() && single {
                safe_name
            } else {
                auto_name
            };

            let out_path = PathBuf::from(&args.output_dir).join(format!("{}.{}", base_name, ext));

            let img =
                ImageReader::open(file_path)
                    .map_err(|e| e.to_string())?
                    .decode()
                    .map_err(|e| e.to_string())?;

            // Resize if requested
            let img = if args.width.is_some() || args.height.is_some() {
                let (orig_w, orig_h) = img.dimensions();
                let target_w = args.width.filter(|&w| w > 0).unwrap_or(orig_w);
                let target_h = args.height.filter(|&h| h > 0).unwrap_or(orig_h);
                img.resize(target_w, target_h, FilterType::Lanczos3)
            } else {
                img
            };

            if ext == "ico" {
                let sizes = args.ico_sizes.as_deref().unwrap_or(&[256]);
                let ico_data = build_ico(&img, sizes);
                fs::write(&out_path, ico_data).map_err(|e| e.to_string())?;
            } else {
                let format = str_to_format(&ext)
                    .ok_or_else(|| format!("Unsupported format: {}", ext))?;

                // For JPEG, use quality setting
                if ext == "jpg" || ext == "jpeg" {
                    let quality = args.quality.unwrap_or(85).min(100) as u8;
                    let rgb = img.to_rgb8();
                    let mut buf = Vec::new();
                    let mut cursor = Cursor::new(&mut buf);
                    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
                        &mut cursor,
                        quality,
                    );
                    encoder
                        .encode(
                            rgb.as_raw(),
                            rgb.width(),
                            rgb.height(),
                            image::ExtendedColorType::Rgb8,
                        )
                        .map_err(|e| e.to_string())?;
                    fs::write(&out_path, buf).map_err(|e| e.to_string())?;
                } else {
                    img.save_with_format(&out_path, format)
                        .map_err(|e| e.to_string())?;
                }
            }

            Ok(out_path.to_string_lossy().to_string())
        })();

        match result {
            Ok(output_path) => results.push(ConvertResult {
                success: true,
                input_path: Some(input_path),
                output_path: Some(output_path),
                error: None,
            }),
            Err(e) => results.push(ConvertResult {
                success: false,
                input_path: Some(input_path),
                output_path: None,
                error: Some(e),
            }),
        }
    }

    results
}

#[tauri::command]
pub async fn image_read_as_data_url(file_path: String) -> Option<String> {
    let data = fs::read(&file_path).ok()?;
    let ext = Path::new(&file_path)
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_lowercase();

    let mime = match ext.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "avif" => "image/avif",
        "tiff" => "image/tiff",
        _ => "image/png",
    };

    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
    Some(format!("data:{};base64,{}", mime, b64))
}

#[tauri::command]
pub async fn image_remove_bg(args: RemoveBgArgs) -> serde_json::Value {
    let result = (|| -> Result<String, String> {
        let img = ImageReader::open(&args.file_path)
            .map_err(|e| e.to_string())?
            .decode()
            .map_err(|e| e.to_string())?;

        let rgba = img.to_rgba8();
        let (width, height) = rgba.dimensions();
        let mut pixels = rgba.into_raw();

        let mode = args.mode.as_deref().unwrap_or("corner");
        let tolerance = args.tolerance.unwrap_or(30.0);
        let thresh = (tolerance / 100.0) * 170.0;

        // Determine background color
        let (bg_r, bg_g, bg_b) = if mode == "custom" {
            let hex = args
                .custom_color
                .as_deref()
                .unwrap_or("#ffffff")
                .trim_start_matches('#');
            let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
            let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(255);
            let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
            (r, g, b)
        } else if mode == "color" {
            // Most common color via 5-bit quantization
            let mut color_map = std::collections::HashMap::new();
            let total = (width * height) as usize;
            let sample_step = if total > 500000 {
                total / 500000
            } else {
                1
            };
            for pi in (0..total).step_by(sample_step.max(1)) {
                let i4 = pi * 4;
                if pixels[i4 + 3] < 128 {
                    continue;
                }
                let key = ((pixels[i4] as u32 >> 3) << 10)
                    | ((pixels[i4 + 1] as u32 >> 3) << 5)
                    | (pixels[i4 + 2] as u32 >> 3);
                *color_map.entry(key).or_insert(0u32) += 1;
            }
            let max_key = color_map
                .iter()
                .max_by_key(|(_, v)| *v)
                .map(|(k, _)| *k)
                .unwrap_or(0);
            let r = (((max_key >> 10) & 0x1F) * 8 + 4) as u8;
            let g = (((max_key >> 5) & 0x1F) * 8 + 4) as u8;
            let b = ((max_key & 0x1F) * 8 + 4) as u8;
            (r, g, b)
        } else {
            // Corner mode
            let corners = [
                (0u32, 0u32),
                (width - 1, 0),
                (0, height - 1),
                (width - 1, height - 1),
            ];
            let (mut sr, mut sg, mut sb) = (0u32, 0u32, 0u32);
            for &(cx, cy) in &corners {
                let i = ((cy * width + cx) * 4) as usize;
                sr += pixels[i] as u32;
                sg += pixels[i + 1] as u32;
                sb += pixels[i + 2] as u32;
            }
            ((sr / 4) as u8, (sg / 4) as u8, (sb / 4) as u8)
        };

        if mode == "custom" || mode == "color" {
            // Remove ALL matching pixels
            let total = (width * height) as usize;
            for pi in 0..total {
                let i4 = pi * 4;
                let dr = pixels[i4] as f64 - bg_r as f64;
                let dg = pixels[i4 + 1] as f64 - bg_g as f64;
                let db = pixels[i4 + 2] as f64 - bg_b as f64;
                if (dr * dr + dg * dg + db * db).sqrt() <= thresh {
                    pixels[i4 + 3] = 0;
                }
            }
        } else {
            // Corner mode: flood fill from edges
            let w = width as usize;
            let h = height as usize;
            let mut visited = vec![false; w * h];
            let mut stack: Vec<(usize, usize)> = Vec::new();

            let try_add = |x: usize, y: usize, visited: &mut Vec<bool>, stack: &mut Vec<(usize, usize)>, pixels: &[u8]| {
                if x >= w || y >= h {
                    return;
                }
                let pi = y * w + x;
                if visited[pi] {
                    return;
                }
                let i4 = pi * 4;
                let dr = pixels[i4] as f64 - bg_r as f64;
                let dg = pixels[i4 + 1] as f64 - bg_g as f64;
                let db = pixels[i4 + 2] as f64 - bg_b as f64;
                if (dr * dr + dg * dg + db * db).sqrt() > thresh {
                    return;
                }
                visited[pi] = true;
                stack.push((x, y));
            };

            // Seed edges
            let step = (w.min(h) / 20).max(1);
            for x in (0..w).step_by(step) {
                try_add(x, 0, &mut visited, &mut stack, &pixels);
                try_add(x, h - 1, &mut visited, &mut stack, &pixels);
            }
            for y in (0..h).step_by(step) {
                try_add(0, y, &mut visited, &mut stack, &pixels);
                try_add(w - 1, y, &mut visited, &mut stack, &pixels);
            }
            // Ensure corners
            try_add(0, 0, &mut visited, &mut stack, &pixels);
            try_add(w - 1, 0, &mut visited, &mut stack, &pixels);
            try_add(0, h - 1, &mut visited, &mut stack, &pixels);
            try_add(w - 1, h - 1, &mut visited, &mut stack, &pixels);

            while let Some((x, y)) = stack.pop() {
                let idx = (y * w + x) * 4;
                pixels[idx + 3] = 0;
                if x + 1 < w {
                    try_add(x + 1, y, &mut visited, &mut stack, &pixels);
                }
                if x > 0 {
                    try_add(x - 1, y, &mut visited, &mut stack, &pixels);
                }
                if y + 1 < h {
                    try_add(x, y + 1, &mut visited, &mut stack, &pixels);
                }
                if y > 0 {
                    try_add(x, y - 1, &mut visited, &mut stack, &pixels);
                }
            }
        }

        let result_img = RgbaImage::from_raw(width, height, pixels)
            .ok_or("Failed to create image")?;

        let base = args
            .output_name
            .as_ref()
            .filter(|n| !n.trim().is_empty())
            .map(|n| sanitize_filename(n.trim()))
            .unwrap_or_else(|| {
                let stem = Path::new(&args.file_path)
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                format!("{}_nobg", stem)
            });

        let out_path = PathBuf::from(&args.output_dir).join(format!("{}.png", base));
        DynamicImage::ImageRgba8(result_img)
            .save_with_format(&out_path, ImageFormat::Png)
            .map_err(|e| e.to_string())?;

        Ok(out_path.to_string_lossy().to_string())
    })();

    match result {
        Ok(path) => serde_json::json!({ "success": true, "outputPath": path }),
        Err(e) => serde_json::json!({ "success": false, "error": e }),
    }
}
