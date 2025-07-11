"use client";
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogActions, Select, MenuItem, TextField, FormControl, InputLabel, Snackbar, Alert, DialogContent, Breadcrumbs, Link, Container
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import PreviewIcon from '@mui/icons-material/Visibility';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

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

function ConsolidarPage() {
  const [problemas, setProblemas] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [openConfirm, setOpenConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'info' }>({ open: false, message: '' });
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [evaluacionId, setEvaluacionId] = useState<string>('');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Verificar autenticación
    if (!user) {
      router.push('/login');
      return;
    }

    // Cargar problemas del sessionStorage
    const data = sessionStorage.getItem('problemasAConsolidar');
    if (data) {
      try {
      const parsed = JSON.parse(data);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('No hay problemas válidos para consolidar');
        }
      setProblemas(parsed);
        
        // Obtener el ID de evaluación del primer problema
        if (parsed[0]?.id_evaluacion) {
          setEvaluacionId(parsed[0].id_evaluacion.toString());
        }

      // Inicializar el formulario con el primer problema
      setForm({
        id: parsed[0]?.id || '',
        nombreProblema: parsed[0]?.nombreProblema || '',
        heuristicaIncumplida: parsed[0]?.heuristicaIncumplida || '',
        ejemploOcurrencia: parsed[0]?.ejemploOcurrencia || '',
        imagen: parsed[0]?.imagen || '',
        descripcion: parsed[0]?.descripcion || '',
          id_evaluacion: parsed[0]?.id_evaluacion || '',
        });
      } catch (error) {
        console.error('Error al parsear los problemas:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar los problemas seleccionados',
          severity: 'error'
        });
        // Limpiar storage y redirigir
        sessionStorage.removeItem('problemasAConsolidar');
        router.push('/dashboard');
      }
    } else {
      // Si no hay problemas seleccionados, redirigir al dashboard
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (form.id) {
      // eslint-disable-next-line no-console
      console.log('Identificador de evaluación en consolidación:', form.id);
    }
  }, [form.id]);

  // Cambiar campo del formulario
  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  // Elegir valor de un problema existente
  const handleSelectFromProblem = (field: string, idx: number) => {
    setForm((prev: any) => ({ ...prev, [field]: problemas[idx][field] }));
  };

  // Consolidar problemas
  const handleConsolidar = () => {
    // Validación simple
    if (!form.id || !form.nombreProblema || !form.heuristicaIncumplida) {
      setSnackbar({ 
        open: true, 
        message: 'Complete los campos obligatorios.',
        severity: 'error'
      });
      return;
    }
    setOpenConfirm(true);
  };

  // Confirmar consolidación
  const handleConfirmConsolidar = async () => {
    try {
    setOpenConfirm(false);
    const fecha = new Date().toISOString();
    const nuevoProblema = { ...form };
    const jsonHistorial = {
      eliminados: problemas,
      nuevo: nuevoProblema,
      fecha,
      idNuevo: nuevoProblema.id,
        autor: user?.username || 'evaluador_demo',
    };

      // Aquí deberías hacer la llamada a tu API para guardar la consolidación
      // Por ahora solo limpiamos el sessionStorage y redirigimos
    sessionStorage.removeItem('problemasAConsolidar');
      
      setSnackbar({ 
        open: true, 
        message: 'Consolidación realizada exitosamente',
        severity: 'success'
      });

      // Esperar un momento para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        router.push(`/evaluator/evaluacion/${evaluacionId}`);
      }, 1500);

    } catch (error) {
      console.error('Error al consolidar problemas:', error);
      setSnackbar({
        open: true,
        message: 'Error al consolidar los problemas',
        severity: 'error'
      });
    }
  };

  const handleCancelar = () => {
    // Limpiar el storage antes de redirigir
    sessionStorage.removeItem('problemasAConsolidar');
    router.push(`/evaluator/evaluacion/${evaluacionId}`);
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              handleCancelar();
            }}
          >
            Dashboard
          </Link>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              router.push(`/evaluator/evaluacion/${evaluacionId}`);
            }}
          >
            {`Evaluación ${evaluacionId}`}
          </Link>
          <Typography color="text.primary">Consolidar Problemas</Typography>
        </Breadcrumbs>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4" gutterBottom>Consolidar Problemas</Typography>
          {/* Tabla resumen */}
          <Typography variant="h6" sx={{ mt: 2 }}>Problemas seleccionados</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre Problema</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {problemas.map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.nombreProblema}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Formulario de consolidación */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Nuevo problema consolidado</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* ID */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="ID"
                  value={form.id || ''}
                  onChange={e => handleChange('id', e.target.value)}
                  required
                  sx={{ flex: 1 }}
                />
                <Select
                  size="small"
                  value={''}
                  displayEmpty
                  onChange={e => handleSelectFromProblem('id', Number(e.target.value))}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="" disabled>Elegir de...</MenuItem>
                  {problemas.map((p, idx) => (
                    <MenuItem key={p.id} value={idx}>{p.id}</MenuItem>
                  ))}
                </Select>
              </Box>
              {/* Nombre Problema */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Nombre del Problema"
                  value={form.nombreProblema || ''}
                  onChange={e => handleChange('nombreProblema', e.target.value)}
                  required
                  sx={{ flex: 1 }}
                />
                <Select
                  size="small"
                  value={''}
                  displayEmpty
                  onChange={e => handleSelectFromProblem('nombreProblema', Number(e.target.value))}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="" disabled>Elegir de...</MenuItem>
                  {problemas.map((p, idx) => (
                    <MenuItem key={p.id} value={idx}>{p.nombreProblema}</MenuItem>
                  ))}
                </Select>
              </Box>
              {/* Principio incumplido */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Principio incumplido</InputLabel>
                  <Select
                    label="Principio incumplido"
                    value={form.heuristicaIncumplida || ''}
                    onChange={e => handleChange('heuristicaIncumplida', e.target.value)}
                    required
                  >
                    {HEURISTICAS_NIELSEN.map(h => (
                      <MenuItem key={h.id} value={`N${h.id}`}>{h.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Select
                  size="small"
                  value={''}
                  displayEmpty
                  onChange={e => handleSelectFromProblem('heuristicaIncumplida', Number(e.target.value))}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="" disabled>Elegir de...</MenuItem>
                  {problemas.map((p, idx) => (
                    <MenuItem key={p.id} value={idx}>{p.heuristicaIncumplida}</MenuItem>
                  ))}
                </Select>
              </Box>
              {/* Ejemplo de Ocurrencia */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Ejemplo de Ocurrencia"
                  value={form.ejemploOcurrencia || ''}
                  onChange={e => handleChange('ejemploOcurrencia', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Select
                  size="small"
                  value={''}
                  displayEmpty
                  onChange={e => handleSelectFromProblem('ejemploOcurrencia', Number(e.target.value))}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="" disabled>Elegir de...</MenuItem>
                  {problemas.map((p, idx) => (
                    <MenuItem key={p.id} value={idx}>{p.ejemploOcurrencia}</MenuItem>
                  ))}
                </Select>
              </Box>
              {/* Imagen */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="URL Imagen"
                  value={form.imagen || ''}
                  onChange={e => handleChange('imagen', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Select
                  size="small"
                  value={''}
                  displayEmpty
                  onChange={e => handleSelectFromProblem('imagen', Number(e.target.value))}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="" disabled>Elegir de...</MenuItem>
                  {problemas.map((p, idx) => (
                    <MenuItem key={p.id} value={idx}>{p.imagen}</MenuItem>
                  ))}
                </Select>
                {form.imagen && (
                  <Button variant="outlined" startIcon={<PreviewIcon />} onClick={() => setPreviewImg(form.imagen)}>
                    Preview
                  </Button>
                )}
              </Box>
              {/* Descripción */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Descripción"
                  value={form.descripcion || ''}
                  onChange={e => handleChange('descripcion', e.target.value)}
                  sx={{ flex: 1 }}
                  multiline
                  minRows={2}
                />
                <Select
                  size="small"
                  value={''}
                  displayEmpty
                  onChange={e => handleSelectFromProblem('descripcion', Number(e.target.value))}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="" disabled>Elegir de...</MenuItem>
                  {problemas.map((p, idx) => (
                    <MenuItem key={p.id} value={idx}>{p.descripcion}</MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="inherit" onClick={handleCancelar}>
                Cancelar
              </Button>
              <Button variant="contained" color="success" onClick={handleConsolidar}>
                Consolidar Problemas
              </Button>
            </Box>
          </Paper>

          {/* Diálogo de confirmación */}
          <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
            <DialogTitle>¿Está seguro de consolidar y eliminar los problemas seleccionados?</DialogTitle>
            <DialogActions>
              <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
              <Button onClick={handleConfirmConsolidar} variant="contained" color="primary">Confirmar</Button>
            </DialogActions>
          </Dialog>

          {/* Preview de imagen */}
          <Dialog open={!!previewImg} onClose={() => setPreviewImg(null)} maxWidth="md" fullWidth>
            <DialogTitle>Vista previa de imagen</DialogTitle>
            <DialogContent>
              {previewImg && (
                <Box
                  component="img"
                  src={previewImg}
                  alt="Preview"
                  sx={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'contain' }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Snackbar mejorado */}
          <Snackbar 
            open={snackbar.open} 
            autoHideDuration={3000} 
            onClose={() => setSnackbar({ open: false, message: '' })}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              severity={snackbar.severity || 'info'} 
              sx={{ width: '100%' }}
              onClose={() => setSnackbar({ open: false, message: '' })}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </>
  );
}

export default ConsolidarPage;