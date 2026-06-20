mod commands;
mod db;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Set up logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize the database synchronously during setup
            let handle = app.handle().clone();
            let pool = tauri::async_runtime::block_on(db::init_database(&handle))
                .expect("Failed to initialize database");

            // Make the pool available to all commands
            app.manage(pool);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::login,
            commands::auth::create_user,
            commands::auth::update_password,
            commands::auth::update_password_with_current,
            commands::auth::has_users,
            // Users
            commands::users::get_all_users,
            commands::users::update_user_role,
            commands::users::toggle_user_state,
            commands::users::delete_user,
            // Results
            commands::results::get_results,
            commands::results::get_result_by_id,
            commands::results::save_result,
            commands::results::update_result,
            commands::results::delete_result,
            // Patients
            commands::patients::search_patients_by_dni,
            commands::patients::register_patient,
            commands::patients::update_patient,
            // Samples
            commands::samples::get_samples_by_result_id,
            commands::samples::save_sample,
            commands::samples::delete_sample,
            // Export
            commands::export::export_excel,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
