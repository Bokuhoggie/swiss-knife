use std::path::{Path, PathBuf};
use std::process::Stdio;

use serde::Deserialize;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use super::media_commands::ffmpeg_path;

fn yt_dlp_path(app: &AppHandle) -> PathBuf {
    let data_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    std::fs::create_dir_all(&data_dir).ok();
    data_dir.join("yt-dlp")
}

async fn ensure_yt_dlp(app: &AppHandle) -> Result<PathBuf, String> {
    let path = yt_dlp_path(app);
    if path.exists() {
        return Ok(path);
    }

    // Download yt-dlp from GitHub releases (macOS universal binary)
    let url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos";
    let resp = reqwest::get(url).await.map_err(|e| e.to_string())?;
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    std::fs::write(&path, &bytes).map_err(|e| e.to_string())?;

    // chmod +x on macOS
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755))
            .map_err(|e| e.to_string())?;
    }

    Ok(path)
}

#[derive(Deserialize)]
pub struct DownloadArgs {
    pub url: String,
    #[serde(rename = "outputDir")]
    pub output_dir: Option<String>,
    #[serde(rename = "formatType")]
    pub format_type: Option<String>,
    pub quality: Option<String>,
    #[serde(rename = "audioFormat")]
    pub audio_format: Option<String>,
    #[serde(rename = "embedThumbnail")]
    pub embed_thumbnail: Option<bool>,
    #[serde(rename = "embedSubs")]
    pub embed_subs: Option<bool>,
    #[serde(rename = "subsLang")]
    pub subs_lang: Option<String>,
    #[serde(rename = "rateLimit")]
    pub rate_limit: Option<String>,
    #[serde(rename = "outputName")]
    pub output_name: Option<String>,
    #[serde(rename = "cookiesFromBrowser")]
    pub cookies_from_browser: Option<String>,
}

#[tauri::command]
pub async fn downloader_download(app: AppHandle, args: DownloadArgs) -> serde_json::Value {
    let yt_dlp = match ensure_yt_dlp(&app).await {
        Ok(p) => p,
        Err(e) => {
            return serde_json::json!({
                "success": false,
                "error": format!("Failed to initialize yt-dlp: {}", e)
            })
        }
    };

    let ffmpeg = ffmpeg_path(&app);
    let out_folder = args
        .output_dir
        .unwrap_or_else(|| dirs::download_dir().unwrap_or_else(|| PathBuf::from(".")).to_string_lossy().to_string());

    let safe_name = args
        .output_name
        .as_ref()
        .map(|n| {
            let cleaned: String = n
                .trim()
                .chars()
                .map(|c| {
                    if "<>:\"/\\|?*".contains(c) || (c as u32) < 0x20 {
                        '_'
                    } else {
                        c
                    }
                })
                .collect();
            let cleaned = cleaned.trim_end_matches('.').to_string();
            if cleaned.is_empty() {
                "%(title)s".to_string()
            } else {
                cleaned
            }
        })
        .unwrap_or_else(|| "%(title)s".to_string());

    let mut cmd_args: Vec<String> = vec![
        args.url.clone(),
        "-o".into(),
        PathBuf::from(&out_folder)
            .join(format!("{}.%(ext)s", safe_name))
            .to_string_lossy()
            .to_string(),
        "--no-playlist".into(),
    ];

    if ffmpeg.exists() {
        cmd_args.extend(["--ffmpeg-location".into(), ffmpeg.to_string_lossy().to_string()]);
    }

    let format_type = args.format_type.as_deref().unwrap_or("video");
    let is_twitter = args.url.contains("twitter.com")
        || args.url.contains("x.com")
        || args.url.contains("t.co");

    if format_type == "audio" {
        let audio_fmt = args.audio_format.as_deref().unwrap_or("mp3");
        cmd_args.extend(["-x".into(), "--audio-format".into(), audio_fmt.into()]);
    } else if is_twitter {
        cmd_args.extend([
            "-f".into(),
            "best[ext=mp4]/best".into(),
            "--merge-output-format".into(),
            "mp4".into(),
        ]);
    } else {
        let quality = args.quality.as_deref().unwrap_or("1080p");
        let max_h = match quality {
            "720p" => 720,
            "480p" => 480,
            "360p" => 360,
            _ => 1080,
        };
        cmd_args.extend([
            "-f".into(),
            format!(
                "bestvideo[height<={}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={}]+bestaudio/best[height<={}]",
                max_h, max_h, max_h
            ),
            "--merge-output-format".into(),
            "mp4".into(),
        ]);
    }

    if args.embed_thumbnail.unwrap_or(false) {
        cmd_args.push("--embed-thumbnail".into());
    }
    if args.embed_subs.unwrap_or(false) {
        let lang = args.subs_lang.as_deref().unwrap_or("en");
        cmd_args.extend(["--embed-subs".into(), "--sub-lang".into(), lang.into()]);
    }
    if let Some(ref rl) = args.rate_limit {
        let trimmed = rl.trim();
        if !trimmed.is_empty() {
            cmd_args.extend(["--limit-rate".into(), trimmed.into()]);
        }
    }
    if let Some(ref browser) = args.cookies_from_browser {
        cmd_args.extend(["--cookies-from-browser".into(), browser.clone()]);
    }

    let mut child = match Command::new(&yt_dlp)
        .args(&cmd_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(c) => c,
        Err(e) => {
            return serde_json::json!({ "success": false, "error": e.to_string() })
        }
    };

    // Parse progress from stdout
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            let mut last_title = String::new();

            while let Ok(Some(line)) = lines.next_line().await {
                if line.contains("[download]") {
                    // Parse percent
                    if let Some(cap) = line.find('%') {
                        let start = line[..cap]
                            .rfind(|c: char| c.is_whitespace())
                            .map(|i| i + 1)
                            .unwrap_or(0);
                        if let Ok(pct) = line[start..cap].parse::<f64>() {
                            let _ = app_clone.emit(
                                "downloader:progress",
                                serde_json::json!({ "percent": pct, "title": last_title }),
                            );
                        }
                    }
                    // Parse title from "Destination: ..."
                    if let Some(idx) = line.find("Destination:") {
                        let dest = line[idx + 12..].trim();
                        if let Some(name) = Path::new(dest).file_name() {
                            last_title = name.to_string_lossy().to_string();
                        }
                    }
                }
            }
        });
    }

    match child.wait().await {
        Ok(status) if status.success() => {
            serde_json::json!({ "success": true, "outputDir": out_folder })
        }
        Ok(_) => serde_json::json!({ "success": false, "error": "yt-dlp exited with error" }),
        Err(e) => serde_json::json!({ "success": false, "error": e.to_string() }),
    }
}
