use sqlx::{Row, SqlitePool};
use tauri::State;

fn row_to_sample(row: &sqlx::sqlite::SqliteRow) -> serde_json::Value {
    let sample_data_raw: Option<String> = row.get(4);
    let sample_data: Option<serde_json::Value> = match sample_data_raw {
        Some(s) if !s.is_empty() => serde_json::from_str(&s).ok(),
        _ => None,
    };

    serde_json::json!({
        "id": row.get::<String, _>(0),
        "lab_result_id": row.get::<String, _>(1),
        "sample_number": row.get::<i64, _>(2),
        "sample_date": row.get::<String, _>(3),
        "sample_data": sample_data,
        "created_by": row.get::<Option<String>, _>(5),
        "created_at": row.get::<Option<String>, _>(6),
    })
}

#[tauri::command]
pub async fn get_samples_by_result_id(
    db: State<'_, SqlitePool>,
    lab_result_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let rows = sqlx::query(
        "SELECT id, lab_result_id, sample_number, sample_date, sample_data, created_by, created_at \
         FROM exam_samples WHERE lab_result_id = ? ORDER BY sample_number ASC",
    )
    .bind(&lab_result_id)
    .fetch_all(db.inner())
    .await
    .map_err(|e| format!("Error al obtener muestras: {}", e))?;

    Ok(rows.iter().map(|r| row_to_sample(r)).collect())
}

#[tauri::command]
pub async fn save_sample(
    db: State<'_, SqlitePool>,
    lab_result_id: String,
    sample_number: i64,
    sample_date: String,
    sample_data: serde_json::Value,
    created_by: Option<String>,
) -> Result<serde_json::Value, String> {
    use uuid::Uuid;
    let id = Uuid::new_v4().to_string();
    let data_str = sample_data.to_string();

    sqlx::query(
        "INSERT INTO exam_samples (id, lab_result_id, sample_number, sample_date, sample_data, created_by) \
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&lab_result_id)
    .bind(sample_number)
    .bind(&sample_date)
    .bind(&data_str)
    .bind(created_by.unwrap_or_default())
    .execute(db.inner())
    .await
    .map_err(|e| format!("Error al guardar muestra: {}", e))?;

    Ok(serde_json::json!({ "id": id }))
}

#[tauri::command]
pub async fn delete_sample(
    db: State<'_, SqlitePool>,
    id: String,
) -> Result<(), String> {
    sqlx::query("DELETE FROM exam_samples WHERE id = ?")
        .bind(&id)
        .execute(db.inner())
        .await
        .map_err(|e| format!("Error al eliminar muestra: {}", e))?;

    Ok(())
}
