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
  CircularProgress
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';
import { Problema } from '@/components/interface/Problema';
import { problemaService } from '@/services/problemaService';
import { useAuth } from '@/hooks/useAuth';
import { evaluacionService } from '@/services/evaluacionService';

interface Paso1EncontrarProblemasProps {
  mostrarFinalizarPaso1?: boolean;
  onFinalizarPaso1?: () => void;
  evaluacionId?: string;
}

function Paso1EncontrarProblemas({ mostrarFinalizarPaso1 = false, onFinalizarPaso1, evaluacionId = '1' }: Paso1EncontrarProblemasProps) {
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openInfo, setOpenInfo] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problema | null>(null);
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

    fetchProblemas();
  }, [evaluacionId, user]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleImageClick = (imagePath: string) => {
    setSelectedImage(imagePath);
  };
  
  const handleCloseImage = () => setSelectedImage(null);
  
  const handleDownloadImage = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage;
      link.download = 'evidence.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleAddProblem = () => {
    router.push('/evaluator/registrar-problema');
  };

  // Visualizar problema
  const handleViewProblem = (problemId: number) => {
    router.push(`/evaluator/evaluacion/problema/${problemId}?returnTo=/evaluator/evaluacion/${evaluacionId}`);
  };

  // Modificar problema (redirige a la misma vista que visualizar)
  const handleEditProblem = (problemId: number) => {
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
    return (
      problema.id?.toString().toLowerCase().includes(searchLower) ||
      problema.nombreProblema.toLowerCase().includes(searchLower) ||
      problema.descripcion.toLowerCase().includes(searchLower) ||
      problema.heuristicaIncumplida.toLowerCase().includes(searchLower) ||
      problema.ejemploOcurrencia.toLowerCase().includes(searchLower)
    );
  });

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="contained" color="primary" onClick={handleAddProblem}>
            Agregar nuevo problema
          </Button>
          <Tooltip title="Información sobre cómo interactuar con la vista">
            <IconButton onClick={() => setOpenInfo(true)} sx={{ color: '#0057B7' }}>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
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
        />
      </Box>

      {/* Tabla de problemas */}
      <Paper sx={{ mb: 2 }}>
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
                          <IconButton size="small" onClick={() => handleImageClick(problema.imagen)} sx={{ color: 'primary.main' }}>
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
        />
      </Paper>

      {/* Botón Finalizar fuera de la tabla */}
      {mostrarFinalizarPaso1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={onFinalizarPaso1}
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
            <IconButton onClick={handleDownloadImage} sx={{ mr: 1 }}>
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={handleCloseImage}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
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
    </Box>
  );
}

export default Paso1EncontrarProblemas;