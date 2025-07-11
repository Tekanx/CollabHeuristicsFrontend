'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  Grid,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WcIcon from '@mui/icons-material/Wc';
import axios from '@/utils/axiosConfig';
import { evaluadorService } from '@/services/evaluadorService';
import { evaluacionService } from '@/services/evaluacionService';

interface Evaluador {
  id_evaluador: number;
  nombre: string;
  apellido: string;
  correo: string;
  nombre_usuario: string;
  numero?: string;
  genero?: number;
  paso_actual?: number;
  cantidadProblemas?: number;
}

interface ParticipantesProps {
  evaluacionId: number;
}

export default function Participantes({ evaluacionId }: ParticipantesProps) {
  const [loading, setLoading] = useState(true);
  const [evaluadores, setEvaluadores] = useState<Evaluador[]>([]);
  const [evaluadoresDisponibles, setEvaluadoresDisponibles] = useState<Evaluador[]>([]);
  const [selectedEvaluador, setSelectedEvaluador] = useState<number | ''>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [evaluadorToDelete, setEvaluadorToDelete] = useState<Evaluador | null>(null);
  const [errorDeleteDialog, setErrorDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [loadingAction, setLoadingAction] = useState(false);

  // Función para obtener el texto del género
  const getGeneroText = (genero?: number) => {
    switch(genero) {
      case 0: return 'Masculino';
      case 1: return 'Femenino';
      case 2: return 'No especifica';
      default: return 'No especificado';
    }
  };

  // Función para mostrar errores de forma amigable
  const handleApiError = (error: any, defaultMessage: string) => {
    console.error('Error API:', error);
    let errorMessage = defaultMessage;
    
    if (error.response) {
      // Error de respuesta del servidor (403, 404, 500, etc.)
      if (error.response.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción. Contacta al administrador.';
      } else if (error.response.data && typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      console.log('Detalles del error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Error de red o sin respuesta
      errorMessage = 'No se pudo conectar con el servidor. Comprueba tu conexión a internet.';
    }
    
    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error',
    });
  };

  // Cargar los datos de los evaluadores
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener los evaluadores asignados a la evaluación usando el servicio
        const evaluadoresAsignados = await evaluadorService.getEvaluadoresByEvaluacion(evaluacionId);
        console.log('Evaluadores asignados:', evaluadoresAsignados);
        
        // Obtener cantidad de problemas por evaluador
        const evaluadoresConDatos = await Promise.all(
          evaluadoresAsignados.map(async (evaluador: Evaluador) => {
            try {
              // Obtener cantidad de problemas del evaluador
              const cantidadProblemas = await evaluadorService.getCantidadProblemasDeEvaluacion(
                evaluador.id_evaluador, 
                evaluacionId
              );
              
              // Obtener progreso real del evaluador usando el servicio
              let pasoActual = 1; // Valor por defecto
              try {
                const progreso = await evaluacionService.getProgresoEvaluador(evaluacionId, evaluador.id_evaluador);
                pasoActual = progreso || 1; // Si es null, usar 1
                console.log(`👤 Evaluador ${evaluador.nombre}: progreso real = ${progreso}`);
              } catch (progresoError) {
                console.warn(`⚠️ No se pudo obtener progreso para evaluador ${evaluador.id_evaluador}:`, progresoError);
                pasoActual = 1; // Fallback
              }
              
              return {
                ...evaluador,
                cantidadProblemas,
                paso_actual: pasoActual,
              };
            } catch (error) {
              console.error(`Error al obtener datos para evaluador ${evaluador.id_evaluador}:`, error);
              
              // Si hay error, intentar obtener al menos el progreso
              let pasoActual = 1;
              try {
                const progreso = await evaluacionService.getProgresoEvaluador(evaluacionId, evaluador.id_evaluador);
                pasoActual = progreso || 1;
              } catch (progresoError) {
                console.warn(`⚠️ No se pudo obtener progreso para evaluador ${evaluador.id_evaluador}:`, progresoError);
              }
              
              return {
                ...evaluador,
                cantidadProblemas: 0,
                paso_actual: pasoActual
              };
            }
          })
        );
        
        setEvaluadores(evaluadoresConDatos);
        
        // Obtener todos los evaluadores disponibles usando el servicio
        const todoEvaluadores = await evaluadorService.getAllEvaluadores();
        console.log('Todos los evaluadores:', todoEvaluadores);
        
        // Filtrar evaluadores que no están ya asignados a esta evaluación
        const idsAsignados = evaluadoresConDatos.map((e: Evaluador) => e.id_evaluador);
        const disponibles = todoEvaluadores.filter(
          (e: Evaluador) => !idsAsignados.includes(e.id_evaluador)
        );
        
        setEvaluadoresDisponibles(disponibles);
      } catch (error) {
        console.error('Error al cargar evaluadores:', error);
        handleApiError(error, 'Error al cargar los evaluadores. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (evaluacionId) {
      fetchData();
    }
  }, [evaluacionId]);

  // Manejar la adición de un evaluador
  const handleAddEvaluador = async () => {
    if (!selectedEvaluador) return;
    
    try {
      setLoadingAction(true);
      
      // Validación 1: Verificar si hay evaluadores con paso_actual > 2
      const hayEvaluadoresAvanzados = evaluadores.some(evaluador => 
        evaluador.paso_actual && evaluador.paso_actual > 2
      );
      
      // Validación 2: Verificar que no se excedan los 5 evaluadores
      if (evaluadores.length >= 5) {
        setSnackbar({
          open: true,
          message: 'No se pueden agregar más de 5 evaluadores a una evaluación',
          severity: 'error',
        });
        return;
      }
      
      if (hayEvaluadoresAvanzados) {
        setSnackbar({
          open: true,
          message: 'No se puede agregar evaluadores cuando hay participantes que han avanzado más allá del paso 2',
          severity: 'error',
        });
        return;
      }
      
      
      // Usar el servicio con la URL correcta
      await evaluadorService.agregarEvaluadorAEvaluacion(Number(selectedEvaluador), evaluacionId);
      
      // Actualizar la lista de evaluadores asignados y disponibles
      const evaluadorSeleccionado = evaluadoresDisponibles.find(e => e.id_evaluador === selectedEvaluador);
      
      if (evaluadorSeleccionado) {
        setEvaluadores([...evaluadores, { 
          ...evaluadorSeleccionado, 
          paso_actual: 1,
          cantidadProblemas: 0
        }]);
        setEvaluadoresDisponibles(evaluadoresDisponibles.filter(e => e.id_evaluador !== selectedEvaluador));
      }
      
      setSelectedEvaluador('');
      setSnackbar({
        open: true,
        message: 'Evaluador añadido correctamente',
        severity: 'success',
      });
    } catch (error) {
      handleApiError(error, 'Error al añadir el evaluador. Por favor, intenta de nuevo.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Verificar si se puede eliminar un evaluador
  const handleDeleteClick = async (evaluador: Evaluador) => {
    // Si ya tenemos la cantidad de problemas, usar ese valor
    if (typeof evaluador.cantidadProblemas !== 'undefined') {
      if (evaluador.cantidadProblemas > 0) {
        setEvaluadorToDelete(evaluador);
        setErrorDeleteDialog(true);
      } else {
        setEvaluadorToDelete(evaluador);
        setConfirmDeleteDialog(true);
      }
      return;
    }
    
    // Si no tenemos la cantidad, obtenerla
    try {
      setLoadingAction(true);
      const cantidadProblemas = await evaluadorService.getCantidadProblemasDeEvaluacion(
        evaluador.id_evaluador,
        evaluacionId
      );
      
      if (cantidadProblemas > 0) {
        setEvaluadorToDelete({...evaluador, cantidadProblemas});
        setErrorDeleteDialog(true);
      } else {
        setEvaluadorToDelete({...evaluador, cantidadProblemas});
        setConfirmDeleteDialog(true);
      }
    } catch (error) {
      handleApiError(error, 'Error al verificar si el evaluador puede ser eliminado.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Manejar la eliminación de un evaluador
  const handleRemoveEvaluador = async () => {
    if (!evaluadorToDelete) return;
    
    try {
      setLoadingAction(true);
      
      // Usar el servicio con la URL correcta
      await evaluadorService.eliminarEvaluadorDeEvaluacion(evaluadorToDelete.id_evaluador, evaluacionId);
      
      // Actualizar las listas de evaluadores
      setEvaluadores(evaluadores.filter(e => e.id_evaluador !== evaluadorToDelete.id_evaluador));
      
      // Solo agregar a disponibles si no es un evaluador que se acaba de crear
      if (evaluadorToDelete.nombre_usuario) {
        const evaluadorSinPaso = { ...evaluadorToDelete };
        delete evaluadorSinPaso.paso_actual;
        delete evaluadorSinPaso.cantidadProblemas;
        setEvaluadoresDisponibles([...evaluadoresDisponibles, evaluadorSinPaso]);
      }
      
      setSnackbar({
        open: true,
        message: 'Evaluador eliminado correctamente',
        severity: 'success',
      });
      
      setConfirmDeleteDialog(false);
      setEvaluadorToDelete(null);
    } catch (error) {
      handleApiError(error, 'Error al eliminar el evaluador. Por favor, intenta de nuevo.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Manejar el envío del formulario de invitación
  const handleSubmitInvitacion = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const data = {
      nombre: formData.get('nombre'),
      apellido: formData.get('apellido'),
      correo: formData.get('correo'),
    };
    
    try {
      setLoadingAction(true);
      
      // Llamar a la API para enviar la invitación
      await axios.post('/evaluadores/invitar', data);
      
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: 'Invitación enviada correctamente',
        severity: 'success',
      });
    } catch (error) {
      handleApiError(error, 'Error al enviar la invitación. Por favor, intenta de nuevo.');
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Acciones para gestionar evaluadores */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl sx={{ minWidth: 250 }}>
          <Select
            displayEmpty
            value={selectedEvaluador}
            onChange={(e) => setSelectedEvaluador(e.target.value as number)}
          >
            <MenuItem value="" disabled>
              Evaluador
            </MenuItem>
            {evaluadoresDisponibles.map((evaluador) => (
              <MenuItem key={evaluador.id_evaluador} value={evaluador.id_evaluador}>
                {evaluador.nombre} {evaluador.apellido}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          onClick={handleAddEvaluador}
          disabled={!selectedEvaluador || loadingAction}
          startIcon={<PersonAddIcon />}
        >
          {loadingAction ? <CircularProgress size={24} /> : 'Añadir evaluador'}
        </Button>
        {/*
        <Button
          variant="outlined"
          color="primary"
          onClick={handleSolicitarInvitacion}
          disabled={loadingAction}
        >
          Solicitar invitación
        </Button>*/}
      </Paper>

      {/* Lista de evaluadores asignados */}
      <Grid container spacing={2}>
        {evaluadores.length > 0 ? (
          evaluadores.map((evaluador) => (
            <Grid item xs={12} key={evaluador.id_evaluador}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: evaluador.genero === 0 ? '#2196F3' : 
                               evaluador.genero === 1 ? '#E91E63' : '#9C27B0'
                    }}
                  >
                    {evaluador.nombre.charAt(0)}{evaluador.apellido.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {evaluador.nombre} {evaluador.apellido}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {evaluador.correo || 'No especificado'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {evaluador.numero || 'No especificado'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WcIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {getGeneroText(evaluador.genero)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <Chip 
                    label={!evaluador.paso_actual ? 'No iniciado' : 
                           (evaluador.paso_actual || 0) === 4 ? 'Evaluación completada' : 
                           (evaluador.paso_actual || 0) === 3 ? 'Paso 3: En progreso' : 
                           (evaluador.paso_actual || 0) === 2 ? 'Paso 2: En progreso' : 
                           (evaluador.paso_actual || 0) === 1 ? 'Paso 1: En progreso' : 
                           'Paso 1: En progreso'} 
                    color={(evaluador.paso_actual || 0) === 4 ? "success" :
                           (evaluador.paso_actual || 0) === 3 ? "success" : 
                           (evaluador.paso_actual || 0) === 2 ? "primary" : 
                           (evaluador.paso_actual || 0) === 1 ? "warning" : 
                           "default"}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  
                  {evaluador.cantidadProblemas !== undefined && (
                    <Chip 
                      label={`${evaluador.cantidadProblemas} ${evaluador.cantidadProblemas === 1 ? 'problema' : 'problemas'}`} 
                      color={evaluador.cantidadProblemas > 0 ? "info" : "default"}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  <IconButton 
                    color="error"
                    onClick={() => handleDeleteClick(evaluador)}
                    disabled={loadingAction}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No hay evaluadores asignados a esta evaluación
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Diálogo para solicitar invitación */}
      <Dialog open={openDialog} onClose={() => !loadingAction && setOpenDialog(false)}>
        <DialogTitle>Solicitar invitación para un nuevo evaluador</DialogTitle>
        <form onSubmit={handleSubmitInvitacion}>
          <DialogContent>
            <TextField
              autoFocus
              required
              margin="dense"
              name="nombre"
              label="Nombre"
              fullWidth
              variant="outlined"
            />
            <TextField
              required
              margin="dense"
              name="apellido"
              label="Apellido"
              fullWidth
              variant="outlined"
            />
            <TextField
              required
              margin="dense"
              name="correo"
              label="Correo electrónico"
              type="email"
              fullWidth
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} disabled={loadingAction}>Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loadingAction}
            >
              {loadingAction ? <CircularProgress size={24} /> : 'Enviar invitación'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diálogo de confirmación para eliminar evaluador */}
      <Dialog 
        open={confirmDeleteDialog} 
        onClose={() => !loadingAction && setConfirmDeleteDialog(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar al evaluador {evaluadorToDelete?.nombre} {evaluadorToDelete?.apellido}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDeleteDialog(false)} 
            disabled={loadingAction}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRemoveEvaluador} 
            variant="contained" 
            color="error" 
            disabled={loadingAction}
          >
            {loadingAction ? <CircularProgress size={24} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de error al intentar eliminar un evaluador con problemas */}
      <Dialog 
        open={errorDeleteDialog} 
        onClose={() => setErrorDeleteDialog(false)}
      >
        <DialogTitle>No se puede eliminar</DialogTitle>
        <DialogContent>
          <Typography>
            No es posible eliminar al evaluador {evaluadorToDelete?.nombre} {evaluadorToDelete?.apellido} porque ha ingresado {evaluadorToDelete?.cantidadProblemas} {evaluadorToDelete?.cantidadProblemas === 1 ? 'problema' : 'problemas'} en la evaluación.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setErrorDeleteDialog(false)} 
            variant="contained"
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
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
