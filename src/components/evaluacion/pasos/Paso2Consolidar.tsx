import React, { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, IconButton, Tooltip, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Typography, Snackbar, Alert, DialogContent, CircularProgress, TablePagination
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useRouter } from 'next/navigation';
import { Problema } from '@/components/interface/Problema';
import { Evaluador } from '@/components/interface/Evaluador';
import { problemaService } from '@/services/problemaService';
import { evaluacionService } from '@/services/evaluacionService';
import { evaluadorService } from '@/services/evaluadorService';
import { useAuth } from '@/hooks/useAuth';
import { formatImagePath, handleImageError } from '@/utils/imageUtils';

// Mock de heurísticas (esto podría cargarse dinámicamente en el futuro)
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

interface Paso2ConsolidarProps {
  mostrarFinalizarPaso2?: boolean;
  onFinalizarPaso2?: () => void;
  evaluacionId?: string;
}

interface EvaluadorPaso {
  id_evaluador: number;
  nombre: string;
  apellido: string;
  correo: string;
  nombre_usuario: string;
  numero?: string;
  genero?: number;
  paso_actual?: number;
}


function Paso2Consolidar({ mostrarFinalizarPaso2 = false, onFinalizarPaso2, evaluacionId = '1' }: Paso2ConsolidarProps) {
  const [search, setSearch] = useState('');
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [evaluadores, setEvaluadores] = useState<Evaluador[]>([]);
  const [evaluadoresConProgreso, setEvaluadoresConProgreso] = useState<EvaluadorPaso[]>([]);
  const [selectedEvaluadores, setSelectedEvaluadores] = useState<string[]>([]);
  const [selectedHeuristica, setSelectedHeuristica] = useState<string>('');
  const [selectedProblemas, setSelectedProblemas] = useState<string[]>([]);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openConfirmFinalizar, setOpenConfirmFinalizar] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [evaluadorAutenticado, setEvaluadorAutenticado] = useState<any>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Cargar evaluadores y problemas de la evaluación
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Cargar evaluadores de esta evaluación
        const evaluadoresData = await evaluacionService.getEvaluadoresByEvaluacion(Number(evaluacionId));
        console.log('Evaluadores de la evaluación:', evaluadoresData);
        setEvaluadores(evaluadoresData);
        
        // Inicializar selección de evaluadores
        const evaluadoresIds = evaluadoresData.map((e: Evaluador) => e.id_evaluador.toString());
        setSelectedEvaluadores(evaluadoresIds);

        // Obtener datos de la evaluación
        const evaluacion = await evaluacionService.getEvaluacion(Number(evaluacionId));
        
        // Cargar todos los problemas de la evaluación
        const response = await problemaService.getProblemasByEvaluacion(Number(evaluacionId));
        const problemasData = response as any[];
        console.log('Problemas de la evaluación:', problemasData);
        
        // Transformar los problemas al formato esperado
        const problemasTransformados = problemasData.map(p => ({
          identificador: evaluacion.evaluacion_identificador,
          id: p.id_problema,
          numeroProblema: p.numero_problema,
          nombreProblema: p.nombre_problema || 'Sin nombre',
          descripcion: p.descripcion_problema || 'Sin descripción',
          heuristicaIncumplida: p.fk_heuristica_incumplida ? `N${p.fk_heuristica_incumplida}` : 'No definida',
          ejemploOcurrencia: p.ejemplo_ocurrencia || 'Sin ejemplo',
          imagen: p.url_imagen || '',
          autor: p.autor,
          id_evaluacion: p.fk_evaluacion,
          id_evaluador: p.fk_evaluador
        }));
        console.log('Problemas transformados:', problemasTransformados);
        setProblemas(problemasTransformados);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setSnackbar({ 
          open: true, 
          message: 'Error al cargar los datos. Por favor, intente de nuevo.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchProgresoEvaluadores = async () => {
      const evaluadores = await evaluadorService.getEvaluadoresByEvaluacion(Number(evaluacionId));
      const evaluadoresConDatos = await Promise.all(
        evaluadores.map(async (evaluador: EvaluadorPaso) => {
          const progreso = await evaluacionService.getProgresoEvaluador(Number(evaluacionId), evaluador.id_evaluador);
          return { ...evaluador, paso_actual: progreso || 1 };
        })
      );
      setEvaluadoresConProgreso(evaluadoresConDatos);
    };

    fetchProgresoEvaluadores();
    fetchData();
  }, [evaluacionId]);

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

  // Filtro de problemas
  const filteredProblemas = problemas.filter(p => {
    // Comprobar si el problema tiene un evaluador asociado y si está en la selección actual
    const matchesEvaluador = p.id_evaluador !== undefined && 
      selectedEvaluadores.includes(p.id_evaluador.toString());
    
    // Comprobar si coincide con el filtro de heurística
    const matchesHeuristica = selectedHeuristica === '' || 
      p.heuristicaIncumplida === `N${selectedHeuristica}`;
    
    // Comprobar si coincide con la búsqueda por texto
    const searchLower = search.toLowerCase();
    const matchesSearch = search === '' || 
                         p.id?.toString().includes(search) ||
                         p.numeroProblema?.toString().includes(search) ||
                         `${p.identificador}-${p.numeroProblema}`.toLowerCase().includes(searchLower) ||
                         p.nombreProblema.toLowerCase().includes(searchLower) ||
                         p.descripcion.toLowerCase().includes(searchLower) ||
                         p.heuristicaIncumplida.toLowerCase().includes(searchLower) ||
                         p.ejemploOcurrencia.toLowerCase().includes(searchLower);
    
    return matchesEvaluador && matchesHeuristica && matchesSearch;
  });

  // Selección de problemas
  const handleSelectProblema = (id: number) => {
    setSelectedProblemas(prev =>
      prev.includes(id.toString()) ? prev.filter(pid => pid !== id.toString()) : [...prev, id.toString()]
    );
  };

  // Selección de evaluadores
  const handleToggleEvaluador = (id: string) => {
    setSelectedEvaluadores(prev =>
      prev.includes(id)
        ? prev.filter(e => e !== id)
        : [...prev, id]
    );
  };

  // Confirmar unión de problemas
  const handleUnirProblemas = () => {
    const evaluadoresSeleccionados = evaluadoresConProgreso.filter(e => selectedEvaluadores.includes(e.id_evaluador.toString()));
    const evaluadoresAvanzados = evaluadoresSeleccionados.some(e => e.paso_actual && e.paso_actual > 2);

    if (evaluadoresAvanzados) {
      setSnackbar({ open: true, message: 'No se puede unir problemas cuando hay participantes que han avanzado más allá del paso 2', severity: 'error' });
      return;
    }
    if (selectedProblemas.length < 2) {
      setSnackbar({ open: true, message: 'Debe seleccionar al menos dos problemas para unir.', severity: 'error' });
      return;
    }
    setOpenConfirm(true);
  };

  // Redirigir a consolidar
  const handleConfirmUnir = () => {
    setOpenConfirm(false);
    const problemasSeleccionados = problemas.filter(p => selectedProblemas.includes(p.id.toString()));
    
    if (problemasSeleccionados.length < 2) {
      setSnackbar({ 
        open: true, 
        message: 'Debe seleccionar al menos dos problemas para unir.',
        severity: 'error'
      });
      return;
    }

    sessionStorage.setItem('problemasAConsolidar', JSON.stringify(problemasSeleccionados));
    router.push('/evaluator/evaluacion/consolidar');
  };

  // Visualizar problema
  const handleViewProblem = (problemId: number) => {
    router.push(`/evaluator/evaluacion/problema/${problemId}?returnTo=/evaluator/evaluacion/${evaluacionId}`);
  };

  // Imagen
  const handleImageClick = (img: string) => setOpenImage(formatImagePath(img));
  const handleCloseImage = () => setOpenImage(null);
  const handleDownloadImage = () => {
    if (openImage) {
      const link = document.createElement('a');
      link.href = openImage;
      // Use a more descriptive filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `evidence-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Add pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Finalizar Paso 2 - Actualizar progreso a paso 3
  const handleFinalizarPaso2 = async () => {
    console.log('🔄 [Paso2] Debuggando valores:');
    console.log('  - evaluacionId (prop):', evaluacionId);
    console.log('  - evaluacionId (tipo):', typeof evaluacionId);
    console.log('  - evaluacionId (convertido):', Number(evaluacionId));
    console.log('  - evaluadorAutenticado:', evaluadorAutenticado);
    console.log('  - evaluadorAutenticado?.id_evaluador:', evaluadorAutenticado?.id_evaluador);
    
    try {
      if (evaluadorAutenticado?.id_evaluador && evaluacionId) {
        console.log('🔄 [Paso2] Finalizando Paso 2...');
        console.log('📋 [Paso2] Actualizando progreso del evaluador:', evaluadorAutenticado.id_evaluador);
        console.log('📋 [Paso2] En evaluación:', evaluacionId);
        console.log('📋 [Paso2] Nuevo progreso: 3');
        
        // Mostrar valores exactos que se van a enviar
        console.log('📤 [Paso2] Parámetros que se enviarán:');
        console.log('  - evaluacionService.setProgresoEvaluador(');
        console.log('    ', Number(evaluacionId), ',');
        console.log('    ', evaluadorAutenticado.id_evaluador, ',');
        console.log('    ', 3);
        console.log('  )');
        

        // Cargar todos los problemas de la evaluación
        const response = await problemaService.getProblemasByEvaluacion(Number(evaluacionId));
        const problemasData = response as any[];
        console.log('Problemas de la evaluación:', problemasData);

        problemasData.forEach(async (problema) => {
          const resultado = await evaluadorService.iniciarPuntuacion(evaluadorAutenticado.id_evaluador, problema.id_problema);
          console.log('✅ [Paso2] Respuesta de iniciarPuntuacion:', resultado);
        });

        // Actualizar el progreso del evaluador a paso 3
        const resultado = await evaluacionService.setProgresoEvaluador(
          Number(evaluacionId), 
          evaluadorAutenticado.id_evaluador, 
          3
        );
        
        console.log('✅ [Paso2] Respuesta de setProgresoEvaluador:', resultado);
        console.log('✅ [Paso2] Paso 2 finalizado exitosamente');
        
        // Cerrar el diálogo de confirmación
        setOpenConfirmFinalizar(false);
        
        // Llamar al prop del padre si existe para actualizar el estado global
        if (onFinalizarPaso2) {
          console.log('📞 [Paso2] Llamando callback del padre...');
          onFinalizarPaso2();
        } else {
          console.log('⚠️ [Paso2] No hay callback del padre definido');
        }
        
        console.log('🎉 [Paso2] Proceso de finalización completado');
      } else {
        console.error('❌ [Paso2] No se puede finalizar: evaluador o evaluación no disponible');
        console.error('  - evaluadorAutenticado?.id_evaluador:', evaluadorAutenticado?.id_evaluador);
        console.error('  - evaluacionId:', evaluacionId);
        console.error('  - evaluadorAutenticado completo:', evaluadorAutenticado);
        
        // Mostrar mensaje de error al usuario
        alert('Error: No se puede finalizar el paso. Falta información del evaluador o evaluación.');
      }
    } catch (error) {
      console.error('❌ [Paso2] Error al finalizar el Paso 2:', error);
      console.error('❌ [Paso2] Error completo:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      
      // Mostrar mensaje de error al usuario
      alert('Error al finalizar el paso 2. Por favor, intente nuevamente.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filtros */}
      <Paper sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' , bgcolor: '#f5f7fa', p: 2, borderRadius: 2}}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Evaluadores</InputLabel>
          <Select
            multiple
            value={selectedEvaluadores}
            onChange={e => {
              setSelectedEvaluadores(typeof e.target.value === 'string' ? [e.target.value] : e.target.value as string[]);
              setSelectedProblemas([]); // Limpiar selección al cambiar evaluadores
            }}
            label="Evaluadores"
            renderValue={selected =>
              evaluadores
                .filter(e => selected.includes(e.id_evaluador.toString()))
                .map(e => `${e.nombre} ${e.apellido}`)
                .join(', ')
            }
          >
            {evaluadores.map(e => (
              <MenuItem key={e.id_evaluador} value={e.id_evaluador.toString()}>
                <Checkbox checked={selectedEvaluadores.includes(e.id_evaluador.toString())} />
                {e.nombre} {e.apellido}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Principio incumplido</InputLabel>
          <Select
            value={selectedHeuristica}
            onChange={e => {
              setSelectedHeuristica(e.target.value);
              setSelectedProblemas([]); // Limpiar selección al cambiar heurística
            }}
            label="Principio incumplido"
          >
            <MenuItem value="">Todos</MenuItem>
            {HEURISTICAS_NIELSEN.map(h => (
              <MenuItem key={h.id} value={h.id}>{h.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="ID o Nombre del Problema"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setSelectedProblemas([]); // Limpiar selección al buscar
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleUnirProblemas}
          disabled={selectedProblemas.length < 2}
        >
          Unir Problemas
        </Button>
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
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{ borderBottom: '1px solid #e0e0e0' }}
        />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="10%">ID</TableCell>
                <TableCell width="25%">Nombre Problema encontrado</TableCell>
                <TableCell width="30%">Descripción</TableCell>
                <TableCell width="10%">Heurística incumplida</TableCell>
                <TableCell width="10%">Ejemplo de Ocurrencia</TableCell>
                <TableCell width="5%" align="center">Imagen</TableCell>
                <TableCell width="15%" align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProblemas.length > 0 ? (
                filteredProblemas
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((problema) => (
                    <TableRow key={problema.id}>
                      <TableCell>{problema.identificador || '-'} - {problema.numeroProblema}</TableCell>
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
                          <IconButton size="small" color="primary" onClick={() => handleViewProblem(problema.id)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={selectedProblemas.includes(problema.id.toString()) ? 'Deseleccionar' : 'Seleccionar'}>
                          <IconButton 
                            size="small" 
                            color={selectedProblemas.includes(problema.id.toString()) ? 'success' : 'default'} 
                            onClick={() => handleSelectProblema(problema.id)}
                          >
                            {selectedProblemas.includes(problema.id.toString()) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No se encontraron problemas con los filtros seleccionados. Intente con otros criterios.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Botón Finalizar fuera de la tabla */}
      {mostrarFinalizarPaso2 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => setOpenConfirmFinalizar(true)}
            sx={{ minWidth: 200 }}
          >
            Finalizar Paso 2
          </Button>
        </Box>
      )}

      {/* Modal de imagen */}
      <Dialog open={!!openImage} onClose={handleCloseImage} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Vista previa de imagen
          <Box>
            <IconButton onClick={handleDownloadImage} sx={{ mr: 1 }} title="Descargar imagen">
              <DownloadIcon />
            </IconButton>
            <IconButton 
              onClick={() => openImage && window.open(openImage, '_blank')}
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
          {openImage && (
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
                  src={openImage}
                  alt="Problem evidence"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    console.error('Error loading image:', openImage);
                    handleImageError(e, ['.png', '.jpg', '.jpeg']);
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                Ruta original: {openImage.startsWith('/') ? openImage.substring(1) : openImage}
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

      {/* Diálogo de confirmación para unir problemas */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>¿Está seguro de que quiere consolidar los problemas seleccionados?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
          <Button onClick={handleConfirmUnir} variant="contained" color="primary">Consolidar problemas</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para finalizar paso 2 */}
      <Dialog open={openConfirmFinalizar} onClose={() => setOpenConfirmFinalizar(false)}>
        <DialogTitle>¿Está seguro de que quiere terminar la fase 2?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenConfirmFinalizar(false)}>Cancelar</Button>
          <Button onClick={handleFinalizarPaso2} variant="contained" color="primary">Finalizar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de error */}
      <Snackbar 
      open={snackbar.open} 
      autoHideDuration={3000} 
      onClose={() => setSnackbar({ ...snackbar, open: false })}>
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

export default Paso2Consolidar;