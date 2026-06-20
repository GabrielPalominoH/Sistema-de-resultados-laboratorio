use std::fs;
use std::path::Path;

#[tauri::command]
pub fn export_excel(path: String, data_base64: String) -> Result<String, String> {
    let decoded = base64_decode(&data_base64)
        .map_err(|e| format!("Error decodificando datos: {}", e))?;

    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Error creando directorio: {}", e))?;
    }

    fs::write(&path, decoded)
        .map_err(|e| format!("Error escribiendo archivo: {}", e))?;

    Ok(format!("Archivo exportado exitosamente: {}", path))
}

fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    use base64::Engine;
    let engine = base64::engine::general_purpose::STANDARD;
    engine.decode(input).map_err(|e| format!("Base64 error: {}", e))
}
