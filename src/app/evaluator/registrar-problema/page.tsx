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
  Container,
  Alert,
  Snackbar
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import PreviewIcon from '@mui/icons-material/Visibility';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { formatImagePath } from '@/utils/imageUtils';
import { problemaService } from '@/services/problemaService';
import { uploadService } from '@/services/uploadService';
import { Problema } from '@/components/interface/Problema';
import ImageDebugComponent from '@/components/debug/ImageDebugComponent';

// Interfaz para el formato esperado por el backend (copiada del servicio)
interface ProblemaBackend {
  numero_problema: number;
  nombre_problema: string;
  descripcion_problema: string;
  fk_heuristica_incumplida: number;
  ejemplo_ocurrencia: string;
  url_imagen: string;
}

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
  const [identificador, setIdentificador] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // Obtener el ID de evaluación y EV-id de sessionStorage
  React.useEffect(() => {
    const evaluacionId = sessionStorage.getItem('evaluacionId');
    const evId = sessionStorage.getItem('EV-id');
    
    if (!evaluacionId || !evId) {
      console.warn('No se encontró ID de evaluación o EV-id en sessionStorage');
      router.push('/evaluator/dashboard');
      return;
    }

    setIdentificador(evId);
    console.log('EV-id loaded in registration page:', evId);
  }, [router]);

  const heuristicaSeleccionada = HEURISTICAS_NIELSEN.find(h => h.id === Number(principio));

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar formato de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrores((prev: any) => ({
          ...prev,
          imagen: 'Formato no soportado. Solo se permiten archivos .jpg, .jpeg y .png'
        }));
        return;
      }
      
      // Validar tamaño de archivo (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrores((prev: any) => ({
          ...prev,
          imagen: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
        }));
        return;
      }
      
      // Limpiar errores si todo está bien
      if (errores.imagen) {
        setErrores((prev: any) => ({ ...prev, imagen: undefined }));
      }
      
      setImagen(file);
      
      // Create an object URL for the image preview
      const objectUrl = URL.createObjectURL(file);
      setImagenPreview(objectUrl);
      
      // Clean up the URL when the component is unmounted
      return () => URL.revokeObjectURL(objectUrl);
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

  const handleRegistrar = async () => {
    if (!validar()) return;
    
    setLoading(true);
    try {
      const evaluacionId = sessionStorage.getItem('evaluacionId');
      if (!evaluacionId) {
        throw new Error('No se encontró ID de evaluación');
      }
      
      let imagenUrl = '';
      
      // Subir imagen si existe
      if (imagen) {
        const directorio = sessionStorage.getItem('directorio') || 'Crunch';
        
        console.log('=== REGISTRO DE PROBLEMA CON IMAGEN ===');
        console.log('Subiendo imagen:', {
          fileName: imagen.name,
          directorio,
          numeroProblema: parseInt(numeroProblema)
        });
        
        const uploadResult = await uploadService.uploadImage(imagen, directorio, parseInt(numeroProblema));
        
        console.log('Resultado del upload:', uploadResult);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Error al subir la imagen');
        }
        
        imagenUrl = uploadResult.filePath || '';
        console.log('Imagen subida exitosamente:');
        console.log('- Ruta para BD:', imagenUrl);
        console.log('- Ubicación física:', uploadResult.savedLocation);
        
        // Verificar que el backend puede acceder a la imagen
        if (uploadResult.savedLocation) {
          console.log('Verificando accesibilidad de la imagen...');
          try {
            const workingDirInfo = await uploadService.getWorkingDirectoryInfo();
            console.log('Información del directorio de trabajo del backend:', workingDirInfo);
          } catch (debugError) {
            console.warn('No se pudo obtener información de debug del backend:', debugError);
          }
        }
      }

      console.log('Datos para crear problema:', {
        evaluacionId,
        numeroProblema,
        nombreProblema,
        imagenUrl
      });

      // Mapear los datos del formulario al formato esperado por el backend
      const problemaData: ProblemaBackend = {
        numero_problema: parseInt(numeroProblema),
        nombre_problema: nombreProblema,
        descripcion_problema: descripcion,
        fk_heuristica_incumplida: parseInt(principio),
        ejemplo_ocurrencia: ejemploOcurrencia,
        url_imagen: imagenUrl,
        // El fk_evaluador se establecerá automáticamente en el backend usando el token de autenticación
        // El fk_evaluacion se establecerá usando el parámetro de la URL
      };

      const problemaCreado = await problemaService.createProblema(parseInt(evaluacionId), problemaData);
      
      console.log('Problema creado exitosamente:', problemaCreado);
      
      // Mostrar mensaje de éxito
      setShowSuccess(true);
      
      // Resetear formulario
      setNumeroProblema('');
      setNombreProblema('');
      setDescripcion('');
      setPrincipio('');
      setEjemploOcurrencia('');
      setImagen(null);
      setImagenPreview(null);
      setErrores({});
      
      // Opcional: redirigir después de un tiempo
      setTimeout(() => {
        if (evaluacionId) {
          router.push(`/evaluator/evaluacion/${evaluacionId}`);
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Error al registrar el problema:', error);
      setErrorMessage(error.message || 'Error al registrar el problema');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const evaluacionId = sessionStorage.getItem('evaluacionId');

  const handleCancelar = () => {
    if (evaluacionId != null) {
      router.push(`/evaluator/evaluacion/${evaluacionId}`);
    } else {
      console.warn('No se encontró ID de evaluación en sessionStorage');
      router.push('/dashboard');
    }
  };

  // Actualizar las breadcrumbs para usar el ID dinámico
  const renderBreadcrumbs = () => {;
    return (
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={e => { 
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
            onClick={e => { 
              e.preventDefault(); 
              router.push(`/evaluator/evaluacion/${evaluacionId}`); 
            }}
          >
            EV {evaluacionId}
          </Link>
        )}
        <Typography color="text.primary">Registrar Problema</Typography>
      </Breadcrumbs>
    );
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {renderBreadcrumbs()}
        <Typography variant="h4" gutterBottom>Registrar Nuevo Problema</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Número del problema"
              value={numeroProblema}
              onChange={e => setNumeroProblema(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              InputProps={{
                startAdornment: <InputAdornment position="start"> {identificador} - </InputAdornment>
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
                accept="image/jpeg,image/jpg,image/png"
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
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleRegistrar} 
              fullWidth
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Problema'}
            </Button>
            <Button variant="outlined" color="inherit" onClick={handleCancelar} fullWidth>
              Cancelar
            </Button>
          </Grid>
        </Grid>
        
        {/* Snackbars para notificaciones */}
        <Snackbar 
          open={showSuccess} 
          autoHideDuration={6000} 
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
            ¡Problema registrado exitosamente! Redirigiendo a la evaluación...
          </Alert>
        </Snackbar>
        
        <Snackbar 
          open={showError} 
          autoHideDuration={6000} 
          onClose={() => setShowError(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
        
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
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/placeholder.png';
                }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
        
        {/* Componente de debug temporal 
        {process.env.NODE_ENV === 'development' && (
          <ImageDebugComponent />
        )}
        */}
      </Container>
    </>
  );
}

export default RegistrarProblemaPage; 