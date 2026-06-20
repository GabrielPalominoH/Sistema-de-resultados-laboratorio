import { useRole } from '@/hooks/use-role';
import type { ReactNode } from 'react';

interface RoleGateProps {
  requiredRole: 'admin' | 'user';
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ requiredRole, children, fallback = null }: RoleGateProps) {
  const { role, isAdmin } = useRole();

  if (requiredRole === 'admin' && isAdmin) {
    return <>{children}</>;
  }

  if (requiredRole === 'user' && role === 'user') {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = useRole();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}

interface UserOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function UserOnly({ children, fallback = null }: UserOnlyProps) {
  const { isUser } = useRole();
  return isUser ? <>{children}</> : <>{fallback}</>;
}
