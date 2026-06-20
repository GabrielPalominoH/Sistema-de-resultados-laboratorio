use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::path::PathBuf;
use tauri::Manager;

/// Initialize the SQLite database, creating the file and running migrations.
pub async fn init_database(app: &tauri::AppHandle) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let app_dir: PathBuf = app.path().app_config_dir()?;
    std::fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("laboratorio.db");

    let opts = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(opts)
        .await?;

    // Run migrations — CREATE TABLE IF NOT EXISTS for idempotency
    run_migrations(&pool).await?;

    log::info!("Database initialized at: {}", db_path.display());
    Ok(pool)
}

async fn run_migrations(pool: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS user_profiles (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            disabled INTEGER NOT NULL DEFAULT 0,
            must_change_password INTEGER NOT NULL DEFAULT 0,
            full_name TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS lab_results (
            id TEXT PRIMARY KEY,
            patient_name TEXT NOT NULL DEFAULT '',
            patient_id TEXT NOT NULL DEFAULT '',
            exam_type TEXT NOT NULL DEFAULT '',
            date TEXT NOT NULL DEFAULT '',
            sample_date TEXT DEFAULT NULL,
            patient_age TEXT DEFAULT NULL,
            hcn TEXT DEFAULT NULL,
            phone TEXT DEFAULT NULL,
            resultado TEXT DEFAULT NULL,
            data TEXT DEFAULT NULL,
            created_by TEXT DEFAULT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT NULL
        )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            dni TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL DEFAULT '',
            hcn TEXT DEFAULT NULL,
            birth_date TEXT NOT NULL DEFAULT '',
            phone TEXT DEFAULT NULL,
            email TEXT DEFAULT NULL,
            created_by TEXT DEFAULT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
    )
    .execute(pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS exam_samples (
            id TEXT PRIMARY KEY,
            lab_result_id TEXT NOT NULL,
            sample_number INTEGER NOT NULL DEFAULT 1,
            sample_date TEXT NOT NULL DEFAULT '',
            sample_data TEXT DEFAULT NULL,
            created_by TEXT DEFAULT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (lab_result_id) REFERENCES lab_results(id) ON DELETE CASCADE
        )",
    )
    .execute(pool)
    .await?;

    // Create user_profiles index for faster login lookups
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username)",
    )
    .execute(pool)
    .await?;

    // Create patients index for faster DNI search
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_patients_dni ON patients(dni)",
    )
    .execute(pool)
    .await?;

    // Create exam_samples index for faster lookups by lab_result_id
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_exam_samples_result ON exam_samples(lab_result_id)",
    )
    .execute(pool)
    .await?;

    log::info!("Database migrations complete");
    Ok(())
}
