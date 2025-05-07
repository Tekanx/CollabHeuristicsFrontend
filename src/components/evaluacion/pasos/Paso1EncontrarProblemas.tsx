import React, { useState } from 'react';
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
  Typography
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

// Mock data
const mockProblemas: Problema[] = Array.from({ length: 20 }, (_, i) => ({
  identificador: `EVSP`,
  id: `HE-${String(i + 1).padStart(2, '0')}`,
  nombreProblema: `Ejemplo de nombre del error ${i + 1}`,
  descripcion: `Ejemplo de descripción del error ${i + 1}`,
  heuristicaIncumplida: `N${(i % 10) + 1}`,
  ejemploOcurrencia: `Ejemplo de Ocurrencia: Home → Nav ${i + 1}`,
  imagen: '/map.png',
}));

interface Paso1EncontrarProblemasProps {
  mostrarFinalizarPaso1?: boolean;
  onFinalizarPaso1?: () => void;
}

function Paso1EncontrarProblemas({ mostrarFinalizarPaso1 = false, onFinalizarPaso1 }: Paso1EncontrarProblemasProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(8);
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openInfo, setOpenInfo] = useState(false);
  const router = useRouter();

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
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

  // Filtro de búsqueda
  const filteredProblemas = mockProblemas.filter(
    (p) =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.nombreProblema.toLowerCase().includes(search.toLowerCase())
  );

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            placeholder="ID o Nombre del Problema"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {mostrarFinalizarPaso1 && (
            <Button variant="contained" color="secondary" onClick={onFinalizarPaso1}>
              Finalizar Paso 1
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabla de problemas */}
      <Paper>
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
              {filteredProblemas
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((problema) => (
                  <TableRow key={problema.id}>
                    <TableCell>{problema.identificador} - {problema.id}</TableCell>
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
                        <IconButton size="small" color="primary">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modificar">
                        <IconButton size="small" color="secondary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredProblemas.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[8]}
        />
      </Paper>

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
    </Box>
  );
}

export default Paso1EncontrarProblemas;