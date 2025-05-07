'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Box,
  IconButton,
  Grid,
  Stack,
  CircularProgress,
} from '@mui/material';
import { MoreVert as MoreVertIcon, Group as GroupIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import axios from '@/utils/axiosConfig';

interface Evaluation {
  id_evaluacion: number;
  nombre_evaluacion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_termino: string;
  id_coordinador: number;
  id_heuristica: number;
  evaluacion_identificador: string;
}

export default function EvaluatorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching evaluations...');
        const response = await axios.get('/evaluaciones/evaluador');
        console.log('Evaluations response:', response.data);
        setEvaluations(response.data);
      } catch (err: any) {
        console.error('Error fetching evaluations:', err);
        if (err.response) {
          // El servidor respondió con un estado de error
          setError(`Error del servidor: ${err.response.data || 'Error desconocido'}`);
        } else if (err.request) {
          // La solicitud se hizo pero no se recibió respuesta
          setError('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
        } else {
          // Algo falló al configurar la solicitud
          setError('Error al intentar obtener las evaluaciones');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchTerm);
  };

  const handleLeaveEvaluation = () => {
    // Implement leave evaluation functionality
    console.log('Leaving evaluation');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Welcome and Logout Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography variant="h4" component="h1" gutterBottom>
                  Dashboard del Evaluador
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

          {/* Search and Actions Section*/}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              {/* Search Section - 2/3 width */}
              <Grid item xs={8}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Buscar Evaluación
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      placeholder="Nombre de evaluación"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                    >
                      Buscar Evaluación
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* Actions Section - 1/3 width */}
              <Grid item xs={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Acciones
                  </Typography>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={handleLeaveEvaluation}
                    >
                      Salir de una evaluación heurística
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/*  Evaluations List Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tus Evaluaciones Asignadas
              </Typography>
              {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}
              <List>
                {evaluations.map((evaluation) => (
                  <ListItem
                    key={evaluation.id_evaluacion}
                    sx={{
                      mb: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={evaluation.nombre_evaluacion}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {evaluation.evaluacion_identificador}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {`${new Date(evaluation.fecha_inicio).toLocaleDateString()} - `} {evaluation.fecha_termino == null ? 'A la fecha' : `${new Date(evaluation.fecha_termino).toLocaleDateString()}`}
                            
                          </Box>
                        </Box>
                      }
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => router.push(`/evaluator/evaluacion/${evaluation.id_evaluacion}`)}
                    >
                      Revisar
                    </Button>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </ListItem>
                ))}
                {evaluations.length === 0 && !error && (
                  <Typography color="textSecondary" align="center">
                    No tienes evaluaciones asignadas
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
} 