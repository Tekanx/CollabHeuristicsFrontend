'use client';

import { Container, Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, getDashboardPath } = useAuth();

  const handleBackToDashboard = () => {
    router.push(getDashboardPath());
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography component="h1" variant="h3" gutterBottom>
          Acceso No Autorizado
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Lo sentimos, no tienes permisos para acceder a esta página.
        </Typography>
        {user && (
          <Typography variant="body1" color="text.secondary" paragraph>
            Tu rol actual es: {user.role}
          </Typography>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleBackToDashboard}
          sx={{ mt: 3 }}
        >
          Volver al Dashboard
        </Button>
      </Box>
    </Container>
  );
} 