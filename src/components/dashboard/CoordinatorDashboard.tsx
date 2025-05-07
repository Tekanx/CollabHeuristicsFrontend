'use client';

import { useState, useEffect } from 'react';
import { Container, Typography, Button, Grid, Paper, List, ListItem, ListItemText, Box, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { MoreVert as MoreVertIcon, Group as GroupIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import Header from '@/components/Header';
import axios from '@/utils/axiosConfig';

interface Evaluacion {
  id_evaluacion: number;
  nombre_evaluacion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  evaluacion_identificador: string;
}

export default function CoordinatorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvaluaciones = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('/evaluaciones/coordinador');
        setEvaluaciones(response.data);
      } catch (err: any) {
        console.error('Error fetching evaluations:', err);
        if (err.response) {
          setError(`Error del servidor: ${err.response.data || 'Error desconocido'}`);
        } else if (err.request) {
          setError('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
        } else {
          setError('Error al intentar obtener las evaluaciones');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluaciones();
  }, []);

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography variant="h4" component="h1" gutterBottom>
                  Dashboard del Coordinador
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Bienvenido, {user?.username}
                </Typography>
              </div>
              <Button variant="contained" color="primary" onClick={logout}>
                Cerrar Sesión
              </Button>
            </Paper>
          </Grid>

          {/* Evaluaciones List */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Evaluaciones Activas
              </Typography>
              {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}
              <List>
                {evaluaciones.map((evaluacion) => (
                  <ListItem
                    key={evaluacion.id_evaluacion}
                    sx={{
                      mb: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={evaluacion.nombre_evaluacion}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {evaluacion.evaluacion_identificador}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {`${new Date(evaluacion.fecha_inicio).toLocaleDateString()} - `}
                            {evaluacion.fecha_termino == null ? 'A la fecha' : new Date(evaluacion.fecha_termino).toLocaleDateString()}
                          </Box>
                        </Box>
                      }
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => router.push(`/coordinator/evaluacion/${evaluacion.id_evaluacion}`)}
                    >
                      Gestionar
                    </Button>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </ListItem>
                ))}
                {evaluaciones.length === 0 && !error && (
                  <Typography color="textSecondary" align="center">
                    No hay evaluaciones activas
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Statistics Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Estadísticas
              </Typography>
              <Typography color="textSecondary">
                Próximamente
              </Typography>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Acciones Rápidas
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => {/* TODO: Implement new evaluation creation */}}
              >
                Nueva Evaluación
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => {/* TODO: Implement evaluator management */}}
              >
                Gestionar Evaluadores
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
} 