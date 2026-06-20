use sqlx::{Row, SqlitePool};
use tauri::State;

fn row_to_lab_result(row: &sqlx::sqlite::SqliteRow) -> serde_json::Value {
    let data_str: Option<String> = row.get(10);
    let extra_data: Option<serde_json::Value> = match data_str {
        Some(s) if !s.is_empty() => serde_json::from_str(&s).ok(),
        _ => None,
    };

    let mut result = serde_json::json!({
        "id": row.get::<String, _>(0),
        "patientName": row.get::<String, _>(1),
        "patientId": row.get::<String, _>(2),
        "examType": row.get::<String, _>(3),
        "date": row.get::<String, _>(4),
        "sampleDate": row.get::<Option<String>, _>(5),
        "patientAge": row.get::<Option<String>, _>(6),
        "hcn": row.get::<Option<String>, _>(7),
        "phone": row.get::<Option<String>, _>(8),
        "resultado": row.get::<Option<String>, _>(9),
        "data": extra_data,
        "createdBy": row.get::<Option<String>, _>(11),
        "createdAt": row.get::<Option<String>, _>(12),
        "updatedAt": row.get::<Option<String>, _>(13),
    });

    // Spread data fields to top level so frontend can access them directly
    let data_entries: Vec<(String, serde_json::Value)> = result
        .get("data")
        .and_then(|d| d.as_object())
        .map(|obj| obj.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
        .unwrap_or_default();

    if let Some(result_obj) = result.as_object_mut() {
        for (k, v) in data_entries {
            result_obj.insert(k, v);
        }
    }

    result
}

#[tauri::command]
pub async fn get_results(
    db: State<'_, SqlitePool>,
) -> Result<Vec<serde_json::Value>, String> {
    let rows = sqlx::query(
        "SELECT id, patient_name, patient_id, exam_type, date, sample_date, patient_age, \
         hcn, phone, resultado, data, created_by, created_at, updated_at \
         FROM lab_results ORDER BY created_at DESC",
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| format!("Error al obtener resultados: {}", e))?;

    Ok(rows.iter().map(|r| row_to_lab_result(r)).collect())
}

#[tauri::command]
pub async fn get_result_by_id(
    db: State<'_, SqlitePool>,
    id: String,
) -> Result<Option<serde_json::Value>, String> {
    let row = sqlx::query(
        "SELECT id, patient_name, patient_id, exam_type, date, sample_date, patient_age, \
         hcn, phone, resultado, data, created_by, created_at, updated_at \
         FROM lab_results WHERE id = ?",
    )
    .bind(&id)
    .fetch_optional(db.inner())
    .await
    .map_err(|e| format!("Error al obtener resultado: {}", e))?;

    Ok(row.map(|r| row_to_lab_result(&r)))
}

fn flatten_json_for_db(data: &serde_json::Value) -> [String; 10] {
    let mut extra = serde_json::Map::new();
    let mut patient_name = String::new();
    let mut patient_id = String::new();
    let mut exam_type = String::new();
    let mut date = String::new();
    let mut sample_date = String::new();
    let mut patient_age = String::new();
    let mut hcn = String::new();
    let mut phone = String::new();
    let mut resultado = String::new();

    if let Some(obj) = data.as_object() {
        for (k, v) in obj {
            let val = match v {
                serde_json::Value::String(s) => s.clone(),
                serde_json::Value::Number(n) => n.to_string(),
                _ => v.to_string(),
            };
            match k.as_str() {
                "patientName" => patient_name = val,
                "patientId" => patient_id = val,
                "examType" => exam_type = val,
                "date" => date = val,
                "sampleDate" => sample_date = val,
                "patientAge" => patient_age = val,
                "hcn" => hcn = val,
                "phone" => phone = val,
                "resultado" => resultado = val,
                _ => {
                    extra.insert(k.clone(), v.clone());
                }
            }
        }
    }

    let data_json = serde_json::Value::Object(extra).to_string();
    [
        patient_name, patient_id, exam_type, date, sample_date,
        patient_age, hcn, phone, resultado, data_json,
    ]
}

fn get_created_by(data: &serde_json::Value) -> String {
    data.get("createdBy")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

fn get_id(data: &serde_json::Value) -> String {
    data.get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

#[tauri::command]
pub async fn save_result(
    db: State<'_, SqlitePool>,
    data: serde_json::Value,
) -> Result<serde_json::Value, String> {
    use uuid::Uuid;
    let id = Uuid::new_v4().to_string();
    let f = flatten_json_for_db(&data);

    sqlx::query(
        "INSERT INTO lab_results \
         (id, patient_name, patient_id, exam_type, date, sample_date, patient_age, \
          hcn, phone, resultado, data, created_by) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&f[0])
    .bind(&f[1])
    .bind(&f[2])
    .bind(&f[3])
    .bind(&f[4])
    .bind(&f[5])
    .bind(&f[6])
    .bind(&f[7])
    .bind(&f[8])
    .bind(&f[9])
    .bind(&get_created_by(&data))
    .execute(db.inner())
    .await
    .map_err(|e| format!("Error al guardar resultado: {}", e))?;

    Ok(serde_json::json!({ "id": id }))
}

#[tauri::command]
pub async fn update_result(
    db: State<'_, SqlitePool>,
    data: serde_json::Value,
) -> Result<(), String> {
    let result_id = get_id(&data);
    let f = flatten_json_for_db(&data);

    sqlx::query(
        "UPDATE lab_results SET \
         patient_name = ?, patient_id = ?, exam_type = ?, date = ?, \
         sample_date = ?, patient_age = ?, hcn = ?, phone = ?, \
         resultado = ?, data = ?, updated_at = datetime('now') \
         WHERE id = ?",
    )
    .bind(&f[0])
    .bind(&f[1])
    .bind(&f[2])
    .bind(&f[3])
    .bind(&f[4])
    .bind(&f[5])
    .bind(&f[6])
    .bind(&f[7])
    .bind(&f[8])
    .bind(&f[9])
    .bind(&result_id)
    .execute(db.inner())
    .await
    .map_err(|e| format!("Error al actualizar resultado: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_result(
    db: State<'_, SqlitePool>,
    id: String,
) -> Result<(), String> {
    sqlx::query("DELETE FROM lab_results WHERE id = ?")
        .bind(&id)
        .execute(db.inner())
        .await
        .map_err(|e| format!("Error al eliminar resultado: {}", e))?;

    Ok(())
}
