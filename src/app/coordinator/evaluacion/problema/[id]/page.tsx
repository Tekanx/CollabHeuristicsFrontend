'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert
} from '@mui/material';
import Header from '@/components/Header';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Problema } from '@/components/interface/Problema';
import { problemaService } from '@/services/problemaService';
import { evaluacionService } from '@/services/evaluacionService';
import { formatImagePath } from '@/utils/imageUtils';
import { Historico_problema } from '@/components/interface/Historico_problema';

interface ProblemaAPI {
  id_problema: number;
  fk_evaluacion: number;
  nombre_problema: string;
  numero_problema: number;
  descripcion_problema: string;
  fk_heuristica_incumplida: number;
  ejemplo_ocurrencia: string;
  url_imagen: string;
  autor?: string;
}

interface PuntuacionEvaluador {
  id_evaluador: number;
  nombre_evaluador: string;
  apellido_evaluador: string;
  probabilidad: number;
  severidad: number;
  criticidad: number;
}

const HEURISTICAS_NIELSEN = [
  { id: 1, nombre: 'Visibilidad del estado del sistema' },
  { id: 2, nombre: 'Correspondencia entre el sistema y el mundo real' },
  { id: 3, nombre: 'Control y libertad del usuario' },
  { id: 4, nombre: 'Consistencia y estándares' },
  { id: 5, nombre: 'Prevención de errores' },
  { id: 6, nombre: 'Reconocimiento antes que recuerdo' },
  { id: 7, nombre: 'Flexibilidad y eficiencia de uso' },
  { id: 8, nombre: 'Diseño estético y minimalista' },
  { id: 9, nombre: 'Ayuda a los usuarios a reconocer, diagnosticar y recuperarse de errores' },
  { id: 10, nombre: 'Ayuda y documentación' },
];

export default function CoordinatorProblemaPage() {
  const params = useParams();
  const router = useRouter();
  
  const [problema, setProblema] = useState<Problema | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPuntuaciones, setLoadingPuntuaciones] = useState(false);
  const [historico, setHistorico] = useState<Historico_problema[]>([]);
  const [puntuaciones, setPuntuaciones] = useState<PuntuacionEvaluador[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!params.id) {
          throw new Error('ID del problema no proporcionado');
        }

        // Cargar datos básicos del problema
        const evaluacionId = await evaluacionService.getEvaluacionByProblema(Number(params.id));
        console.log("Evaluación ID:", evaluacionId);
        
        const response = await problemaService.getProblema(Number(params.id));
        const rawProblemaData = response as unknown as ProblemaAPI;
        
        if (!rawProblemaData) {
          throw new Error('No se pudo cargar el problema');
        }

        console.log("Problema raw data:", rawProblemaData);

        // Transform API data to Problema interface
        const problemaData: Problema = {
          id: rawProblemaData.id_problema,
          id_evaluacion: rawProblemaData.fk_evaluacion,
          identificador: evaluacionId.evaluacion_identificador,
          numeroProblema: rawProblemaData.numero_problema,
          nombreProblema: rawProblemaData.nombre_problema || '',
          descripcion: rawProblemaData.descripcion_problema || '',
          heuristicaIncumplida: rawProblemaData.fk_heuristica_incumplida ? `${rawProblemaData.fk_heuristica_incumplida}` : '',
          ejemploOcurrencia: rawProblemaData.ejemplo_ocurrencia || '',
          imagen: rawProblemaData.url_imagen || '',
          autor: rawProblemaData.autor || ''
        };

        console.log("Problema procesado:", problemaData);
        setProblema(problemaData);
        
        // Cargar histórico del problema
        try {
          const historicoData = await problemaService.getHistoricoProblema(Number(params.id));
          console.log("Histórico del problema:", historicoData);
          setHistorico(historicoData || []);
        } catch (historicoError) {
          console.error("Error al cargar el histórico:", historicoError);
          setHistorico([]);
        }

        // Cargar puntuaciones de evaluadores para este problema
        await fetchPuntuacionesProblema(Number(params.id));

      } catch (error) {
        console.error("Error al cargar los datos:", error);
        setError(error instanceof Error ? error.message : 'Error desconocido al cargar los datos');
        setProblema(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const fetchPuntuacionesProblema = async (problemaId: number) => {
    try {
      setLoadingPuntuaciones(true);
      console.log('🔍 Cargando puntuaciones para problema:', problemaId);
      
      // Usar el endpoint similar al de Resumen.tsx
      const puntuacionesData = await problemaService.getPuntuacionesProblema(problemaId);
      
      if (puntuacionesData && puntuacionesData.length > 0) {
        const puntuacionesProcesadas = puntuacionesData.map((row: any[]) => ({
          id_evaluador: row[0],
          nombre_evaluador: row[1] || 'Sin nombre',
          apellido_evaluador: row[2] || '',
          probabilidad: row[3] || 0,
          severidad: row[4] || 0,
          criticidad: row[5] || 0,
        }));
        
        console.log('✅ Puntuaciones procesadas:', puntuacionesProcesadas);
        setPuntuaciones(puntuacionesProcesadas);
      } else {
        console.log('⚠️ No se encontraron puntuaciones');
        setPuntuaciones([]);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar puntuaciones:', error);
      setPuntuaciones([]);
    } finally {
      setLoadingPuntuaciones(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Obtener el nombre del principio por su número
  const getPrincipioNombre = (numeroPrincipio: string | undefined) => {
    if (!numeroPrincipio) return "No especificado";
    
    const numero = parseInt(numeroPrincipio);
    if (isNaN(numero)) return numeroPrincipio;
    
    const heuristica = HEURISTICAS_NIELSEN.find(h => h.id === numero);
    return heuristica ? heuristica.nombre : `Principio ${numero}`;
  };

  // Función para obtener el color del chip según el valor
  const getChipColor = (valor: number): { color: string; bgcolor: string } => {
    if (valor === 0) return { color: '#666', bgcolor: '#f5f5f5' };
    if (valor <= 2) return { color: '#2e7d32', bgcolor: '#e8f5e8' };
    if (valor === 3) return { color: '#ef6c00', bgcolor: '#fff3e0' };
    return { color: '#d32f2f', bgcolor: '#ffebee' };
  };

  const renderBreadcrumbs = () => {
    return (
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            router.push('/dashboard/coordinator');
          }}
        >
          Dashboard
        </Link>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            router.back();
          }}
        >
          Evaluación
        </Link>
        <Typography color="text.primary">
          Problema {problema?.numeroProblema}
        </Typography>
      </Breadcrumbs>
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error
            </Typography>
            <Typography color="error.main">
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.back()}
              sx={{ mt: 2 }}
            >
              Volver atrás
            </Button>
          </Paper>
        </Container>
      </>
    );
  }

  if (!problema) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Problema no encontrado
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.back()}
              sx={{ mt: 2 }}
            >
              Volver atrás
            </Button>
          </Paper>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {renderBreadcrumbs()}
        <Paper sx={{ p: 3, position: 'relative' }}>
          {/* Botones de acción */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            mt: 1
          }}>
            {/* Información a la izquierda */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Vista de solo lectura para coordinador">
                <IconButton 
                  sx={{ 
                    color: '#0057B7',
                    bgcolor: 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected'
                    }
                  }}
                >
                  <InfoOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Botón de salir a la derecha */}
            <Button 
              variant="outlined" 
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
            >
              Volver a Consolidación
            </Button>
          </Box>

          {/* Título y subtítulo */}
          <Box sx={{ pb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
            {problema?.identificador}-{problema?.numeroProblema.toString().padStart(2, '0')} | {problema?.nombreProblema}
            </Typography>
            <Typography variant="h6" color="text.secondary">
            Principio incumplido: {getPrincipioNombre(problema?.heuristicaIncumplida)}
            </Typography>
          </Box>

          {/* Contenido principal */}
          <Grid container spacing={3}>
            {/* Columna izquierda (imagen) */}
            <Grid item xs={12} md={4}>
              <Box 
                component="img"
                src={formatImagePath(problema?.imagen) || "/placeholder.png"}
                alt="Evidencia del problema"
                sx={{ 
                  width: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  border: '1px solid #eee',
                  borderRadius: 1,
                  backgroundColor: '#f5f5f5'
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Ejemplo de Ocurrencia:</strong> {problema?.ejemploOcurrencia}
              </Typography>
            </Grid>

            {/* Columna derecha (descripción) */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Descripción
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, minHeight: '100px' }}>
                <Typography>{problema?.descripcion}</Typography>
              </Paper>

              {/* Tabla de Puntuaciones de Evaluadores - movida aquí */}
              <Typography variant="h6" gutterBottom>
                Puntuaciones de Evaluadores
              </Typography>
              {loadingPuntuaciones ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : puntuaciones.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Nombre completo evaluador</strong></TableCell>
                        <TableCell align="center"><strong>Frecuencia</strong></TableCell>
                        <TableCell align="center"><strong>Severidad</strong></TableCell>
                        <TableCell align="center"><strong>Criticidad</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {puntuaciones.map((puntuacion, index) => (
                        <TableRow key={puntuacion.id_evaluador || index}>
                          <TableCell>
                            {`${puntuacion.nombre_evaluador} ${puntuacion.apellido_evaluador}`.trim()}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={puntuacion.probabilidad}
                              size="small"
                              sx={{
                                ...getChipColor(puntuacion.probabilidad),
                                fontWeight: 'bold',
                                minWidth: '40px'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={puntuacion.severidad}
                              size="small"
                              sx={{
                                ...getChipColor(puntuacion.severidad),
                                fontWeight: 'bold',
                                minWidth: '40px'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={puntuacion.criticidad}
                              size="small"
                              sx={{
                                ...getChipColor(puntuacion.criticidad),
                                fontWeight: 'bold',
                                minWidth: '40px'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                  Este problema no ha sido evaluado por ningún evaluador aún.
                </Alert>
              )}
            </Grid>

            {/* Histórico de cambios */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Histórico de cambios
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: '200px' }}>
                {historico.length > 0 ? (
                  <>
                    <Grid container>
                      <Grid item xs={2} sx={{ fontWeight: 'bold' }}>N° de cambio</Grid>
                      <Grid item xs={10} sx={{ fontWeight: 'bold' }}>Cambio realizado</Grid>
                    </Grid>
                    {/* HISTÓRICO ORDENADO CRONOLÓGICAMENTE (MÁS ANTIGUO PRIMERO) */}
                    {historico
                      .sort((a, b) => {
                        // Ordenar por ID del histórico (incremental) y luego por fecha
                        if (a.id_historico_problema && b.id_historico_problema) {
                          return a.id_historico_problema - b.id_historico_problema;
                        }
                        // Si no hay ID, ordenar por fecha
                        const fechaA = new Date(a.fecha_cambio).getTime();
                        const fechaB = new Date(b.fecha_cambio).getTime();
                        return fechaA - fechaB;
                      })
                      .map((cambio, index) => (
                        <Grid container key={cambio.id_historico_problema || index} sx={{ mt: 1, pt: 1, borderTop: index > 0 ? '1px solid #eee' : 'none' }}>
                          <Grid item xs={2}>{String(index + 1).padStart(2, '0')}</Grid>
                          <Grid item xs={10}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {cambio.detalle_cambio}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(cambio.fecha_cambio).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                            </Typography>
                          </Grid>
                        </Grid>
                      ))}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No hay cambios registrados para este problema.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </>
  );
} 