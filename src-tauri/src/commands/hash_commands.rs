use std::collections::HashMap;
use std::fs::File;
use std::io::Read;

use digest::Digest;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct HashResult {
    pub success: bool,
    #[serde(rename = "filePath", skip_serializing_if = "Option::is_none")]
    pub file_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hashes: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Deserialize)]
pub struct HashComputeArgs {
    #[serde(rename = "filePath")]
    pub file_path: String,
    pub algorithms: Option<Vec<String>>,
}

#[tauri::command]
pub async fn hash_compute(args: HashComputeArgs) -> HashResult {
    let algos = args.algorithms.unwrap_or_else(|| {
        vec![
            "md5".into(),
            "sha1".into(),
            "sha256".into(),
            "sha512".into(),
        ]
    });

    let mut file = match File::open(&args.file_path) {
        Ok(f) => f,
        Err(e) => {
            return HashResult {
                success: false,
                file_path: None,
                hashes: None,
                error: Some(e.to_string()),
            }
        }
    };

    let mut buffer = Vec::new();
    if let Err(e) = file.read_to_end(&mut buffer) {
        return HashResult {
            success: false,
            file_path: None,
            hashes: None,
            error: Some(e.to_string()),
        };
    }

    let mut results = HashMap::new();
    for algo in &algos {
        let hash = match algo.as_str() {
            "md5" => {
                let mut hasher = md5::Md5::new();
                hasher.update(&buffer);
                hex::encode(hasher.finalize())
            }
            "sha1" => {
                let mut hasher = sha1::Sha1::new();
                hasher.update(&buffer);
                hex::encode(hasher.finalize())
            }
            "sha256" => {
                let mut hasher = sha2::Sha256::new();
                hasher.update(&buffer);
                hex::encode(hasher.finalize())
            }
            "sha512" => {
                let mut hasher = sha2::Sha512::new();
                hasher.update(&buffer);
                hex::encode(hasher.finalize())
            }
            _ => continue,
        };
        results.insert(algo.clone(), hash);
    }

    HashResult {
        success: true,
        file_path: Some(args.file_path),
        hashes: Some(results),
        error: None,
    }
}
