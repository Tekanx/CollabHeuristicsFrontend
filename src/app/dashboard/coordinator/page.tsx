'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CoordinatorDashboard from '@/components/dashboard/CoordinatorDashboard';

export default function CoordinatorDashboardPage() {
  return (
    <ProtectedRoute requiredRole="COORDINADOR">
      <CoordinatorDashboard />
    </ProtectedRoute>
  );
} 