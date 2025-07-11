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
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
} from '@mui/material';
import { MoreVert as MoreVertIcon, Group as GroupIcon, Schedule as ScheduleIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import axios from '@/utils/axiosConfig';
import { evaluacionService } from '@/services/evaluacionService';
import { evaluadorService } from '@/services/evaluadorService';

interface Evaluation {
  id_evaluacion: number;
  nombre_evaluacion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  id_coordinador: number;
  id_heuristica: number;
  evaluacion_identificador: string;
  directorio: string;
}

export default function EvaluatorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  const [filterOption, setFilterOption] = useState<'withoutEnd' | 'withEnd' | 'all'>('all');

  const [evaluacion, setEvaluacion] = useState<any>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching evaluations...');
        const response = await axios.get('/evaluaciones/evaluador');
        console.log('Evaluations response:', response.data);
        setEvaluations(response.data);
        setFilteredEvaluations(response.data);
        const profileData = await evaluadorService.getProfile();
        setProfile(profileData);
        console.log('Perfil del evaluador:', profileData);
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

  // Aplicar filtros cuando cambien las evaluaciones, el término de búsqueda o el filtro de fecha
  useEffect(() => {
    let filtered = [...evaluations];

    // Filtrar por fecha de término
    if (filterOption === 'withoutEnd') {
      filtered = filtered.filter(evaluation => !evaluation.fecha_termino);
    } else if (filterOption === 'withEnd') {
      filtered = filtered.filter(evaluation => evaluation.fecha_termino);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(evaluation =>
        evaluation.nombre_evaluacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evaluation.evaluacion_identificador.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvaluations(filtered);
  }, [evaluations, searchTerm, filterOption]);

  const handleSearch = () => {
    // La búsqueda se maneja automáticamente en el useEffect
    console.log('Searching for:', searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilterOption('all');
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

  async function handleEvaluacion(id_evaluacion: number) {
    try {
      const evaluacionData = await evaluacionService.getEvaluacion(id_evaluacion);
      setEvaluacion(evaluacionData);

      if (evaluacionData && evaluacionData.directorio) {
        sessionStorage.setItem('directorio', evaluacionData.directorio);
        console.log('Directorio guardado en sessionStorage:', evaluacionData.directorio);
      } else {
        console.warn('No se encontró directorio en la evaluación:', evaluacionData);
      }
    } catch (error) {
      console.error('Error al obtener la evaluación:', error);
    }
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
                  Tus Evaluaciones Heurísticas
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Bienvenido/a, {profile?.nombre} {profile?.apellido}
                </Typography>
              </div>
              <Button variant="contained" color="primary" onClick={logout}>
                Cerrar Sesión
              </Button>
            </Paper>
          </Grid>

          {/* Search and Filters Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                {/* Filter Buttons */}
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <ToggleButtonGroup
                      value={filterOption}
                      exclusive
                      onChange={(event, newValue) => {
                        if (newValue !== null) {
                          setFilterOption(newValue as 'withoutEnd' | 'withEnd' | 'all');
                        }
                      }}
                      size="small"
                    >
                      <ToggleButton value="all">
                        MOSTRAR TODAS LAS EVALUACIONES
                      </ToggleButton>
                      <ToggleButton value="withoutEnd">
                        MOSTRAR EVALUACIONES SIN FECHA DE TÉRMINO
                      </ToggleButton>
                      <ToggleButton value="withEnd">
                        MOSTRAR EVALUACIONES CON FECHA DE TÉRMINO
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Grid>
                
                {/* Search Field */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Buscar evaluación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                </Grid>
              </Grid>
              
              {/* Clear Filters Button */}
              {(searchTerm || filterOption !== 'all') && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleClearSearch}
                  >
                    Limpiar filtros
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Evaluations List Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Evaluaciones Asignadas 
                {filteredEvaluations.length !== evaluations.length && (
                  <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                    ({filteredEvaluations.length} de {evaluations.length})
                  </Typography>
                )}
              </Typography>
              {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}
              <List>
                {filteredEvaluations.map((evaluation) => (
                  <ListItem
                    key={evaluation.id_evaluacion}
                    sx={{
                      mb: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="h6" component="div">
                          {evaluation.nombre_evaluacion}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {evaluation.evaluacion_identificador}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {`${new Date(evaluation.fecha_inicio).toLocaleDateString()} - `}
                              {evaluation.fecha_termino == null ? (
                                <Typography component="span" color="warning.main" fontWeight="medium">
                                  En progreso
                                </Typography>
                              ) : (
                                <Typography component="span" color="success.main" fontWeight="medium">
                                  {new Date(evaluation.fecha_termino).toLocaleDateString()}
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1}}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                          handleEvaluacion(evaluation.id_evaluacion);
                          router.push(`/evaluator/evaluacion/${evaluation.id_evaluacion}`);
                        }}
                      >
                        Revisar
                      </Button>
                    </Box>
                  </ListItem>
                ))}
                {filteredEvaluations.length === 0 && !error && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary" variant="h6">
                      {searchTerm || filterOption !== 'all' 
                        ? 'No se encontraron evaluaciones que coincidan con los filtros'
                        : 'No tienes evaluaciones asignadas'
                      }
                    </Typography>
                    {(searchTerm || filterOption !== 'all') && (
                      <Button 
                        variant="text" 
                        onClick={handleClearSearch}
                        sx={{ mt: 1 }}
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </Box>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
} 