'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import { evaluacionService } from '@/services/evaluacionService';

interface ConfiguracionProps {
  evaluacionId: number;
}

export default function Configuracion({ evaluacionId }: ConfiguracionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Estado para los valores de los inputs (inicialmente vacíos)
  const [config, setConfig] = useState({
    evaluacionIdentificador: '',
    nombreEvaluacion: '',
    descripcion: ''
  });

  // Estado para almacenar los datos originales de la evaluación (para placeholders y campos no editables)
  const [evaluacionData, setEvaluacionData] = useState<any>(null);
  
  // Cargar datos de la evaluación
  useEffect(() => {
    const fetchEvaluacionData = async () => {
      try {
        setLoadingData(true);
        const data = await evaluacionService.getEvaluacion(evaluacionId);
        console.log('📋 Datos de evaluación cargados:', data);
        console.log('📋 Propiedades específicas:');
        console.log('  - evaluacion_identificador:', data.evaluacion_identificador);
        console.log('  - nombre_evaluacion:', data.nombre_evaluacion);
        console.log('  - descripcion:', data.descripcion);
        console.log('  - directorio:', data.directorio);
        setEvaluacionData(data);
      } catch (error) {
        console.error('Error al cargar datos de la evaluación:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchEvaluacionData();
  }, [evaluacionId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name as string]: value
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenConfirmDialog(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      setLoading(true);
      setOpenConfirmDialog(false);
      
      // Preparar datos para actualizar
      const updateData = {
        nombre_evaluacion: config.nombreEvaluacion || evaluacionData?.nombre_evaluacion || '',
        descripcion: config.descripcion || evaluacionData?.descripcion || '',
        evaluacion_identificador: config.evaluacionIdentificador || evaluacionData?.evaluacion_identificador || ''
      };
      
      await evaluacionService.actualizarEvaluacion(evaluacionId, updateData);
      
      // Recargar datos actualizados
      const dataActualizada = await evaluacionService.getEvaluacion(evaluacionId);
      setEvaluacionData(dataActualizada);
      
      // Limpiar campos editados
      setConfig({
        evaluacionIdentificador: '',
        nombreEvaluacion: '',
        descripcion: ''
      });
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error al actualizar evaluación:', error);
      alert('Error al actualizar la evaluación. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvaluacion = () => {
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoadingDelete(true);
      setOpenDeleteDialog(false);
      
      await evaluacionService.eliminarEvaluacion(evaluacionId);
      
      // Redirigir al dashboard después de eliminar exitosamente
      router.push('/dashboard/coordinator');
      
    } catch (error) {
      console.error('Error al eliminar evaluación:', error);
      alert('Error al eliminar la evaluación. Por favor, intente nuevamente.');
    } finally {
      setLoadingDelete(false);
    }
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Configuración de la Evaluación
        </Typography>
        
        {updateSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ¡Evaluación actualizada exitosamente!
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Evaluación Identificador y Nombre en la misma fila */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Evaluación identificador"
                name="evaluacionIdentificador"
                value={config.evaluacionIdentificador}
                placeholder={
                  evaluacionData?.evaluacion_identificador && 
                  typeof evaluacionData.evaluacion_identificador === 'string' 
                    ? evaluacionData.evaluacion_identificador 
                    : 'Ingrese el identificador'
                }
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                label="Nombre de la evaluación"
                name="nombreEvaluacion"
                value={config.nombreEvaluacion}
                placeholder={
                  evaluacionData?.nombre_evaluacion && 
                  typeof evaluacionData.nombre_evaluacion === 'string' 
                    ? evaluacionData.nombre_evaluacion 
                    : 'Ingrese el nombre de la evaluación'
                }
                onChange={handleChange}
              />
            </Grid>
            
            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                name="descripcion"
                value={config.descripcion}
                placeholder={
                  evaluacionData?.descripcion && 
                  typeof evaluacionData.descripcion === 'string' 
                    ? evaluacionData.descripcion 
                    : 'Ingrese la descripción de la evaluación'
                }
                onChange={handleChange}
              />
            </Grid>
            
            {/* Conjunto de heurística aplicada - No modificable */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Conjunto de heurística aplicada"
                name="conjuntoHeuristica"
                value="Conjunto de las 10 heurísticas de Nielsen"
                InputProps={{
                  readOnly: true,
                }}
                disabled
                helperText="Este campo no puede ser modificado"
              />
            </Grid>
            
            {/* Nombre de Carpeta - No modificable */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de Carpeta"
                name="nombreCarpeta"
                value={evaluacionData?.directorio || ''}
                InputProps={{
                  readOnly: true,
                }}
                disabled
                helperText="Este campo no puede ser modificado"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteEvaluacion}
                disabled={loading || loadingDelete}
              >
                Eliminar Evaluación
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={loading || loadingDelete}
              >
                Guardar modificación
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Diálogo de confirmación */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>¿Está seguro de que desea guardar las modificaciones?</DialogTitle>
        <DialogContent>
          <Typography>
            Se actualizarán los siguientes campos de la evaluación:
          </Typography>
          <Box sx={{ mt: 2 }}>
            {config.evaluacionIdentificador && (
              <Typography variant="body2">
                • <strong>Identificador:</strong> {config.evaluacionIdentificador}
              </Typography>
            )}
            {config.nombreEvaluacion && (
              <Typography variant="body2">
                • <strong>Nombre:</strong> {config.nombreEvaluacion}
              </Typography>
            )}
            {config.descripcion && (
              <Typography variant="body2">
                • <strong>Descripción:</strong> {config.descripcion}
              </Typography>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmUpdate} variant="contained" color="primary" disabled={loading}>
            Confirmar cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar evaluación */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>
          ¿Está seguro de que desea eliminar esta evaluación?
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              ¡ADVERTENCIA: Esta acción es irreversible!
            </Typography>
          </Alert>
          <Typography>
            Se eliminará permanentemente la evaluación:
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">
              • <strong>Identificador:</strong> {evaluacionData?.evaluacion_identificador}
            </Typography>
            <Typography variant="body2">
              • <strong>Nombre:</strong> {evaluacionData?.nombre_evaluacion}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Todos los datos asociados a esta evaluación se perderán permanentemente, 
            incluyendo problemas encontrados, puntuaciones de evaluadores y configuraciones.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error" 
            disabled={loadingDelete}
            startIcon={loadingDelete ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {loadingDelete ? 'Eliminando...' : 'Eliminar Evaluación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 