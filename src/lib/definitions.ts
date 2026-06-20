export type AuthUser = {
  id: string;
  username: string;
  role: 'admin' | 'user';
  fullName?: string;
  mustChangePassword: boolean;
};

export type UserProfile = {
  id: string;
  username: string;
  role: string;
  fullName?: string;
  disabled: boolean;
  mustChangePassword: boolean;
  createdAt?: string;
};

export type LabResult = {
  id: string;
  patientName: string;
  patientId: string;
  examType: string;
  date: string;
  sampleDate?: string;
  patientAge?: string;
  hcn?: string;
  phone?: string;
  resultado?: string;
  data?: Record<string, unknown>;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type ExamSample = {
  id: string;
  labResultId: string;
  sampleNumber: number;
  sampleDate: string;
  sampleData: Record<string, unknown>;
  createdBy?: string;
  createdAt?: string;
};

export type PatientLookupResult = {
  dni?: string;
  fullName: string;
  hcn?: string;
  age: number;
  phone?: string;
  birthDate?: string;
};

export type Patient = {
  id: string;
  dni: string;
  fullName: string;
  hcn?: string;
  birthDate: string;
  phone?: string;
  email?: string;
  createdBy?: string;
  createdAt?: string;
};

export type CreatePatientInput = {
  dni: string;
  fullName: string;
  hcn?: string;
  birthDate: string;
  phone?: string;
  email?: string;
};

export type FormFieldDefinition = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  description?: string;
  suffix?: string;
  defaultValue?: string | number;
};

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
};
