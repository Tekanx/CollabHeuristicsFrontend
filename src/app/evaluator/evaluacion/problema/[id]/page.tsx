'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import Header from '@/components/Header';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Problema } from '@/components/interface/Problema';
import { problemaService } from '@/services/problemaService';
import { heuristicService } from '@/services/heuristicaService';
import { PrincipioHeuristica } from '@/components/interface/PrincipioHeuristica';
import axios from '@/utils/axiosConfig';
import { evaluacionService } from '@/services/evaluacionService';
import { formatImagePath, handleImageError } from '@/utils/imageUtils';
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

export default function ProblemaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/evaluator/evaluacion/1'; // Valor por defecto si no hay returnTo
  
  const [problema, setProblema] = useState<Problema | null>(null);
  const [loading, setLoading] = useState(true);
  const [principios, setPrincipios] = useState<PrincipioHeuristica[]>([]);
  const [historico, setHistorico] = useState<Historico_problema[]>([]);
  const [puntuaciones, setPuntuaciones] = useState<PuntuacionEvaluador[]>([]);
  const [loadingPuntuaciones, setLoadingPuntuaciones] = useState(false);
  const [openModify, setOpenModify] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);
  const [openImage, setOpenImage] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  // Estado para el formulario de modificación
  const [formData, setFormData] = useState<Problema>({
    identificador: "",
    id: 0,
    nombreProblema: "",
    descripcion: "", 
    heuristicaIncumplida: "",
    ejemploOcurrencia: "",
    imagen: "",
    autor: "",
    numeroProblema: 0, // Added missing required field
    id_evaluacion: 0 // Added missing required field
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!params.id) {
          throw new Error('ID del problema no proporcionado');
        }
        const evaluacionId = await evaluacionService.getEvaluacionByProblema(Number(params.id));
        console.log("Evaluación ID:", evaluacionId);
        // Fetch problema by ID with proper error handling
        const response = await problemaService.getProblema(Number(params.id));
        const rawProblemaData = response as unknown as ProblemaAPI;
        
        if (!rawProblemaData) {
          throw new Error('No se pudo cargar el problema');
        }

        // Log the raw problem data for debugging
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
        
        // Verificar el ID de evaluación después del procesamiento
        if (!problemaData.id_evaluacion) {
          throw new Error('ID de evaluación no encontrado en el problema');
        }

        setProblema(problemaData);
        setFormData(problemaData);
        
        // Fetch evaluación data
        const evaluacionResponse = await axios.get(`/evaluaciones/${problemaData.id_evaluacion}`);
        if (!evaluacionResponse?.data) {
          throw new Error('No se pudo cargar la evaluación');
        }
        
        const evaluacion = evaluacionResponse.data;
        console.log("Evaluación cargada:", evaluacion);

        const heuristicaId = evaluacion.id_heuristica;
        if (!heuristicaId) {
          throw new Error('ID de heurística no encontrado en la evaluación');
        }

        // Fetch principios
        const principiosData = await heuristicService.getPrincipiosHeuristicos(heuristicaId);
        if (!principiosData) {
          throw new Error('No se pudieron cargar los principios heurísticos');
        }
        
        setPrincipios(principiosData);
        console.log("Principios heurísticos:", principiosData);

        // Cargar histórico del problema
        try {
          const historicoData = await problemaService.getHistoricoProblema(Number(params.id));
          console.log("Histórico del problema:", historicoData);
          setHistorico(historicoData || []);
        } catch (historicoError) {
          console.error("Error al cargar el histórico:", historicoError);
          setHistorico([]); // Continuar sin histórico si hay error
        }

        // Cargar puntuaciones de evaluadores para este problema
        await fetchPuntuacionesProblema(Number(params.id));

        // Check if we should open the edit modal
        const shouldEdit = searchParams.get('edit') === 'true';
        if (shouldEdit) {
          setOpenModify(true);
        }
      } catch (error) {
        console.error("Error al cargar los datos:", error);
        setError(error instanceof Error ? error.message : 'Error desconocido al cargar los datos');
        setProblema(null);
        setPrincipios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, searchParams]);

  // Manejadores de eventos
  const handleModifyClick = () => {
    setOpenModify(true);
  };

  const handleDeleteClick = () => {
    setOpenDelete(true);
  };

  const handleHelpClick = () => {
    setOpenHelp(true);
  };

  const handleImageClick = () => {
    setOpenImage(true);
  };

  const handleCloseImage = () => {
    setOpenImage(false);
  };

  // Actualizar las breadcrumbs para usar el ID dinámico
  const evaluacionId = sessionStorage.getItem('evaluacionId');
  const renderBreadcrumbs = () => {
    return (
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            router.push('/dashboard/evaluator');
          }}
        >
          Dashboard
        </Link>
        {evaluacionId && (
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              router.push(`/evaluator/evaluacion/${evaluacionId}`);
            }}
          >
            EV {evaluacionId}
          </Link>
        )}
        <Typography color="text.primary">
          Problema {problema?.numeroProblema}
        </Typography>
      </Breadcrumbs>
    );
  };

  const handleDownloadImage = () => {
    if (problema?.imagen) {
      const formattedPath = formatImagePath(problema.imagen);
      const link = document.createElement('a');
      link.href = formattedPath;
      link.download = `evidence-${problema.numeroProblema}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Manejador específico para el Select
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveModify = async () => {
    try {
      console.log("Problema antes de modificar:", problema);
      console.log("Problema después de modificar:", formData);
      
      if (params.id) {
        // Crear una copia del problema con los datos actualizados
        const problemaActualizado: Problema = {
          ...formData, // Mantener todos los campos originales
        };
        
        // Generar un detalle de cambio descriptivo para el historial
        const cambiosRealizados = [];
        if (problema?.nombreProblema !== formData.nombreProblema) 
          cambiosRealizados.push(`nombre: "${problema?.nombreProblema}" → "${formData.nombreProblema}"`);
        if (problema?.descripcion !== formData.descripcion) 
          cambiosRealizados.push(`descripción actualizada`);
        if (problema?.heuristicaIncumplida !== formData.heuristicaIncumplida) 
          cambiosRealizados.push(`principio heurístico: "${problema?.heuristicaIncumplida}" → "${formData.heuristicaIncumplida}"`);
        if (problema?.ejemploOcurrencia !== formData.ejemploOcurrencia) 
          cambiosRealizados.push(`ejemplo de ocurrencia: "${problema?.ejemploOcurrencia}" → "${formData.ejemploOcurrencia}"`);
        
        const detallesCambio = cambiosRealizados.length > 0 
          ? `Modificación de problema: ${cambiosRealizados.join('; ')}` 
          : 'Actualización de problema sin cambios significativos';
          
        console.log("Detalle de cambios:", detallesCambio);
        
        // Crear el objeto de historial
        const historico: Historico_problema = {
          id_historico_problema: 0, // El backend asignará el ID
          id_problema: Number(params.id),
          id_evaluador: 0,
          id_coordinador: 0, // Si es un evaluador, el coordinador es 0
          detalle_cambio: detallesCambio,
          fecha_cambio: new Date()
        };
        
        // Enviar la actualización al backend
        await problemaService.updateProblema(Number(params.id), problemaActualizado, historico);
        setProblema(formData);
        
        // Recargar el histórico después de guardar
        try {
          const historicoActualizado = await problemaService.getHistoricoProblema(Number(params.id));
          setHistorico(historicoActualizado || []);
        } catch (historicoError) {
          console.error("Error al recargar el histórico:", historicoError);
        }
        
        // Mostrar alerta de éxito
        setAlertMessage('Problema modificado con éxito');
        setAlertSeverity('success');
        setAlertOpen(true);
      }
      
      setOpenModify(false);
    } catch (error) {
      console.error("Error al modificar el problema:", error);
      // Mostrar alerta de error
      setAlertMessage('Error al modificar el problema. Por favor, intente nuevamente.');
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  const handleBack = () => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.back();
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      if (params.id && problema?.id_evaluacion) {
        await problemaService.deleteProblema(Number(params.id));
        const returnTo = searchParams.get('returnTo') || `/evaluator/evaluacion/${problema.id_evaluacion}`;
        router.push(returnTo);
      }
    } catch (error) {
      console.error("Error al eliminar el problema:", error);
      setError(error instanceof Error ? error.message : 'Error al eliminar el problema');
    } finally {
      setLoading(false);
      setOpenDelete(false);
    }
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

  const getChipColorCriticidad = (valor: number): { color: string; bgcolor: string } => {
    if (valor === 0) return { color: '#666', bgcolor: '#f5f5f5' };
    if (valor <= 3) return { color: '#2e7d32', bgcolor: '#e8f5e8' };
    if (valor <= 5) return { color: '#ef6c00', bgcolor: '#fff3e0' };
    if (valor <= 7) return { color: '#d32f2f', bgcolor: '#ffebee' };
    return { color: '#d91e1e', bgcolor: '#ffebee' };
  };

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

  // Función para cerrar alertas
  const handleCloseAlert = () => {
    setAlertOpen(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setProblema(null);
      setPrincipios([]);
      setHistorico([]);
      setPuntuaciones([]);
      setError(null);
      setLoading(false);
      setLoadingPuntuaciones(false);
    };
  }, []);

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
            {/* Botones de acción a la izquierda */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleModifyClick}
                startIcon={<EditIcon />}
              >
                Modificar Problema
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDeleteClick}
                startIcon={<DeleteIcon />}
              >
                Eliminar Problema
              </Button>
            </Box>

            {/* Botón de salir a la derecha */}
            <Button 
              variant="outlined" 
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
            >
              Salir de visualización
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
            <Grid item xs={10} md={4}>
              <Box 
                component="img"
                src={formatImagePath(problema?.imagen) || "/placeholder.png"}
                alt="Evidencia del problema"
                sx={{ 
                  width: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  border: '1px solid #eee',
                  borderRadius: 1,
                  backgroundColor: '#f5f5f5',
                  '&:hover': {
                    opacity: 0.9
                  }
                }}
                onClick={handleImageClick}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Ejemplo de Ocurrencia: {problema?.ejemploOcurrencia}
              </Typography>
            </Grid>

            {/* Columna derecha (descripción) */}
            <Grid item xs={14} md={8}>
              <Typography variant="h6" gutterBottom>
                Descripción
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, minHeight: '100px' }}>
                <Typography>{problema?.descripcion}</Typography>
              </Paper>

              {/* Tabla de Puntuaciones de Evaluadores */}
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
                                ...getChipColorCriticidad(puntuacion.criticidad),
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

            {/* Histórico de cambios - ahora toma todo el ancho */}
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

        {/* Modal para modificar problema */}
        <Dialog 
          open={openModify} 
          onClose={() => setOpenModify(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Modificar Problema</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del Problema"
                  name="nombreProblema"
                  value={formData.nombreProblema}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Principio Heurístico Incumplido</InputLabel>
                  <Select
                    name="heuristicaIncumplida"
                    value={formData.heuristicaIncumplida}
                    onChange={handleSelectChange}
                    label="Principio Heurístico Incumplido"
                  >
                    {HEURISTICAS_NIELSEN.map((heuristica) => (
                      <MenuItem key={heuristica.id} value={`${heuristica.id}`}>
                        {heuristica.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ejemplo de Ocurrencia"
                  name="ejemploOcurrencia"
                  value={formData.ejemploOcurrencia}
                  onChange={handleInputChange}
                  placeholder="Ej: Home → Navegación → Perfil"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL de la Imagen"
                  name="imagen"
                  value={formData.imagen}
                  onChange={handleInputChange}
                  placeholder="URL de la imagen o evidencia"
                  disabled={true}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModify(false)}>Cancelar</Button>
            <Button onClick={handleSaveModify} variant="contained" color="primary">Guardar Cambios</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación para eliminar */}
        <Dialog
          open={openDelete}
          onClose={() => setOpenDelete(false)}
        >
          <DialogTitle>¿Está seguro de que desea eliminar este problema?</DialogTitle>
          <DialogContent>
            <Typography>
              Esta acción no se puede deshacer. El problema "{problema?.nombreProblema}" será eliminado permanentemente.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error">Eliminar</Button>
          </DialogActions>
        </Dialog>

        {/* Modal de ayuda */}
        <Dialog open={openHelp} onClose={() => setOpenHelp(false)} maxWidth="sm" fullWidth>
          <DialogTitle>¿Cómo interactuar con la vista?</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Aquí irá una imagen de ayuda próximamente.
              </Typography>
              <Box
                sx={{
                  width: 300,
                  height: 180,
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  color: '#888',
                  fontSize: 18,
                }}
              >
                Imagen de ayuda (pendiente)
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenHelp(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Modal de imagen */}
        <Dialog open={openImage} onClose={handleCloseImage} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Vista previa de imagen
            <Box>
              <IconButton onClick={handleDownloadImage} sx={{ mr: 1 }} title="Descargar imagen">
                <DownloadIcon />
              </IconButton>
              <IconButton 
                onClick={() => problema?.imagen && window.open(formatImagePath(problema.imagen), '_blank')}
                sx={{ mr: 1 }} 
                title="Abrir en nueva pestaña"
              >
                <OpenInNewIcon />
              </IconButton>
              <IconButton onClick={handleCloseImage} title="Cerrar">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {problema?.imagen && (
              <>
                <Box
                  component="div"
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center', 
                    width: '100%',
                    height: 'auto',
                    minHeight: '300px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={formatImagePath(problema.imagen)}
                    alt="Problem evidence"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      console.error('Error loading image:', problema.imagen);
                      handleImageError(e, ['.png', '.jpg', '.jpeg']);
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                  Ruta original: {problema.imagen}
                </Typography>
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="error">
                    Si la imagen no carga, intente abrirla en una nueva pestaña con el botón superior derecho.
                  </Typography>
                </Box>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Alerta para notificaciones */}
        <Snackbar 
          open={alertOpen} 
          autoHideDuration={6000} 
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseAlert} 
            severity={alertSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {alertMessage}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}