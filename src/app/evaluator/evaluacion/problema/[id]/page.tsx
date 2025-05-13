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
  CircularProgress
} from '@mui/material';
import Header from '@/components/Header';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { Problema } from '@/components/interface/Problema';
import { problemaService } from '@/services/problemaService';
import { heuristicService } from '@/services/heuristicaService';
import { PrincipioHeuristica } from '@/components/interface/PrincipioHeuristica';
import axios from '@/utils/axiosConfig';


export default function ProblemaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/evaluator/evaluacion/1'; // Valor por defecto si no hay returnTo
  
  const [problema, setProblema] = useState<Problema | null>(null);
  const [loading, setLoading] = useState(true);
  const [principios, setPrincipios] = useState<PrincipioHeuristica[]>([]);
  const [openModify, setOpenModify] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);
  const [openImage, setOpenImage] = useState(false);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch problema by ID
        if (params.id) {
          const problemaData = await problemaService.getProblema(Number(params.id));
          setProblema(problemaData);
          setFormData(problemaData);
          console.log("Problema cargado:", problemaData);
          
          // Obtener evaluación vinculada al problema para conocer su heurística
          // Normalmente esto vendría del problema directamente, pero aquí asumimos que tenemos que obtenerlo
          const evaluacionId = problemaData.id_evaluacion || 1; // Fallback a 1 si no existe
          
          // Obtener los principios de la heurística asociada a la evaluación
          const evaluacionResponse = await axios.get(`/evaluaciones/${evaluacionId}`);
          const evaluacion = evaluacionResponse.data;
          const heuristicaId = evaluacion.id_heuristica;
          
          const principiosData = await heuristicService.getPrincipiosHeuristicos(heuristicaId);
          setPrincipios(principiosData);
          console.log("Principios heurísticos:", principiosData);

          // Verificar si hay que abrir el modal de edición
          const shouldEdit = searchParams.get('edit') === 'true';
          if (shouldEdit) {
            setOpenModify(true);
          }
        }
      } catch (error) {
        console.error("Error al cargar los datos:", error);
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

  const handleDownloadImage = () => {
    if (problema?.imagen) {
      const link = document.createElement('a');
      link.href = problema.imagen;
      link.download = 'evidence.png';
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
        await problemaService.updateProblema(Number(params.id), formData);
        setProblema(formData);
      }
      
      setOpenModify(false);
    } catch (error) {
      console.error("Error al modificar el problema:", error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (params.id) {
        await problemaService.deleteProblema(Number(params.id));
        router.push(returnTo);
      }
    } catch (error) {
      console.error("Error al eliminar el problema:", error);
    }
  };

  const handleBack = () => {
    router.push(returnTo);
  };

  // Obtener el nombre del principio por su número
  const getPrincipioNombre = (numeroPrincipio: string | undefined) => {
    if (!numeroPrincipio) return "No especificado";
    
    // Extraer solo el número del formato "N1", "N2", etc.
    const numeroMatch = numeroPrincipio.match(/\d+/);
    if (!numeroMatch) return numeroPrincipio;
    
    const numero = parseInt(numeroMatch[0]);
    const principio = principios.find(p => p.numeroPrincipio === numero);
    return principio ? principio.nombrePrincipio : `Principio ${numero}`;
  };

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

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, position: 'relative' }}>
          {/* Botones de acción en la esquina superior derecha */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
            <Tooltip title="Ayuda">
              <IconButton onClick={handleHelpClick} sx={{ color: '#0057B7' }}>
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleModifyClick}
              sx={{ ml: 1 }}
            >
              Modificar Problema
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleDeleteClick}
              sx={{ ml: 1 }}
            >
              Eliminar Problema
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleBack}
              sx={{ ml: 1 }}
            >
              Salir de visualización
            </Button>
          </Box>

          {/* Título y subtítulo */}
          <Box sx={{ pt: 5, pb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {problema?.nombreProblema}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              ID: {problema?.identificador} - {problema?.id} Principio incumplido: {problema?.heuristicaIncumplida} ({getPrincipioNombre(problema?.heuristicaIncumplida)})
            </Typography>
          </Box>

          {/* Contenido principal */}
          <Grid container spacing={3}>
            {/* Columna izquierda (imagen) */}
            <Grid item xs={12} md={6}>
              <Box 
                component="img"
                src={problema?.imagen || "/placeholder.png"}
                alt="Evidencia del problema"
                sx={{ 
                  width: '100%', 
                  cursor: 'pointer',
                  border: '1px solid #eee',
                  borderRadius: 1,
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

            {/* Columna derecha (detalles) */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Descripción
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography>{problema?.descripcion}</Typography>
              </Paper>

              <Typography variant="h6" gutterBottom>
                Comentarios
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography>{problema?.descripcion}</Typography>
              </Paper>

              <Typography variant="h6" gutterBottom>
                Histórico de cambios
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container>
                  <Grid item xs={3} sx={{ fontWeight: 'bold' }}>N° de cambio</Grid>
                  <Grid item xs={6} sx={{ fontWeight: 'bold' }}>Cambio realizado</Grid>
                  <Grid item xs={3} sx={{ fontWeight: 'bold' }}>Autor del cambio</Grid>
                </Grid>
                {[1, 2, 3, 4].map((i) => (
                  <Grid container key={i} sx={{ mt: 1, pt: 1, borderTop: i > 1 ? '1px solid #eee' : 'none' }}>
                    <Grid item xs={3}>{String(i).padStart(2, '0')}</Grid>
                    <Grid item xs={6}>Ejemplo de Texto que explicaría el cambio y porqué lo realizó el autor.</Grid>
                    <Grid item xs={3}>Nombre del Autor que realizó el cambio.</Grid>
                  </Grid>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Modal para modificar problema */}
        <Dialog 
          open={openModify} 
          onClose={() => setOpenModify(false)}
          maxWidth="md"
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
                    {principios.map((principio) => (
                      <MenuItem key={principio.numeroPrincipio} value={`N${principio.numeroPrincipio}`}>
                        {principio.nombrePrincipio}
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
              <IconButton onClick={handleDownloadImage} sx={{ mr: 1 }}>
                <DownloadIcon />
              </IconButton>
              <IconButton onClick={handleCloseImage}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {problema?.imagen && (
              <Box
                component="img"
                src={problema.imagen}
                alt="Problem evidence"
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </>
  );
}