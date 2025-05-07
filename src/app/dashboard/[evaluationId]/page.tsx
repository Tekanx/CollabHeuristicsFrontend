'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardRedirect() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Redirigir a la nueva ruta basada en el rol del usuario
      const newPath = user.role === 'EVALUADOR' 
        ? `/evaluator/evaluacion/${params.evaluationId}`
        : `/coordinator/evaluacion/${params.evaluationId}`;
      
      router.replace(newPath);
    }
  }, [params.evaluationId, router, user]);

  return null; // No renderiza nada mientras redirige
} 