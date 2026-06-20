import { invoke } from '@tauri-apps/api/core';
import type { AuthUser, UserProfile, LabResult, ExamSample, PatientLookupResult, Patient } from './definitions';

// ── Auth ──────────────────────────────────────────────────────────

export function login(username: string, password: string) {
  return invoke<AuthUser>('login', { username, password });
}

export function createUser(username: string, password: string, fullName: string, role: string) {
  return invoke<void>('create_user', { username, password, fullName, role });
}

export function updatePassword(userId: string, newPassword: string) {
  return invoke<void>('update_password', { userId, newPassword });
}

export function updatePasswordWithCurrent(userId: string, currentPassword: string, newPassword: string) {
  return invoke<void>('update_password_with_current', { userId, currentPassword, newPassword });
}

// ── Users ─────────────────────────────────────────────────────────

export function getAllUsers() {
  return invoke<UserProfile[]>('get_all_users');
}

export function updateUserRole(userId: string, newRole: string) {
  return invoke<void>('update_user_role', { userId, newRole });
}

export function toggleUserState(userId: string, disabled: boolean) {
  return invoke<void>('toggle_user_state', { userId, disabled });
}

export function deleteUser(userId: string) {
  return invoke<void>('delete_user', { userId });
}

// ── Lab Results ───────────────────────────────────────────────────

export function getResults() {
  return invoke<LabResult[]>('get_results');
}

export function getResultById(id: string) {
  return invoke<LabResult | null>('get_result_by_id', { id });
}

export function saveResult(data: Record<string, unknown>) {
  return invoke<{ id: string }>('save_result', { data });
}

export function updateResult(data: Record<string, unknown>) {
  return invoke<void>('update_result', { data });
}

export function deleteResult(id: string) {
  return invoke<void>('delete_result', { id });
}

// ── Patients ──────────────────────────────────────────────────────

export function searchPatientsByDni(prefix: string) {
  return invoke<PatientLookupResult[]>('search_patients_by_dni', { prefix });
}

export function registerPatient(dni: string, fullName: string, hcn: string | null, birthDate: string, phone: string | null, email: string | null, createdBy: string | null) {
  return invoke<void>('register_patient', { dni, fullName, hcn: hcn || '', birthDate, phone: phone || '', email: email || '', createdBy: createdBy || '' });
}

export function updatePatient(dni: string, fullName: string, hcn: string | null, birthDate: string, phone: string | null, email: string | null) {
  return invoke<void>('update_patient', { dni, fullName, hcn: hcn || '', birthDate, phone: phone || '', email: email || '' });
}

// ── Samples ───────────────────────────────────────────────────────

export function getSamplesByResultId(labResultId: string) {
  return invoke<ExamSample[]>('get_samples_by_result_id', { labResultId });
}

export function saveSample(labResultId: string, sampleNumber: number, sampleDate: string, sampleData: Record<string, unknown>, createdBy: string | null) {
  return invoke<{ id: string }>('save_sample', { labResultId, sampleNumber, sampleDate, sampleData, createdBy: createdBy || '' });
}

export function deleteSample(id: string) {
  return invoke<void>('delete_sample', { id });
}
