"use client";
import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Breadcrumbs,
  Link,
  Container
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import PreviewIcon from '@mui/icons-material/Visibility';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

const HEURISTICAS_NIELSEN = [
  { id: 1, nombre: 'Visibilidad del estado del sistema', descripcion: 'El sistema debe mantener a los usuarios informados sobre lo que está ocurriendo.' },
  { id: 2, nombre: 'Correspondencia entre el sistema y el mundo real', descripcion: 'El sistema debe hablar el idioma de los usuarios.' },
  { id: 3, nombre: 'Control y libertad del usuario', descripcion: 'Los usuarios a menudo eligen funciones por error y necesitarán una salida de emergencia.' },
  { id: 4, nombre: 'Consistencia y estándares', descripcion: 'Los usuarios no deberían tener que preguntarse si diferentes palabras, situaciones o acciones significan lo mismo.' },
  { id: 5, nombre: 'Prevención de errores', descripcion: 'Mejor que buenos mensajes de error es un diseño cuidadoso que prevenga que ocurran problemas.' },
  { id: 6, nombre: 'Reconocimiento antes que recuerdo', descripcion: 'Minimizar la carga de memoria del usuario haciendo visibles los objetos, acciones y opciones.' },
  { id: 7, nombre: 'Flexibilidad y eficiencia de uso', descripcion: 'Los aceleradores —invisibles para el usuario novato— pueden acelerar la interacción para el usuario experto.' },
  { id: 8, nombre: 'Diseño estético y minimalista', descripcion: 'Los diálogos no deben contener información irrelevante o raramente necesaria.' },
  { id: 9, nombre: 'Ayuda a los usuarios a reconocer, diagnosticar y recuperarse de errores', descripcion: 'Los mensajes de error deben expresarse en lenguaje sencillo.' },
  { id: 10, nombre: 'Ayuda y documentación', descripcion: 'Puede ser necesario proporcionar ayuda y documentación.' },
];

function RegistrarProblemaPage() {
  const [numeroProblema, setNumeroProblema] = useState('');
  const [nombreProblema, setNombreProblema] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [principio, setPrincipio] = useState('');
  const [ejemploOcurrencia, setEjemploOcurrencia] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errores, setErrores] = useState<any>({});
  const router = useRouter();

  const heuristicaSeleccionada = HEURISTICAS_NIELSEN.find(h => h.id === Number(principio));

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagen(e.target.files[0]);
      setImagenPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const validar = () => {
    const errs: any = {};
    if (!numeroProblema || !/^[0-9]{1,3}$/.test(numeroProblema)) errs.numeroProblema = 'Ingrese un número de hasta 3 dígitos';
    if (!nombreProblema || nombreProblema.length > 100) errs.nombreProblema = 'Máximo 100 caracteres';
    if (!descripcion) errs.descripcion = 'Campo obligatorio';
    if (!principio) errs.principio = 'Seleccione un principio';
    if (!ejemploOcurrencia || ejemploOcurrencia.length > 250) errs.ejemploOcurrencia = 'Máximo 250 caracteres';
    if (!imagen) errs.imagen = 'Debe subir una imagen';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegistrar = () => {
    if (!validar()) return;
    // Simular guardado de imagen y generación de JSON
    const rutaImagen = `/public/${imagen?.name}`;
    const data = {
      identificador: 'EVS',
      numeroProblema,
      nombreProblema,
      descripcion,
      principioIncumplido: heuristicaSeleccionada?.nombre,
      descripcionPrincipio: heuristicaSeleccionada?.descripcion,
      ejemploOcurrencia,
      rutaImagen
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `problema_${numeroProblema}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Resetear formulario
    setNumeroProblema('');
    setNombreProblema('');
    setDescripcion('');
    setPrincipio('');
    setEjemploOcurrencia('');
    setImagen(null);
    setImagenPreview(null);
    setErrores({});
  };

  const handleCancelar = () => {
    router.push('/evaluator/evaluacion/EV01'); // Mock: redirige a la evaluación
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="#" onClick={e => { e.preventDefault(); router.push('/dashboard'); }}>Dashboard</Link>
          <Link color="inherit" href="#" onClick={e => { e.preventDefault(); router.push('/evaluator/evaluacion/EV01'); }}>EV 01</Link>
          <Typography color="text.primary">Registrar Problema</Typography>
        </Breadcrumbs>
        <Typography variant="h4" gutterBottom>Registrar Nuevo Problema</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Número del problema"
              value={numeroProblema}
              onChange={e => setNumeroProblema(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              InputProps={{
                startAdornment: <InputAdornment position="start">EVS</InputAdornment>
              }}
              error={!!errores.numeroProblema}
              helperText={errores.numeroProblema}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nombre del Problema"
              value={nombreProblema}
              onChange={e => setNombreProblema(e.target.value.slice(0, 100))}
              error={!!errores.nombreProblema}
              helperText={errores.nombreProblema}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descripción"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              error={!!errores.descripcion}
              helperText={errores.descripcion}
              fullWidth
              required
              multiline
              minRows={3}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errores.principio}>
              <InputLabel>Principio incumplido</InputLabel>
              <Select
                value={principio}
                label="Principio incumplido"
                onChange={e => setPrincipio(e.target.value)}
              >
                {HEURISTICAS_NIELSEN.map(h => (
                  <MenuItem key={h.id} value={h.id}>{h.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            {heuristicaSeleccionada && (
              <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, minHeight: 80 }}>
                <Typography variant="subtitle2">Descripción del principio:</Typography>
                <Typography variant="body2">{heuristicaSeleccionada.descripcion}</Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Ejemplo de Ocurrencia"
              value={ejemploOcurrencia}
              onChange={e => setEjemploOcurrencia(e.target.value.slice(0, 250))}
              error={!!errores.ejemploOcurrencia}
              helperText={errores.ejemploOcurrencia}
              fullWidth
              required
              multiline
              minRows={2}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <Button
              variant="contained"
              component="label"
              startIcon={<ImageIcon />}
              fullWidth
              color={errores.imagen ? 'error' : 'primary'}
            >
              Subir imagen
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImagenChange}
              />
            </Button>
            {errores.imagen && <Typography color="error" variant="caption">{errores.imagen}</Typography>}
            {imagen && <Typography variant="caption">{imagen.name}</Typography>}
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            {imagenPreview && (
              <Button variant="outlined" startIcon={<PreviewIcon />} onClick={() => setPreviewOpen(true)}>
                Preview
              </Button>
            )}
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" color="success" onClick={handleRegistrar} fullWidth>
              Registrar Problema
            </Button>
            <Button variant="outlined" color="inherit" onClick={handleCancelar} fullWidth>
              Cancelar
            </Button>
          </Grid>
        </Grid>
        {/* Modal de preview de imagen */}
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Vista previa de imagen</DialogTitle>
          <DialogContent>
            {imagenPreview && (
              <Box
                component="img"
                src={imagenPreview}
                alt="Preview"
                sx={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'contain' }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

export default RegistrarProblemaPage; 