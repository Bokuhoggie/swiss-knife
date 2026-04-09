use tauri_plugin_dialog::DialogExt;
use tauri::AppHandle;

#[tauri::command]
pub async fn select_output_dir(app: AppHandle) -> Option<String> {
    let result = app
        .dialog()
        .file()
        .blocking_pick_folder();

    result.map(|p| p.to_string())
}

#[tauri::command]
pub async fn image_select_files(app: AppHandle) -> Vec<String> {
    let result = app
        .dialog()
        .file()
        .add_filter("Images", &["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "avif"])
        .blocking_pick_files();

    result
        .map(|paths| paths.into_iter().map(|p| p.to_string()).collect())
        .unwrap_or_default()
}

#[tauri::command]
pub async fn video_select_file(app: AppHandle) -> Option<String> {
    let result = app
        .dialog()
        .file()
        .add_filter("Videos", &["mp4", "mkv", "avi", "mov", "webm", "flv", "m4v", "wmv"])
        .blocking_pick_file();

    result.map(|p| p.to_string())
}

#[tauri::command]
pub async fn audio_select_files(app: AppHandle) -> Vec<String> {
    let result = app
        .dialog()
        .file()
        .add_filter("Audio", &["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma", "opus"])
        .blocking_pick_files();

    result
        .map(|paths| paths.into_iter().map(|p| p.to_string()).collect())
        .unwrap_or_default()
}

#[tauri::command]
pub async fn pdf_select_files(app: AppHandle) -> Vec<String> {
    let result = app
        .dialog()
        .file()
        .add_filter("PDF", &["pdf"])
        .blocking_pick_files();

    result
        .map(|paths| paths.into_iter().map(|p| p.to_string()).collect())
        .unwrap_or_default()
}

#[tauri::command]
pub async fn pdf_select_file(app: AppHandle) -> Option<String> {
    let result = app
        .dialog()
        .file()
        .add_filter("PDF", &["pdf"])
        .blocking_pick_file();

    result.map(|p| p.to_string())
}

#[tauri::command]
pub async fn hash_select_file(app: AppHandle) -> Option<String> {
    let result = app
        .dialog()
        .file()
        .blocking_pick_file();

    result.map(|p| p.to_string())
}

#[tauri::command]
pub async fn inspector_select_file(app: AppHandle) -> Option<String> {
    let result = app
        .dialog()
        .file()
        .blocking_pick_file();

    result.map(|p| p.to_string())
}

#[tauri::command]
pub async fn downloader_select_folder(app: AppHandle) -> Option<String> {
    let result = app
        .dialog()
        .file()
        .blocking_pick_folder();

    result.map(|p| p.to_string())
}
