use std::fs;
use std::path::PathBuf;

use serde_json::Value;

fn settings_path() -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    // Tauri uses the bundle identifier for the data dir, but we keep compatibility
    // with the Electron settings file location
    let app_dir = base.join("hoggies-tool-kit");
    fs::create_dir_all(&app_dir).ok();
    app_dir.join("swiss-knife-settings.json")
}

fn defaults() -> Value {
    serde_json::json!({
        "general": {
            "defaultOutputDir": "",
            "openAfterConvert": false
        },
        "image": {
            "format": "png",
            "quality": 85,
            "width": "",
            "height": "",
            "keepMetadata": false
        },
        "video": {
            "format": "mp4",
            "codec": "",
            "crf": 23,
            "resolution": "",
            "audioCodec": "aac",
            "audioBitrate": "192k",
            "fps": "",
            "hwAccel": ""
        },
        "audio": {
            "format": "mp3",
            "bitrate": "192k",
            "sampleRate": "44100",
            "channels": "",
            "normalize": false,
            "fadeIn": 0
        },
        "downloader": {
            "formatType": "video",
            "quality": "1080p",
            "audioFormat": "mp3",
            "embedThumbnail": false,
            "embedSubs": false,
            "subsLang": "en",
            "rateLimit": ""
        },
        "pdf": {
            "compressionLevel": "medium"
        }
    })
}

fn deep_merge(target: &Value, source: &Value) -> Value {
    match (target, source) {
        (Value::Object(t), Value::Object(s)) => {
            let mut merged = t.clone();
            for (key, s_val) in s {
                let merged_val = if let Some(t_val) = t.get(key) {
                    deep_merge(t_val, s_val)
                } else {
                    s_val.clone()
                };
                merged.insert(key.clone(), merged_val);
            }
            Value::Object(merged)
        }
        (_, source) => source.clone(),
    }
}

#[tauri::command]
pub async fn settings_read() -> Value {
    let path = settings_path();
    match fs::read_to_string(&path) {
        Ok(raw) => match serde_json::from_str::<Value>(&raw) {
            Ok(saved) => deep_merge(&defaults(), &saved),
            Err(_) => defaults(),
        },
        Err(_) => defaults(),
    }
}

#[tauri::command]
pub async fn settings_write(data: Value) -> Value {
    let path = settings_path();
    match fs::write(&path, serde_json::to_string_pretty(&data).unwrap_or_default()) {
        Ok(_) => serde_json::json!({ "success": true }),
        Err(e) => serde_json::json!({ "success": false, "error": e.to_string() }),
    }
}
