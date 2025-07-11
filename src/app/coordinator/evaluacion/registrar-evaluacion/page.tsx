'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { coordinadorService, CreateEvaluacionData } from '@/services/coordinadorService';
import { useAuth } from '@/hooks/useAuth';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Función para obtener la fecha de hoy en formato YYYY-MM-DD (local)
function getTodayDateLocal(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayLocal = `${year}-${month}-${day}`;
  console.log('📅 [RegistrarEvaluacion] Fecha de hoy local:', todayLocal);
  return todayLocal;
}

// Función para convertir fecha YYYY-MM-DD a formato local sin problemas de zona horaria
function convertirFechaLocal(fechaYYYYMMDD: string): string {
  try {
    console.log('📅 [RegistrarEvaluacion] Convirtiendo fecha:', fechaYYYYMMDD);
    
    // Parsear la fecha como local (evitando conversión UTC)
    const [year, month, day] = fechaYYYYMMDD.split('-');
    const fechaLocal = new Date(Number(year), Number(month) - 1, Number(day));
    
    // Crear la fecha en formato ISO pero asegurándonos de que sea local
    const fechaCorregida = fechaLocal.toISOString().split('T')[0];
    
    console.log('📅 [RegistrarEvaluacion] Fecha original:', fechaYYYYMMDD);
    console.log('📅 [RegistrarEvaluacion] Fecha corregida:', fechaCorregida);
    
    return fechaCorregida;
  } catch (error) {
    console.error('❌ [RegistrarEvaluacion] Error al convertir fecha:', error);
    return fechaYYYYMMDD; // Fallback a la fecha original
  }
}

export default function RegistrarEvaluacionPage() {
  const router = useRouter();
  const { getDashboardPath } = useAuth();
  const [loading, setLoading] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form state
  const [formData, setFormData] = useState({
    evaluacionIdentificador: '',
    nombreEvaluacion: '',
    descripcion: '',
    directorio: '',
    fechaInicio: getTodayDateLocal()
  });

  // Validation errors
  const [errors, setErrors] = useState({
    evaluacionIdentificador: '',
    nombreEvaluacion: '',
    directorio: ''
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special validation for directory field (alphanumeric only, no spaces)
    if (name === 'directorio') {
      // Remove any non-alphanumeric characters and convert to lowercase
      const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      setFormData({
        ...formData,
        [name]: sanitizedValue
      });
      
      // Clear error if valid
      if (sanitizedValue.length > 0) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Clear error when user starts typing
      if (value.trim()) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      evaluacionIdentificador: '',
      nombreEvaluacion: '',
      directorio: ''
    };

    if (!formData.evaluacionIdentificador.trim()) {
      newErrors.evaluacionIdentificador = 'El identificador de evaluación es obligatorio';
    }

    if (!formData.nombreEvaluacion.trim()) {
      newErrors.nombreEvaluacion = 'El nombre de la evaluación es obligatorio';
    }

    if (!formData.directorio.trim()) {
      newErrors.directorio = 'El nombre de carpeta de imágenes es obligatorio';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.directorio)) {
      newErrors.directorio = 'Solo se permiten caracteres alfanuméricos, sin espacios';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Por favor, corrija los errores en el formulario.',
        severity: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      console.log('🚀 Iniciando proceso de creación de evaluación...');
      
      // Prepare evaluation data - CORREGIDO PARA EVITAR PROBLEMAS DE ZONA HORARIA
      // Convertir fecha local a formato que el backend entienda correctamente
      const fechaInicioCorregida = convertirFechaLocal(formData.fechaInicio);
      
      const evaluacionData: CreateEvaluacionData = {
        evaluacion_identificador: formData.evaluacionIdentificador,
        nombre_evaluacion: formData.nombreEvaluacion,
        descripcion: formData.descripcion,
        directorio: formData.directorio,
        fecha_inicio: fechaInicioCorregida
      };

      console.log('📤 [RegistrarEvaluacion] Enviando datos de evaluación:', evaluacionData);
      console.log('📅 [RegistrarEvaluacion] Fecha original del formulario:', formData.fechaInicio);
      console.log('📅 [RegistrarEvaluacion] Fecha corregida a enviar:', fechaInicioCorregida);
      console.log('📅 [RegistrarEvaluacion] Tipo de fecha:', typeof fechaInicioCorregida);
      console.log('⏰ [RegistrarEvaluacion] Timestamp antes del envío:', new Date().toISOString());

      // Send the data using coordinator service
      const resultado = await coordinadorService.createEvaluacion(evaluacionData);
      
      console.log('✅ [RegistrarEvaluacion] Evaluación creada exitosamente:', resultado);
      console.log('🆔 [RegistrarEvaluacion] ID generado:', resultado.id_evaluacion);
      console.log('🔗 [RegistrarEvaluacion] Identificador asignado:', resultado.evaluacion_identificador);
      console.log('📅 [RegistrarEvaluacion] Fecha de inicio devuelta por backend:', resultado.fecha_inicio);
      console.log('📅 [RegistrarEvaluacion] Comparación fechas:');
      console.log('    - Enviada:', formData.fechaInicio);
      console.log('    - Recibida:', resultado.fecha_inicio);
      console.log('⏰ [RegistrarEvaluacion] Timestamp después del envío:', new Date().toISOString());
      
      setSnackbar({
        open: true,
        message: `Evaluación creada correctamente con ID: ${resultado.id_evaluacion}, Redirigiendo al Dashboard...`,
        severity: 'success'
      });
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push(getDashboardPath());
      }, 2000); // Aumenté el tiempo para ver el mensaje de éxito
      
    } catch (error: any) {
      console.error('❌ Error al crear la evaluación:', error);
      console.log('⏰ Timestamp del error:', new Date().toISOString());
      
      let errorMessage = 'Error al crear la evaluación. Por favor, intente nuevamente.';
      
      // Handle specific error for duplicate identifier
      if (error.response) {
        const responseData = error.response.data;
        console.log('📋 Respuesta de error completa:', {
          status: error.response.status,
          data: responseData,
          headers: error.response.headers
        });
        
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData && responseData.message) {
          errorMessage = responseData.message;
        }
        
        // Check for unique constraint violation (duplicate identifier)
        if (errorMessage.toLowerCase().includes('unique') || 
            errorMessage.toLowerCase().includes('duplicate') ||
            errorMessage.toLowerCase().includes('evaluacion_identificador') ||
            errorMessage.toLowerCase().includes('ya existe')) {
          errorMessage = `El identificador "${formData.evaluacionIdentificador}" ya existe. Por favor, use uno diferente.`;
          setErrors(prev => ({ 
            ...prev, 
            evaluacionIdentificador: 'Este identificador ya está en uso' 
          }));
          console.log('🔄 Error de duplicidad detectado para:', formData.evaluacionIdentificador);
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      console.log('🏁 Proceso de creación finalizado');
    }
  };

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              router.push(getDashboardPath());
            }}
          >
            Dashboard
          </Link>
          <Typography color="text.primary">Registrar Nueva Evaluación</Typography>
        </Breadcrumbs>

        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4">
              Registrar Nueva Evaluación Heurística
            </Typography>
            <Tooltip title="Información sobre cómo completar el formulario">
              <IconButton onClick={() => setOpenInfo(true)} sx={{ color: '#0057B7' }}>
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="body1" paragraph color="text.secondary">
            Complete el formulario para crear una nueva evaluación heurística.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Evaluación Identificador"
                  name="evaluacionIdentificador"
                  value={formData.evaluacionIdentificador}
                  onChange={handleChange}
                  placeholder="Ej. HE-01"
                  helperText={errors.evaluacionIdentificador || "Código único para identificar la evaluación"}
                  error={!!errors.evaluacionIdentificador}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Fecha de Inicio"
                  name="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Nombre evaluación"
                  name="nombreEvaluacion"
                  value={formData.nombreEvaluacion}
                  onChange={handleChange}
                  placeholder="Ej. Evaluación del sitio web institucional"
                  helperText={errors.nombreEvaluacion}
                  error={!!errors.nombreEvaluacion}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción de la evaluación"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  placeholder="Describa el propósito y alcance de la evaluación heurística"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Nombre de Carpeta Imágenes"
                  name="directorio"
                  value={formData.directorio}
                  onChange={handleChange}
                  placeholder="Ej. evaluacion01, websitereview, etc."
                  helperText={errors.directorio || "Solo caracteres alfanuméricos, sin espacios. Se usará para organizar las imágenes de evidencia"}
                  error={!!errors.directorio}
                  inputProps={{
                    pattern: "[a-zA-Z0-9]+",
                    title: "Solo se permiten caracteres alfanuméricos"
                  }}
                />
              </Grid>
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => router.push(getDashboardPath())}
                  disabled={loading}
                >
                  Cancelar / Volver atrás
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  Crear Evaluación
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Information Dialog */}
        <Dialog open={openInfo} onClose={() => setOpenInfo(false)} maxWidth="sm" fullWidth>
          <DialogTitle>¿Cómo completar el formulario?</DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Campos obligatorios:
              </Typography>
              <Typography variant="body2" paragraph>
                • <strong>Evaluación Identificador:</strong> Código único que identifica esta evaluación (ej. HE-01, EVAL-2024-01)
              </Typography>
              <Typography variant="body2" paragraph>
                • <strong>Nombre evaluación:</strong> Título descriptivo de la evaluación heurística
              </Typography>
              <Typography variant="body2" paragraph>
                • <strong>Nombre de Carpeta Imágenes:</strong> Nombre alfanumérico sin espacios para organizar las imágenes de evidencia
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Campos opcionales:
              </Typography>
              <Typography variant="body2" paragraph>
                • <strong>Descripción:</strong> Detalle del propósito y alcance de la evaluación
              </Typography>
              <Typography variant="body2" paragraph>
                • <strong>Fecha de Inicio:</strong> Se establece automáticamente como hoy
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInfo(false)}>Entendido</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
