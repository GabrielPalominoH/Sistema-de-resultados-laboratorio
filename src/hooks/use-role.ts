import { useAuth } from '@/lib/auth';

export function useRole() {
  const { user } = useAuth();
  
  const role = user?.role ?? 'user';
  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  const canEditExam = (_examType: string): boolean => {
    return true;
  };

  const canAddSamples = (examType: string): boolean => {
    if (isAdmin) return true;
    const sampleExams = ['Examen General', 'Examen Niño', 'examen-general', 'nino'];
    return sampleExams.some(e => examType.toLowerCase().includes(e.toLowerCase()));
  };

  return {
    role,
    isAdmin,
    isUser,
    canEdit: isAdmin,
    canDelete: isAdmin,
    canManageUsers: isAdmin,
    canEditExam,
    canAddSamples,
    canCreateResult: true,
  };
}
