use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use tauri::State;
use bcrypt::{hash, verify, DEFAULT_COST};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthUser {
    pub id: String,
    pub username: String,
    pub role: String,
    pub full_name: Option<String>,
    pub must_change_password: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: String,
    pub username: String,
    pub role: String,
    pub full_name: Option<String>,
    pub disabled: bool,
    pub must_change_password: bool,
    pub created_at: Option<String>,
}

#[tauri::command]
pub async fn login(
    db: State<'_, SqlitePool>,
    username: String,
    password: String,
) -> Result<AuthUser, String> {
    let row = sqlx::query(
        "SELECT id, username, password_hash, role, full_name, disabled, must_change_password \
         FROM user_profiles WHERE username = ?",
    )
    .bind(&username)
    .fetch_optional(db.inner())
    .await
    .map_err(|e| format!("Error al buscar usuario: {}", e))?;

    let row = match row {
        Some(r) => r,
        None => return Err("Credenciales incorrectas.".to_string()),
    };

    let id: String = row.get(0);
    let _username: String = row.get(1);
    let password_hash: String = row.get(2);
    let role: String = row.get(3);
    let full_name: Option<String> = row.get(4);
    let disabled: bool = row.get(5);
    let must_change_password: bool = row.get(6);

    if disabled {
        return Err("Usuario deshabilitado. Contacte al administrador.".to_string());
    }

    let valid = verify(&password, &password_hash)
        .map_err(|e| format!("Error de verificacion: {}", e))?;
    if !valid {
        return Err("Credenciales incorrectas.".to_string());
    }

    Ok(AuthUser {
        id,
        username,
        role,
        full_name: full_name.filter(|s| !s.is_empty()),
        must_change_password,
    })
}

#[tauri::command]
pub async fn create_user(
    db: State<'_, SqlitePool>,
    username: String,
    password: String,
    full_name: String,
    role: String,
) -> Result<(), String> {
    let id = Uuid::new_v4().to_string();
    let password_hash =
        hash(&password, DEFAULT_COST).map_err(|e| format!("Error al hashear password: {}", e))?;

    sqlx::query(
        "INSERT INTO user_profiles (id, username, password_hash, role, must_change_password, full_name) \
         VALUES (?, ?, ?, ?, 1, ?)",
    )
    .bind(&id)
    .bind(&username)
    .bind(&password_hash)
    .bind(&role)
    .bind(&full_name)
    .execute(db.inner())
    .await
    .map_err(|e| {
        let msg = e.to_string();
        if msg.contains("UNIQUE") {
            "Ya existe un usuario con ese nombre de usuario.".to_string()
        } else {
            format!("Error al crear usuario: {}", msg)
        }
    })?;

    Ok(())
}

#[tauri::command]
pub async fn update_password(
    db: State<'_, SqlitePool>,
    user_id: String,
    new_password: String,
) -> Result<(), String> {
    let password_hash =
        hash(&new_password, DEFAULT_COST).map_err(|e| format!("Error al hashear password: {}", e))?;

    sqlx::query("UPDATE user_profiles SET password_hash = ?, must_change_password = 0 WHERE id = ?")
        .bind(&password_hash)
        .bind(&user_id)
        .execute(db.inner())
        .await
    .map_err(|e| format!("Error al actualizar password: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn has_users(db: State<'_, SqlitePool>) -> Result<bool, String> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM user_profiles")
        .fetch_one(db.inner())
        .await
        .map_err(|e| format!("Error al contar usuarios: {}", e))?;

    Ok(count.0 > 0)
}

#[tauri::command]
pub async fn update_password_with_current(
    db: State<'_, SqlitePool>,
    user_id: String,
    current_password: String,
    new_password: String,
) -> Result<(), String> {
    let row = sqlx::query("SELECT password_hash FROM user_profiles WHERE id = ?")
        .bind(&user_id)
        .fetch_optional(db.inner())
        .await
        .map_err(|e| format!("Error al buscar usuario: {}", e))?;

    let row = match row {
        Some(r) => r,
        None => return Err("Usuario no encontrado.".to_string()),
    };

    let password_hash: String = row.get(0);

    let valid = verify(&current_password, &password_hash)
        .map_err(|e| format!("Error de verificacion: {}", e))?;
    if !valid {
        return Err("La contraseña actual es incorrecta.".to_string());
    }

    let new_hash =
        hash(&new_password, DEFAULT_COST).map_err(|e| format!("Error al hashear password: {}", e))?;

    sqlx::query(
        "UPDATE user_profiles SET password_hash = ?, must_change_password = 0 WHERE id = ?",
    )
    .bind(&new_hash)
    .bind(&user_id)
    .execute(db.inner())
    .await
    .map_err(|e| format!("Error al actualizar password: {}", e))?;

    Ok(())
}
