'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, Button } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export default function CoordinatorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'Coordinador') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
        Dashboard del Coordinador
      </Typography>
      <Typography variant="h6" gutterBottom>
        Bienvenido, {user.username}
      </Typography>
      <Button variant="contained" color="primary" onClick={logout} sx={{ mt: 2 }}>
        Cerrar Sesión
      </Button>
    </Container>
  );
} 