'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Box, 
  Card, 
  CardContent, 
  CardActions,
  TextField,
  InputAdornment,
  CircularProgress, 
  Divider,
  Pagination,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import axios from '@/utils/axiosConfig';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { coordinadorService } from '@/services/coordinadorService';

interface Evaluacion {
  id_evaluacion: number;
  nombre_evaluacion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  evaluacion_identificador: string;
  cantidadEvaluadores?: number;
}

export default function CoordinatorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [filteredEvaluaciones, setFilteredEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<'withoutEnd' | 'withEnd' | 'all'>('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    const fetchEvaluaciones = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Iniciando petición a /evaluaciones/coordinador');
        console.log('Token actual:', localStorage.getItem('token')?.substring(0, 20) + '...');
        console.log('Usuario actual:', user);
        
        const response = await axios.get('/evaluaciones/coordinador');
        console.log('Respuesta exitosa:', response.data);
        const profileData = await coordinadorService.getProfile();
        setProfile(profileData);
        console.log('Perfil del coordinador:', profileData);
        // Agregar datos adicionales como cantidad de evaluadores (puede venir del backend)
        const evaluacionesConDatos = await Promise.all(
          response.data.map(async (evaluacion: Evaluacion) => {
            try {
              // Obtener la cantidad de evaluadores asignados a cada evaluación
              const evaluadoresResponse = await axios.get(`/evaluaciones/${evaluacion.id_evaluacion}/evaluadores`);
              return {
                ...evaluacion,
                cantidadEvaluadores: evaluadoresResponse.data.length
              };
            } catch {
              return {
                ...evaluacion,
                cantidadEvaluadores: 0
              };
            }
          })
        );
        
        setEvaluaciones(evaluacionesConDatos);
        setFilteredEvaluaciones(evaluacionesConDatos);
      } catch (err: any) {
        console.error('Error fetching evaluations:', err);
        console.error('Detalles completos del error:', {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers,
          config: err.config
        });
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
  }, [user]);

  // Filtrar evaluaciones basadas en la búsqueda y el toggle
  useEffect(() => {
    let filtered = [...evaluaciones];
    
    console.log('🔍 Aplicando filtros...');
    console.log('📊 Total evaluaciones:', filtered.length);
    console.log('📊 Filtro seleccionado:', filterOption);
    
    // Debug: mostrar información de fechas de término
    filtered.forEach((evaluacion, index) => {
      console.log(`📋 Evaluación ${index + 1}:`, {
        nombre: evaluacion.nombre_evaluacion,
        fecha_termino: evaluacion.fecha_termino,
        tipo_fecha_termino: typeof evaluacion.fecha_termino,
        es_null: evaluacion.fecha_termino === null,
        es_undefined: evaluacion.fecha_termino === undefined,
        es_string_vacia: evaluacion.fecha_termino === '',
        fecha_inicio: evaluacion.fecha_inicio
      });
    });
    
    // Apply search filter if there's a search query
    if (searchQuery.trim() !== '') {
      const searchTerms = searchQuery.toLowerCase().trim().split(' ');
      filtered = filtered.filter(evaluacion => {
        const searchText = `${evaluacion.nombre_evaluacion} ${evaluacion.descripcion} ${evaluacion.evaluacion_identificador}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
    }
    
    // Apply filter based on selected option - MEJORADA LA LÓGICA
    if (filterOption === 'withoutEnd') {
      // Evaluaciones SIN fecha de término (null, undefined, string vacío)
      filtered = filtered.filter(evaluacion => {
        const sinFechaTermino = !evaluacion.fecha_termino || 
                               evaluacion.fecha_termino === null || 
                               evaluacion.fecha_termino === undefined || 
                               evaluacion.fecha_termino === '' ||
                               evaluacion.fecha_termino.trim() === '';
        console.log(`🔎 Evaluación "${evaluacion.nombre_evaluacion}" - Sin fecha término: ${sinFechaTermino}`);
        return sinFechaTermino;
      });
    } else if (filterOption === 'withEnd') {
      // Evaluaciones CON fecha de término (valores válidos)
      filtered = filtered.filter(evaluacion => {
        const conFechaTermino = evaluacion.fecha_termino && 
                               evaluacion.fecha_termino !== null && 
                               evaluacion.fecha_termino !== undefined && 
                               evaluacion.fecha_termino !== '' &&
                               evaluacion.fecha_termino.trim() !== '';
        console.log(`🔎 Evaluación "${evaluacion.nombre_evaluacion}" - Con fecha término: ${conFechaTermino}`);
        return conFechaTermino;
      });
    }
    // For 'all' option, we don't filter anything
    
    console.log('📊 Evaluaciones después del filtro:', filtered.length);
    
    // Sort by date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_inicio);
      const dateB = new Date(b.fecha_inicio);
      return dateB.getTime() - dateA.getTime();
    });
    
    setFilteredEvaluaciones(filtered);
    setPage(1); // Resetear a la primera página cuando cambian los filtros
  }, [searchQuery, evaluaciones, filterOption]);

  // Función para formatear la fecha - MEJORADA PARA MANEJAR ZONAS HORARIAS
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
      return 'N/A';
    }
    
    try {
      console.log('📅 Formateando fecha:', dateString);
      
      // Si la fecha viene sin zona horaria, asumimos que es local
      let date: Date;
      
      if (dateString.includes('T')) {
        // Es una fecha ISO con hora
        date = new Date(dateString);
      } else {
        // Es solo una fecha (YYYY-MM-DD), tratarla como local
        const [year, month, day] = dateString.split('-');
        date = new Date(Number(year), Number(month) - 1, Number(day));
      }
      
      console.log('📅 Fecha parseada:', date);
      console.log('📅 Fecha en string local:', date.toLocaleDateString('es-ES'));
      
      const formattedDate = date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        timeZone: 'America/Santiago' // Zona horaria de Chile
      });
      
      console.log('📅 Fecha formateada:', formattedDate);
      
      return formattedDate;
    } catch (error) {
      console.error('❌ Error al formatear fecha:', dateString, error);
      return 'Fecha inválida';
    }
  };

  // Manejador para ir a la vista detallada de una evaluación
  const handleViewEvaluation = (evaluacionId: number) => {
    router.push(`/coordinator/evaluacion/${evaluacionId}`);
  };

  // Paginación
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Calcular número total de páginas
  const totalPages = Math.ceil(filteredEvaluaciones.length / itemsPerPage);
  
  // Obtener elementos para la página actual
  const currentItems = filteredEvaluaciones.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography variant="h4" component="h1" gutterBottom>
                  Dashboard del Coordinador
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

          {/* Búsqueda y filtros */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  Tus Evaluaciones Heurísticas
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => router.push('/coordinator/evaluacion/registrar-evaluacion')}
                >
                  Crear Nueva Evaluación
                </Button>
                <TextField
                  placeholder="Buscar evaluación..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ width: 500 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                <ToggleButtonGroup
                  value={filterOption}
                  exclusive
                  onChange={(event, newValue) => {
                    if (newValue !== null) {
                      setFilterOption(newValue as 'all' | 'withoutEnd' | 'withEnd' );
                    }
                  }}
                >
                  <ToggleButton value="all">MOSTRAR TODAS LAS EVALUACIONES</ToggleButton>
                  <ToggleButton value="withoutEnd">MOSTRAR EVALUACIONES SIN FECHA DE TÉRMINO</ToggleButton>
                  <ToggleButton value="withEnd">MOSTRAR EVALUACIONES CON FECHA DE TÉRMINO</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Paper>
          </Grid>
          {/* Comentado temporalmente */}
          {/* Acciones rápidas
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Acciones Rápidas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => {}}
                  >
                    Crear Nueva Evaluación
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          */}
          
          {/* Contenido principal */}
          <Grid item xs={12}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
              </Paper>
            ) : filteredEvaluaciones.length > 0 ? (
              <>
                {/* Tarjetas de evaluaciones */}
                <Grid container spacing={3}>
                  {currentItems.map((evaluacion) => (
                    <Grid item xs={12} md={6} lg={4} key={evaluacion.id_evaluacion}>
                      <Card 
                        elevation={3}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 20px -10px rgba(33, 150, 243, 0.3)'
                          }
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="div" gutterBottom noWrap>
                            {evaluacion.nombre_evaluacion}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {evaluacion.descripcion || 'Sin descripción'}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <GroupIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">
                              {evaluacion.cantidadEvaluadores || 0} evaluadores
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">
                              Inicio: {formatDate(evaluacion.fecha_inicio)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            {/* ESTADO MEJORADO DE LA EVALUACIÓN */}
                            {evaluacion.fecha_termino && 
                             evaluacion.fecha_termino !== null && 
                             evaluacion.fecha_termino !== undefined && 
                             evaluacion.fecha_termino !== '' &&
                             evaluacion.fecha_termino.trim() !== '' ? (
                              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                Finalizada: {formatDate(evaluacion.fecha_termino)}
                              </Typography>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                                En progreso - Sin fecha de término
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button 
                            variant="contained" 
                            fullWidth
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => handleViewEvaluation(evaluacion.id_evaluacion)}
                          >
                            Gestionar
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                {/* Paginación */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination 
                      count={totalPages} 
                      page={page} 
                      onChange={handlePageChange} 
                      color="primary" 
                    />
                  </Box>
                )}
              </>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>No se encontraron evaluaciones</Typography>
              </Paper>
            )}
          </Grid>
          
        </Grid>
      </Container>
    </>
  );
} 