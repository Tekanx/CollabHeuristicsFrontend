'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import EvaluatorDashboard from '@/components/dashboard/EvaluatorDashboard';

export default function EvaluatorDashboardPage() {
  return (
    <ProtectedRoute requiredRole="EVALUADOR">
      <EvaluatorDashboard />
    </ProtectedRoute>
  );
} 