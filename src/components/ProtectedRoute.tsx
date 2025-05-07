'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'COORDINADOR' | 'EVALUADOR';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }
  }, [user, requiredRole, router]);

  // Si no hay usuario, no renderizamos nada mientras se redirecciona
  if (!user) {
    return null;
  }

  // Si se requiere un rol específico y el usuario no lo tiene, no renderizamos nada
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
} 