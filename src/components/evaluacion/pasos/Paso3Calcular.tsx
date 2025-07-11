'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AssignmentInd } from '@mui/icons-material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useRouter } from 'next/navigation';
import { problemaService } from '@/services/problemaService';
import { useAuth } from '@/hooks/useAuth';
import { Problema } from '@/components/interface/Problema';
import { evaluacionService } from '@/services/evaluacionService';
import { formatImagePath, handleImageError } from '@/utils/imageUtils';
import { evaluadorService } from '@/services/evaluadorService';

// Heurísticas de Nielsen
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

interface Paso3CalcularProps {
  mostrarFinalizarPaso3?: boolean;
  onFinalizarPaso3?: () => void;
  evaluacionId?: string;
}

function Paso3Calcular({ mostrarFinalizarPaso3 = false, onFinalizarPaso3, evaluacionId = '1' }: Paso3CalcularProps) {
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [selectedHeuristica, setSelectedHeuristica] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openEvaluateDialog, setOpenEvaluateDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problema | null>(null);
  const [evaluacionFiltro, setEvaluacionFiltro] = useState<'todos' | 'evaluados' | 'sin_evaluar'>('todos');
  const [estadisticas, setEstadisticas] = useState({ pendientes: 0, evaluados: 0 });
  const [loadingProblemas, setLoadingProblemas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Estados para el formulario de evaluación
  const [probabilidad, setProbabilidad] = useState<string>('');
  const [severidad, setSeveridad] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{ probabilidad?: string; severidad?: string }>({});
  
  const router = useRouter();
  const { user } = useAuth();

  // También vamos a agregar un diálogo de confirmación después de evaluar
  const [evaluacionExitosaDialog, setEvaluacionExitosaDialog] = useState(false);

  const [metricas, setMetricas] = useState<any[]>([]);
  const [evaluadorAutenticado, setEvaluadorAutenticado] = useState<any>(null);

  // Cargar evaluador autenticado
  useEffect(() => {
    const fetchEvaluadorAutenticado = async () => {
      try {
        const evaluador = await evaluadorService.getEvaluadorAutenticado();
        setEvaluadorAutenticado(evaluador);
      } catch (error) {
        console.error('Error al obtener el evaluador autenticado:', error);
      }
    };

    fetchEvaluadorAutenticado();
  }, []);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      // Obtener el ID de evaluación de props o de sessionStorage
      const evalId = sessionStorage.getItem('evaluacionId') || evaluacionId || '1';
      
      if (!evalId || !user) return;
      
      try {
        // Mostrar loading mientras cargamos datos
        setLoading(true);
        
        const [pendientes, evaluados] = await Promise.all([
          problemaService.getCantidadProblemasPendientes(parseInt(evalId)),
          problemaService.getCantidadProblemasEvaluados(parseInt(evalId))
        ]);
        
        setEstadisticas({
          pendientes: pendientes || 0,
          evaluados: evaluados || 0
        });
        
        console.log('Estadísticas actualizadas:', { pendientes, evaluados });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        // Mantenemos el loading verdadero hasta que se carguen los problemas
        // en el otro useEffect
      }
    };
    
    fetchEstadisticas();
  }, [evaluacionId, user]);
  
  useEffect(() => {
    const fetchProblemas = async () => {
      // Obtener el ID de evaluación de props o de sessionStorage
      const evalId = sessionStorage.getItem('evaluacionId') || evaluacionId || '1';
      
      if (!evalId || !user) return;
      
      try {
        setLoadingProblemas(true);
        setError(null); // Limpiar errores anteriores
        let problemasList: Problema[] = [];
        
        // Cargar diferentes tipos de problemas según el filtro seleccionado
        if (evaluacionFiltro === 'todos') {
          const response = await problemaService.getProblemasByEvaluacion(parseInt(evalId));
          problemasList = response as any[];
        } else if (evaluacionFiltro === 'evaluados') {
          const response = await problemaService.getProblemasEvaluados(parseInt(evalId));
          problemasList = response as any[];
        } else if (evaluacionFiltro === 'sin_evaluar') {
          const response = await problemaService.getProblemasPendientes(parseInt(evalId));
          problemasList = response as any[];
        }
        
        console.log('Datos recibidos del backend:', problemasList);
        
        // Transformar los problemas al formato esperado
        const problemasTransformados = problemasList.map((p: any) => ({
          identificador: sessionStorage.getItem('EV-id') || 'ID',
          id: p.id_problema || p.id, // Adaptamos para manejar ambos formatos
          numeroProblema: p.numero_problema || p.numeroProblema || 0,
          nombreProblema: p.nombre_problema || p.nombreProblema || 'Sin nombre',
          descripcion: p.descripcion_problema || p.descripcion || 'Sin descripción',
          heuristicaIncumplida: p.fk_heuristica_incumplida ? 
            `N${p.fk_heuristica_incumplida}` : 
            (p.heuristicaIncumplida ? `N - ${p.heuristicaIncumplida}` : 'No definida'),
          ejemploOcurrencia: p.ejemplo_ocurrencia || p.ejemploOcurrencia || 'Sin ejemplo',
          imagen: p.url_imagen || p.imagen || '',
          autor: p.autor,
          id_evaluacion: p.fk_evaluacion || p.id_evaluacion,
          id_evaluador: p.fk_evaluador || p.id_evaluador,
          // Campos para evaluación
          evaluado: p.evaluado || false,
          probabilidad: p.probabilidad || null,
          severidad: p.severidad || null
        }));
        
        setProblemas(problemasTransformados);
        console.log('Problemas transformados:', problemasTransformados);
      } catch (error) {
        console.error('Error al cargar problemas:', error);
        setProblemas([]);
        setError('Error al cargar los problemas. Por favor, intente nuevamente.');
      } finally {
        setLoadingProblemas(false);
        setLoading(false);
      }
    };

    fetchProblemas();
    
    // Cleanup on unmount
    return () => {
      setProblemas([]);
      setSelectedProblem(null);
    };
  }, [evaluacionId, user, evaluacionFiltro]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleImageClick = (imagePath: string) => {
    setSelectedImage(formatImagePath(imagePath));
  };
  
  const handleCloseImage = () => {
    setSelectedImage(null);
  };
  
  const handleDownloadImage = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage;
      // Use a more descriptive filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `evidence-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Navegar a la vista de problema
  const handleViewProblem = (problemId: number) => {
    router.push(`/evaluator/evaluacion/problema/${problemId}?returnTo=/evaluator/evaluacion/${evaluacionId}`);
  };

  // Abrir diálogo de evaluación
  const handleEvaluateProblem = (problema: Problema) => {
    setSelectedProblem(problema);
    handleInitialEvaluationValues(problema);
    setFormErrors({});
    setOpenEvaluateDialog(true);
  };

  // Manejar cambios en los campos del formulario de evaluación
  const handleEvaluationChange = (field: 'probabilidad' | 'severidad', value: string) => {
    const numValue = parseInt(value);
    if (value === '' || (numValue >= 0 && numValue <= 4)) {
      if (field === 'probabilidad') {
        setProbabilidad(value);
      } else {
        setSeveridad(value);
      }
      
      // Limpiar errores si el valor es válido
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }
  };

  // Validar el formulario de evaluación
  const validateEvaluationForm = () => {
    const errors: { probabilidad?: string; severidad?: string } = {};
    
    if (probabilidad === '') {
      errors.probabilidad = 'La probabilidad es obligatoria';
    } else if (parseInt(probabilidad) < 0 || parseInt(probabilidad) > 4) {
      errors.probabilidad = 'La probabilidad debe ser un número del 0 al 4';
    }
    
    if (severidad === '') {
      errors.severidad = 'La severidad es obligatoria';
    } else if (parseInt(severidad) < 0 || parseInt(severidad) > 4) {
      errors.severidad = 'La severidad debe ser un número del 0 al 4';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Actualizar la lista de problemas y estadísticas después de una evaluación
  const handleEvaluacionCompletada = async () => {
    try {
      setError(null);
      // Obtener el ID de evaluación de props o de sessionStorage
      const evalId = sessionStorage.getItem('evaluacionId') || evaluacionId ||  '1';
      
      // Actualizamos estadísticas
      if (evalId) {
        const [pendientes, evaluados] = await Promise.all([
          problemaService.getCantidadProblemasPendientes(parseInt(evalId)),
          problemaService.getCantidadProblemasEvaluados(parseInt(evalId))
        ]);
        
        setEstadisticas({
          pendientes: pendientes || 0,
          evaluados: evaluados || 0
        });
        
        // Según el filtro actual, actualizamos la lista de problemas
        if (evaluacionFiltro === 'todos') {
          const response = await problemaService.getProblemasByEvaluacion(parseInt(evalId));
          updateProblemListFromResponse(response as any[]);
        } else if (evaluacionFiltro === 'evaluados') {
          const response = await problemaService.getProblemasEvaluados(parseInt(evalId));
          updateProblemListFromResponse(response as any[]);
        } else if (evaluacionFiltro === 'sin_evaluar') {
          const response = await problemaService.getProblemasPendientes(parseInt(evalId));
          updateProblemListFromResponse(response as any[]);
        }
      }
    } catch (error) {
      console.error('Error al actualizar datos después de evaluación:', error);
      setError('Error al actualizar los datos. Por favor, intente de nuevo.');
    }
  };
  
  // Función auxiliar para actualizar la lista de problemas desde la respuesta de la API
  const updateProblemListFromResponse = (problemasList: any[]) => {
    console.log('Datos recibidos para actualizar:', problemasList);
    
    const problemasTransformados = problemasList.map(p => ({
      identificador: sessionStorage.getItem('EV-id') || 'ID',
      id: p.id_problema || p.id, // Adaptamos para manejar ambos formatos
      numeroProblema: p.numero_problema || p.numeroProblema || 0,
      nombreProblema: p.nombre_problema || p.nombreProblema || 'Sin nombre',
      descripcion: p.descripcion_problema || p.descripcion || 'Sin descripción',
      heuristicaIncumplida: p.fk_heuristica_incumplida ? 
        `N${p.fk_heuristica_incumplida}` : 
        (p.heuristicaIncumplida ? `N - ${p.heuristicaIncumplida}` : 'No definida'),
      ejemploOcurrencia: p.ejemplo_ocurrencia || p.ejemploOcurrencia || 'Sin ejemplo',
      imagen: p.url_imagen || p.imagen || '',
      autor: p.autor,
      id_evaluacion: p.fk_evaluacion || p.id_evaluacion,
      id_evaluador: p.fk_evaluador || p.id_evaluador,
    }));
    
    setProblemas(problemasTransformados);
    console.log('Problemas actualizados:', problemasTransformados);
  };

  // Guardar evaluación
  const handleSaveEvaluation = async () => {
    if (!validateEvaluationForm() || !selectedProblem) return;
    
    try {
      // Llamada al servicio para guardar la evaluación
      await evaluacionService.evaluarProblema(Number(selectedProblem.id), {
        probabilidad: parseInt(probabilidad),
        severidad: parseInt(severidad)
      });
      console.log("probabilidad", parseInt(probabilidad));
      console.log("severidad", parseInt(severidad));
      
      setOpenEvaluateDialog(false);
      
      // Actualizar datos después de guardar
      await handleEvaluacionCompletada();
      
      // Mostrar diálogo de confirmación de evaluación exitosa
      setEvaluacionExitosaDialog(true);
    } catch (error) {
      console.error('Error al guardar la evaluación:', error);
    }
  };

  const handleInitialEvaluationValues = async (problema?: Problema) => {
    const problemaToUse = problema || selectedProblem;
    if(!problemaToUse) return;
    try {
      const evalIni = await problemaService.getPuntuacionProblema(Number(problemaToUse.id));
      console.log("problema.id", problemaToUse.id);
      if(evalIni.probabilidad != 0 || evalIni.severidad != 0){
        setProbabilidad(evalIni.probabilidad.toString());
        setSeveridad(evalIni.severidad.toString());
      }else{
        setProbabilidad('');
        setSeveridad('');
      }
    } catch (error) {
      console.error('Error al obtener la evaluación inicial:', error);
    }
  };

  // Filtrar problemas por búsqueda
  const filteredProblemas = problemas.filter(problema => {
    const searchLower = search.toLowerCase();
    
    // Filtro de búsqueda mejorado
    const matchesSearch = search === '' || 
      problema.id?.toString().includes(search) ||
      problema.numeroProblema?.toString().includes(search) ||
      `${problema.identificador}-${problema.numeroProblema}`.toLowerCase().includes(searchLower) ||
      problema.nombreProblema.toLowerCase().includes(searchLower) ||
      problema.descripcion.toLowerCase().includes(searchLower) ||
      problema.heuristicaIncumplida.toLowerCase().includes(searchLower) ||
      problema.ejemploOcurrencia.toLowerCase().includes(searchLower);
    
    // Filtro de heurística
    const matchesHeuristica = selectedHeuristica === '' || 
      problema.heuristicaIncumplida === `N${selectedHeuristica}`;
    
    return matchesSearch && matchesHeuristica;
  });

  // Finalizar Paso 3 - Actualizar progreso a paso 4
  const handleFinalizarPaso3 = async () => {
    console.log('🔍 [Paso3] Debuggando valores:');
    console.log('  - evaluacionId (prop):', evaluacionId);
    console.log('  - evaluacionId (tipo):', typeof evaluacionId);
    console.log('  - evaluacionId (convertido):', Number(evaluacionId));
    console.log('  - evaluadorAutenticado:', evaluadorAutenticado);
    console.log('  - evaluadorAutenticado?.id_evaluador:', evaluadorAutenticado?.id_evaluador);
    if(estadisticas.pendientes > 0){
      setSnackbar({ open: true, message: 'No se puede finalizar el paso 3. Hay problemas pendientes.', severity: 'error' });
      return;
    }
    try {
      if (evaluadorAutenticado?.id_evaluador && evaluacionId) {
        console.log('🔄 [Paso3] Finalizando Paso 3...');
        console.log('📋 [Paso3] Actualizando progreso del evaluador:', evaluadorAutenticado.id_evaluador);
        console.log('📋 [Paso3] En evaluación:', evaluacionId);
        console.log('📋 [Paso3] Nuevo progreso: 4');
        
        // Mostrar valores exactos que se van a enviar
        console.log('📤 [Paso3] Parámetros que se enviarán:');
        console.log('  - evaluacionService.setProgresoEvaluador(');
        console.log('    ', Number(evaluacionId), ',');
        console.log('    ', evaluadorAutenticado.id_evaluador, ',');
        console.log('    ', 4);
        console.log('  )');
        
        // Actualizar el progreso del evaluador a paso 4
        const resultado = await evaluacionService.setProgresoEvaluador(
          Number(evaluacionId), 
          evaluadorAutenticado.id_evaluador, 
          4
        );
        
        console.log('✅ [Paso3] Respuesta de setProgresoEvaluador:', resultado);
        console.log('✅ [Paso3] Paso 3 finalizado exitosamente');
        
        // Cerrar el diálogo de confirmación
        setOpenConfirmDialog(false);
        
        // Llamar al prop del padre si existe para actualizar el estado global
        if (onFinalizarPaso3) {
          console.log('📞 [Paso3] Llamando callback del padre...');
          onFinalizarPaso3();
        } else {
          console.log('⚠️ [Paso3] No hay callback del padre definido');
        }
        
        console.log('🎉 [Paso3] Proceso de finalización completado');
      } else {
        console.error('❌ [Paso3] No se puede finalizar: evaluador o evaluación no disponible');
        console.error('  - evaluadorAutenticado?.id_evaluador:', evaluadorAutenticado?.id_evaluador);
        console.error('  - evaluacionId:', evaluacionId);
        console.error('  - evaluadorAutenticado completo:', evaluadorAutenticado);
        
        // Mostrar mensaje de error al usuario
        alert('Error: No se puede finalizar el paso. Falta información del evaluador o evaluación.');
      }
    } catch (error) {
      console.error('❌ [Paso3] Error al finalizar el Paso 3:', error);
      console.error('❌ [Paso3] Error completo:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      
      // Mostrar mensaje de error al usuario
      alert('Error al finalizar el paso 3. Por favor, intente nuevamente.');
    }
  };

  const calcularMetricas = () => {
    // Implementa la lógica para calcular métricas
  };

  // Renderizado condicional para estado de carga general (primera carga)
  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando problemas...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Mensaje de error */}
      {error && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: '#fdeded', 
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography>{error}</Typography>
          <Button 
            variant="outlined" 
            color="error" 
            size="small"
            onClick={() => {
              setError(null);
              // Obtener el ID de evaluación de props o de sessionStorage
              const evalId = sessionStorage.getItem('evaluacionId') || evaluacionId || '1';
              
              if (evalId) {
                // Reintentar carga
                const fetchData = async () => {
                  try {
                    setLoadingProblemas(true);
                    const [pendientes, evaluados] = await Promise.all([
                      problemaService.getCantidadProblemasPendientes(parseInt(evalId)),
                      problemaService.getCantidadProblemasEvaluados(parseInt(evalId))
                    ]);
                    
                    setEstadisticas({
                      pendientes: pendientes || 0,
                      evaluados: evaluados || 0
                    });
                    
                    // Cargar todos los problemas
                    const response = await problemaService.getProblemasByEvaluacion(parseInt(evalId));
                    console.log('Datos recibidos al reintentar:', response);
                    updateProblemListFromResponse(response as any[]);
                    setEvaluacionFiltro('todos');
                  } catch (err) {
                    console.error('Error al reintentar:', err);
                    setError('No se pudo cargar los datos. Por favor, recargue la página.');
                  } finally {
                    setLoadingProblemas(false);
                  }
                };
                fetchData();
              }
            }}
          >
            Reintentar
          </Button>
        </Paper>
      )}

      {/* Contador de problemas y filtros */}
      <Paper sx={{ pt: 2, pb: 2, pr: 2, mb: 3, bgcolor: '#f5f7fa' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Problemas evaluados
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 0.5 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{estadisticas.evaluados}</Typography>
                  <Typography variant="body2" color="text.secondary">Evaluados</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{estadisticas.pendientes}</Typography>
                  <Typography variant="body2" color="text.secondary">Pendientes</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: 'space-between', 
              alignItems: 'center', 
              height: '100%',
              mt: { xs: 2, md: 0 } // Margen superior en móviles
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={evaluacionFiltro}
                  exclusive
                  onChange={(_, newValue) => {
                    if (newValue !== null) {
                      setEvaluacionFiltro(newValue);
                      setPage(0);
                      setLoadingProblemas(true);
                    }
                  }}
                  aria-label="filtro de evaluación"
                  size="small"
                >
                  <ToggleButton value="todos">Todos</ToggleButton>
                  <ToggleButton value="evaluados">Evaluados</ToggleButton>
                  <ToggleButton value="sin_evaluar">Pendientes</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Principio incumplido</InputLabel>
                <Select
                  value={selectedHeuristica}
                  onChange={(e) => {
                    setSelectedHeuristica(e.target.value);
                    setPage(0);
                  }}
                  label="Principio incumplido"
                >
                  <MenuItem value="">Todos los principios</MenuItem>
                  {HEURISTICAS_NIELSEN.map(h => (
                    <MenuItem key={h.id} value={h.id}>N{h.id} - {h.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                size="small"
                placeholder="ID o Nombre del Problema"
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabla de problemas */}
      <Paper sx={{ mb: 2 }}>
        {/* Paginación superior */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredProblemas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{ borderBottom: '1px solid #e0e0e0' }}
        />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="10%">ID</TableCell>
                <TableCell width="20%">Nombre Problema</TableCell>
                <TableCell width="30%">Descripción</TableCell>
                <TableCell width="10%">Heurística incumplida</TableCell>
                <TableCell width="15%">Ejemplo de Ocurrencia</TableCell>
                <TableCell width="5%" align="center">Imagen</TableCell>
                <TableCell width="15%" align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingProblemas ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={30} />
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        {evaluacionFiltro === 'todos' ? 'Cargando todos los problemas...' : 
                         evaluacionFiltro === 'evaluados' ? 'Cargando problemas evaluados...' : 
                         'Cargando problemas pendientes...'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredProblemas.length > 0 ? (
                filteredProblemas
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((problema) => (
                    <TableRow 
                      key={problema.id}
                      sx={{
                        backgroundColor: problema.evaluado ? '#f0f7ff' : 'inherit'
                      }}
                    >
                      <TableCell>{problema.identificador} - {problema.numeroProblema}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{problema.nombreProblema}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{problema.descripcion}</TableCell>
                      <TableCell>{problema.heuristicaIncumplida}</TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{problema.ejemploOcurrencia}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver imagen">
                          <IconButton 
                            size="small" 
                            onClick={() => problema.imagen ? handleImageClick(problema.imagen) : null} 
                            sx={{ color: 'primary.main' }}
                            disabled={!problema.imagen}
                          >
                            <ImageIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Visualizar">
                          <IconButton size="small" color="info" onClick={() => handleViewProblem(Number(problema.id))}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={problema.evaluado ? "Ya evaluado" : "Evaluar"}>
                          <IconButton 
                            size="small" 
                            color="success" 
                            onClick={() => handleEvaluateProblem(problema)}
                            sx={{ 
                              bgcolor: problema.evaluado ? 'success.light' : 'inherit',
                              color: problema.evaluado ? 'white' : 'inherit',
                              '&:hover': {
                                bgcolor: problema.evaluado ? 'success.main' : 'inherit',
                              }
                            }}
                          >
                            {<AssignmentTurnedInIcon />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No se encontraron problemas que coincidan con los criterios de búsqueda.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Botón Finalizar paso 3 (debajo de la tabla) */}
      {mostrarFinalizarPaso3 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => setOpenConfirmDialog(true)}
            sx={{ minWidth: 200 }}
          >
          Finalizar Paso 3
        </Button>
        </Box>
      )}
      
      {/* Modal de confirmación de finalización de paso */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>¿Está seguro de que quiere terminar la fase 3?</DialogTitle>
        <DialogContent>
          <Typography>
            Una vez finalizada esta fase, no se podrán realizar más evaluaciones de problemas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancelar</Button>
          <Button 
            onClick={() => {
              setOpenConfirmDialog(false);
              handleFinalizarPaso3();
            }} 
            variant="contained" 
            color="primary"
          >
            Finalizar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de evaluación de problema */}
      <Dialog 
        open={openEvaluateDialog} 
        onClose={() => setOpenEvaluateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Evaluar Problema
          <IconButton
            aria-label="close"
            onClick={() => setOpenEvaluateDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedProblem && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedProblem.identificador} - {selectedProblem.numeroProblema}: {selectedProblem.nombreProblema}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Descripción:</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>{selectedProblem.descripcion}</Typography>
                
                <Typography variant="subtitle1">Principio heurístico:</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>{selectedProblem.heuristicaIncumplida}</Typography>
                
                <Typography variant="subtitle1">Ejemplo de ocurrencia:</Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>{selectedProblem.ejemploOcurrencia}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.probabilidad}>
                  <InputLabel id="probabilidad-label">Probabilidad (0-4) *</InputLabel>
                  <Select
                    labelId="probabilidad-label"
                    id="probabilidad"
                    value={probabilidad}
                    label="Probabilidad (0-4) *"
                    onChange={(e) => handleEvaluationChange('probabilidad', e.target.value)}
                  >
                    <MenuItem value="0">0 - Muy baja</MenuItem>
                    <MenuItem value="1">1 - Baja</MenuItem>
                    <MenuItem value="2">2 - Media</MenuItem>
                    <MenuItem value="3">3 - Alta</MenuItem>
                    <MenuItem value="4">4 - Muy alta</MenuItem>
                  </Select>
                  {formErrors.probabilidad && <FormHelperText>{formErrors.probabilidad}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.severidad}>
                  <InputLabel id="severidad-label">Severidad (0-4) *</InputLabel>
                  <Select
                    labelId="severidad-label"
                    id="severidad"
                    value={severidad}
                    label="Severidad (0-4) *"
                    onChange={(e) => handleEvaluationChange('severidad', e.target.value)}
                  >
                    <MenuItem value="0">0 - Muy baja</MenuItem>
                    <MenuItem value="1">1 - Baja</MenuItem>
                    <MenuItem value="2">2 - Media</MenuItem>
                    <MenuItem value="3">3 - Alta</MenuItem>
                    <MenuItem value="4">4 - Muy alta</MenuItem>
                  </Select>
                  {formErrors.severidad && <FormHelperText>{formErrors.severidad}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEvaluateDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveEvaluation} variant="contained" color="primary">
            Evaluar Problema
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de imagen */}
      <Dialog open={!!selectedImage} onClose={handleCloseImage} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Vista previa de imagen
          <Box>
            <IconButton onClick={handleDownloadImage} sx={{ mr: 1 }} title="Descargar imagen">
              <DownloadIcon />
            </IconButton>
            <IconButton 
              onClick={() => selectedImage && window.open(selectedImage, '_blank')}
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
          {selectedImage && (
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
                  src={selectedImage}
                  alt="Problem evidence"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    console.error('Error loading image:', selectedImage);
                    handleImageError(e, ['.png', '.jpg', '.jpeg']);
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                Ruta original: {selectedImage.startsWith('/') ? selectedImage.substring(1) : selectedImage}
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

      {/* Y ahora agregamos el diálogo de confirmación después de evaluar */}
      <Dialog
        open={evaluacionExitosaDialog}
        onClose={() => setEvaluacionExitosaDialog(false)}
        maxWidth="sm"
      >
        <DialogTitle>Evaluación Guardada</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', my: 2 }}>
            <Box sx={{ 
              color: 'success.main', 
              bgcolor: 'success.light', 
              p: 2, 
              borderRadius: '50%',
              mb: 2
            }}>
              <AssignmentTurnedInIcon fontSize="large" />
            </Box>
            <Typography variant="body1">
              El problema ha sido evaluado exitosamente.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEvaluacionExitosaDialog(false)} 
            variant="contained" 
            color="primary"
            autoFocus
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Paso3Calcular;