'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useRouter } from 'next/navigation';
import { Problema } from '@/components/interface/Problema';
import { problemaService } from '@/services/problemaService';
import { useAuth } from '@/hooks/useAuth';
import { evaluacionService } from '@/services/evaluacionService';
import { evaluadorService } from '@/services/evaluadorService';
import { formatImagePath, handleImageError } from '@/utils/imageUtils';

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

interface Paso1EncontrarProblemasProps {
  mostrarFinalizarPaso1?: boolean;
  onFinalizarPaso1?: () => void;
  evaluacionId?: string;
  EV_id?: string;
}
interface Evaluador {
  id_evaluador: number;
  nombre: string;
  apellido: string;
  correo: string;
  nombre_usuario: string;
  numero?: string;
  genero?: number;
  paso_actual?: number;
}


function Paso1EncontrarProblemas({ mostrarFinalizarPaso1 = false, onFinalizarPaso1, evaluacionId = '1', EV_id = '' }: Paso1EncontrarProblemasProps) {
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [selectedHeuristica, setSelectedHeuristica] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openInfo, setOpenInfo] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problema | null>(null);
  const [evaluadorAutenticado, setEvaluadorAutenticado] = useState<any>(null);
  const [evaluadores, setEvaluadores] = useState<Evaluador[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const router = useRouter();
  const { user } = useAuth();
  // Cargar problemas del evaluador actual para la evaluación específica
  useEffect(() => {
    const fetchProblemas = async () => {
      try {
        setLoading(true);
        
        // Si tenemos el ID de evaluación, intentamos cargar todos los problemas de esa evaluación primero
        if (evaluacionId) {
          try {
            // Primero intentamos obtener todos los problemas de la evaluación
            const response = await problemaService.getProblemasByEvaluacion(parseInt(evaluacionId));
            const problemasData = response as any[];
            console.log(`Problemas de la evaluación ${evaluacionId}:`, problemasData);
            const evaluacion = await evaluacionService.getEvaluacion(parseInt(evaluacionId));
            const evaluacionIdentificador = evaluacion.evaluacion_identificador;
            
            console.log('1.-EV-id:', evaluacionIdentificador);
            // Guardar el identificador en sessionStorage inmediatamente después de obtenerlo
            sessionStorage.setItem('EV-id', evaluacionIdentificador);
            sessionStorage.setItem('evaluacionId', evaluacionId);
            
            // Guardar también el directorio para uso en el registro de problemas
            if (evaluacion.directorio) {
              sessionStorage.setItem('directorio', evaluacion.directorio);
              console.log('Directorio guardado desde Paso1:', evaluacion.directorio);
            }
            // Si tenemos usuario con id_evaluador, filtramos por ese evaluador
            const problemasFiltrados = user?.id_evaluador 
              ? problemasData.filter(p => p.fk_evaluador === user.id_evaluador)
              : problemasData;

            // Transformar los problemas al formato esperado
            const problemasTransformados = problemasFiltrados.map(p => ({
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
            return;
          } catch (error) {
            console.error(`Error al obtener problemas de la evaluación ${evaluacionId}:`, error);
            // Continuamos con el siguiente enfoque si hay error
          }
        }
        
        // Si el primer enfoque falla o no tenemos evaluacionId, pero sí tenemos id_evaluador
        if (user?.id_evaluador) {
          const problemasEvaluador = await problemaService.getProblemasofEvaluador(user.id_evaluador);
          console.log(`Problemas del evaluador ${user.id_evaluador}:`, problemasEvaluador);
          
          // Filtrar por evaluación si es necesario
          if (evaluacionId) {
            const problemasFiltrados = problemasEvaluador.filter(p => 
              p.id_evaluacion === parseInt(evaluacionId)
            );
            console.log(`Problemas filtrados por evaluación ${evaluacionId}:`, problemasFiltrados);
            setProblemas(problemasFiltrados);
          } else {
            setProblemas(problemasEvaluador);
          }
        } else {
          console.warn('No se pudo determinar el evaluador o la evaluación');
          setProblemas([]);
        }
      } catch (error) {
        console.error('Error al cargar problemas:', error);
        setProblemas([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchEvaluadores = async () => {
      const evaluadoresAsignados = await evaluadorService.getEvaluadoresByEvaluacion(parseInt(evaluacionId));
      const evaluadoresConDatos = await Promise.all(
        evaluadoresAsignados.map(async (evaluador: Evaluador) => {
          const progreso = await evaluacionService.getProgresoEvaluador(parseInt(evaluacionId), evaluador.id_evaluador);
          console.log(`👤 Evaluador ${evaluador.nombre}: progreso real = ${progreso}`);
          return {
            ...evaluador,
            paso_actual: progreso || 1
          };
        })
      );
      setEvaluadores(evaluadoresConDatos);
    };

    fetchEvaluadores();
    fetchProblemas();
  }, [evaluacionId, user, EV_id]);

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

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleImageClick = (imagePath: string) => {
    setSelectedImage(formatImagePath(imagePath));
  };
  
  const handleCloseImage = () => setSelectedImage(null);
  
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

  const handleAddProblem = () => {
    const currentEVId = sessionStorage.getItem('EV-id');
    console.log('Current EV-id before navigation:', currentEVId);
    
    // Asegurarnos de que tenemos el EV-id antes de navegar
    if (!currentEVId) {
      console.warn('EV-id no encontrado en sessionStorage');
      return;
    }

     
      // Validación 1: Verificar si hay evaluadores con paso_actual > 2
      const hayEvaluadoresAvanzados = evaluadores.some(evaluador => 
        evaluador.paso_actual && evaluador.paso_actual > 2
      );

      if (hayEvaluadoresAvanzados) {
        setSnackbar({
          open: true,
          message: 'No se puede agregar más problemas cuando hay participantes que han avanzado más allá del paso 2',
          severity: 'error',
        });
        return;
      }

    // Guardar los valores en sessionStorage
    sessionStorage.setItem('evaluacionId', evaluacionId);
    // No necesitamos volver a guardar EV-id ya que ya está en sessionStorage
    
    router.push('/evaluator/registrar-problema');
  };

  // Visualizar problema
  const handleViewProblem = (problemId: number) => {
    sessionStorage.removeItem('evaluacionId');
    sessionStorage.removeItem('EV-id');
    sessionStorage.setItem('evaluacionId', evaluacionId);
    sessionStorage.setItem('EV-id', EV_id);
    router.push(`/evaluator/evaluacion/problema/${problemId}?returnTo=/evaluator/evaluacion/${evaluacionId}`);
  };

  // Modificar problema (redirige a la misma vista que visualizar)
  const handleEditProblem = (problemId: number) => {
    sessionStorage.removeItem('evaluacionId');
    sessionStorage.removeItem('EV-id');
    sessionStorage.setItem('evaluacionId', evaluacionId);
    sessionStorage.setItem('EV-id', EV_id);
    router.push(`/evaluator/evaluacion/problema/${problemId}?returnTo=/evaluator/evaluacion/${evaluacionId}&edit=true`);
  };

  // Eliminar problema
  const handleDeleteClick = (problema: Problema) => {
    setSelectedProblem(problema);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedProblem && selectedProblem.id) {
      try {
        await problemaService.deleteProblema(Number(selectedProblem.id));
        // Actualizar la lista de problemas después de eliminar
        setProblemas(prev => prev.filter(p => p.id !== selectedProblem.id));
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error al eliminar problema:', error);
        setSnackbar({
          open: true,
          message: 'No se pudo eliminar el problema. Por favor, intente nuevamente.',
          severity: 'error',
        });
      }
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  // Filtro de problemas
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

  // Finalizar Paso 1 - Actualizar progreso a paso 2
  const handleFinalizarPaso1 = async () => {
    console.log('🔍 [Paso1] Debuggando valores:');
    console.log('  - evaluacionId (prop):', evaluacionId);
    console.log('  - evaluacionId (tipo):', typeof evaluacionId);
    console.log('  - evaluacionId (convertido):', Number(evaluacionId));
    console.log('  - evaluadorAutenticado:', evaluadorAutenticado);
    console.log('  - evaluadorAutenticado?.id_evaluador:', evaluadorAutenticado?.id_evaluador);
    
    try {
      if (evaluadorAutenticado?.id_evaluador && evaluacionId) {
        console.log('🔄 [Paso1] Finalizando Paso 1...');
        console.log('📋 [Paso1] Actualizando progreso del evaluador:', evaluadorAutenticado.id_evaluador);
        console.log('📋 [Paso1] En evaluación:', evaluacionId);
        console.log('📋 [Paso1] Nuevo progreso: 2');
        
        // Mostrar valores exactos que se van a enviar
        console.log('📤 [Paso1] Parámetros que se enviarán:');
        console.log('  - evaluacionService.setProgresoEvaluador(');
        console.log('    ', Number(evaluacionId), ',');
        console.log('    ', evaluadorAutenticado.id_evaluador, ',');
        console.log('    ', 2);
        console.log('  )');
        
        // Actualizar el progreso del evaluador a paso 2
        const resultado = await evaluacionService.setProgresoEvaluador(
          Number(evaluacionId), 
          evaluadorAutenticado.id_evaluador, 
          2
        );
        
        console.log('✅ [Paso1] Respuesta de setProgresoEvaluador:', resultado);
        console.log('✅ [Paso1] Paso 1 finalizado exitosamente');
        
        // Llamar al prop del padre si existe para actualizar el estado global
        if (onFinalizarPaso1) {
          console.log('📞 [Paso1] Llamando callback del padre...');
          onFinalizarPaso1();
        } else {
          console.log('⚠️ [Paso1] No hay callback del padre definido');
        }
        
        console.log('🎉 [Paso1] Proceso de finalización completado');
      } else {
        setSnackbar({
          open: true,
          message: 'Error: ❌ No se puede finalizar el paso 1. Falta información del evaluador o evaluación.',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('❌ [Paso1] Error al finalizar el Paso 1:', error);
      console.error('❌ [Paso1] Error completo:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      
      // Mostrar mensaje de error al usuario
      alert('Error al finalizar el paso 1. Por favor, intente nuevamente.');
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
      {/* Encabezado */}
      <Paper sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2, bgcolor: '#f5f7fa', p: 2, borderRadius: 2 }}>
        <Button variant="contained" color="primary" onClick={handleAddProblem}>
          Agregar nuevo problema
        </Button>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
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
          sx={{ minWidth: 250, flexGrow: 1 }}
        />
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
                      <Tooltip title="Modificar">
                          <IconButton size="small" color="primary" onClick={() => handleEditProblem(Number(problema.id))}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(problema)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No se encontraron problemas. Puedes añadir uno nuevo con el botón "Agregar nuevo problema".
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Botón Finalizar fuera de la tabla */}
      {mostrarFinalizarPaso1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleFinalizarPaso1}
            sx={{ minWidth: 200 }}
          >
            Finalizar Paso 1
          </Button>
        </Box>
      )}

      {/* Modal de información */}
      <Dialog open={openInfo} onClose={() => setOpenInfo(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setOpenInfo(false)}>Cerrar</Button>
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

      {/* Diálogo de confirmación para eliminar problema */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>¿Está seguro de que desea eliminar este problema?</DialogTitle>
        <DialogContent>
          <Typography>
            Esta acción no se puede deshacer. El problema "{selectedProblem?.nombreProblema}" será eliminado permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">Eliminar</Button>
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

export default Paso1EncontrarProblemas;