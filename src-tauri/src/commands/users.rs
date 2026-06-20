use sqlx::{Row, SqlitePool};
use tauri::State;

use super::auth::UserProfile;

#[tauri::command]
pub async fn get_all_users(
    db: State<'_, SqlitePool>,
) -> Result<Vec<UserProfile>, String> {
    let rows = sqlx::query(
        "SELECT id, username, role, full_name, disabled, must_change_password, created_at \
         FROM user_profiles ORDER BY created_at DESC",
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| format!("Error al obtener usuarios: {}", e))?;

    let users: Vec<UserProfile> = rows
        .iter()
        .map(|row| {
            let full_name: Option<String> = row.get(3);
            let created_at: Option<String> = row.get(6);
            UserProfile {
                id: row.get(0),
                username: row.get(1),
                role: row.get(2),
                full_name: full_name.filter(|s| !s.is_empty()),
                disabled: row.get(4),
                must_change_password: row.get(5),
                created_at: created_at.filter(|s| !s.is_empty()),
            }
        })
        .collect();

    Ok(users)
}

#[tauri::command]
pub async fn update_user_role(
    db: State<'_, SqlitePool>,
    user_id: String,
    new_role: String,
) -> Result<(), String> {
    sqlx::query("UPDATE user_profiles SET role = ? WHERE id = ?")
        .bind(&new_role)
        .bind(&user_id)
        .execute(db.inner())
        .await
        .map_err(|e| format!("Error al actualizar rol: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn toggle_user_state(
    db: State<'_, SqlitePool>,
    user_id: String,
    disabled: bool,
) -> Result<(), String> {
    sqlx::query("UPDATE user_profiles SET disabled = ? WHERE id = ?")
        .bind(disabled)
        .bind(&user_id)
        .execute(db.inner())
        .await
        .map_err(|e| format!("Error al cambiar estado del usuario: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_user(
    db: State<'_, SqlitePool>,
    user_id: String,
) -> Result<(), String> {
    sqlx::query("DELETE FROM user_profiles WHERE id = ?")
        .bind(&user_id)
        .execute(db.inner())
        .await
        .map_err(|e| format!("Error al eliminar usuario: {}", e))?;

    Ok(())
}
