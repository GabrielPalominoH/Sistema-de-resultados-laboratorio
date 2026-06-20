use chrono::Datelike;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::State;

fn calc_age(birth_date: &str) -> i64 {
    if let Ok(birth) = chrono::NaiveDate::parse_from_str(birth_date, "%Y-%m-%d") {
        let today = chrono::Local::now().naive_local().date();
        let mut age = today.year() - birth.year();
        if (today.month(), today.day()) < (birth.month(), birth.day()) {
            age -= 1;
        }
        age as i64
    } else {
        0
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatientLookupResult {
    pub dni: Option<String>,
    pub full_name: String,
    pub hcn: Option<String>,
    pub age: i64,
    pub phone: Option<String>,
    pub birth_date: Option<String>,
}

#[tauri::command]
pub async fn search_patients_by_dni(
    db: State<'_, SqlitePool>,
    prefix: String,
) -> Result<Vec<PatientLookupResult>, String> {
    let rows = sqlx::query(
        "SELECT dni, full_name, hcn, birth_date, phone FROM patients WHERE dni LIKE ? ORDER BY dni LIMIT 8",
    )
    .bind(format!("{}%", prefix))
    .fetch_all(db.inner())
    .await
    .map_err(|e| format!("Error al buscar pacientes: {}", e))?;

    let results: Vec<PatientLookupResult> = rows
        .iter()
        .map(|row| {
            let birth_date: String = row.get(3);
            PatientLookupResult {
                dni: Some(row.get(0)),
                full_name: row.get(1),
                hcn: {
                    let h: Option<String> = row.get(2);
                    h.filter(|s| !s.is_empty())
                },
                age: calc_age(&birth_date),
                phone: {
                    let p: Option<String> = row.get(4);
                    p.filter(|s| !s.is_empty())
                },
                birth_date: if birth_date.is_empty() {
                    None
                } else {
                    Some(birth_date)
                },
            }
        })
        .collect();

    Ok(results)
}

#[tauri::command]
pub async fn register_patient(
    db: State<'_, SqlitePool>,
    dni: String,
    full_name: String,
    hcn: Option<String>,
    birth_date: String,
    phone: Option<String>,
    email: Option<String>,
    created_by: Option<String>,
) -> Result<(), String> {
    use uuid::Uuid;
    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO patients (id, dni, full_name, hcn, birth_date, phone, email, created_by) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&dni)
    .bind(&full_name)
    .bind(hcn.unwrap_or_default())
    .bind(&birth_date)
    .bind(phone.unwrap_or_default())
    .bind(email.unwrap_or_default())
    .bind(created_by.unwrap_or_default())
    .execute(db.inner())
    .await
    .map_err(|e| {
        let msg = e.to_string();
        if msg.contains("UNIQUE") {
            "Ya existe un paciente registrado con ese DNI.".to_string()
        } else {
            format!("Error al registrar paciente: {}", msg)
        }
    })?;

    Ok(())
}

#[tauri::command]
pub async fn update_patient(
    db: State<'_, SqlitePool>,
    dni: String,
    full_name: String,
    hcn: Option<String>,
    birth_date: String,
    phone: Option<String>,
    email: Option<String>,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE patients SET full_name = ?, hcn = ?, birth_date = ?, phone = ?, email = ? WHERE dni = ?",
    )
    .bind(&full_name)
    .bind(hcn.unwrap_or_default())
    .bind(&birth_date)
    .bind(phone.unwrap_or_default())
    .bind(email.unwrap_or_default())
    .bind(&dni)
    .execute(db.inner())
    .await
    .map_err(|e| format!("Error al actualizar paciente: {}", e))?;

    Ok(())
}
