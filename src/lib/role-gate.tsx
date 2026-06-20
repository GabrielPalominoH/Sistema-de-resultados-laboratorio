import type { ReactNode } from 'react';
import { useAuth } from './auth';

export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <>{fallback}</>;
  return <>{children}</>;
}

export function UserOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'user') return <>{fallback}</>;
  return <>{children}</>;
}

export function RoleGate({ allowedRoles, children, fallback = null }: { allowedRoles: string[]; children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
