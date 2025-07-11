'use client';

import { useState } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { ImageOutlined as ImageIcon, Download as DownloadIcon, Close as CloseIcon } from '@mui/icons-material';

interface Problema {
  id: string;
  nombre: string;
  heuristica: string;
  descripcion: string;
  imagen?: string;
}

interface TablaProblemasProps {
  problemas: Problema[];
  titulo?: string;
}

export default function TablaProblemas({ problemas, titulo = "Problemas encontrados" }: TablaProblemasProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(8);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleImageClick = (imagePath: string) => {
    setSelectedImage(imagePath);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handleDownloadImage = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage;
      link.download = 'evidencia.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {titulo}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="10%">ID</TableCell>
              <TableCell width="25%">Nombre del problema</TableCell>
              <TableCell width="20%">Heurística incumplida</TableCell>
              <TableCell width="35%">Descripción</TableCell>
              <TableCell width="10%" align="center">Imagen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {problemas
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((problema) => (
                <TableRow key={problema.id}>
                  <TableCell>{problema.id}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {problema.nombre}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {problema.heuristica}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {problema.descripcion}
                  </TableCell>
                  <TableCell align="center">
                    {problema.imagen && (
                      <Tooltip title="Ver imagen">
                        <IconButton
                          size="small"
                          onClick={() => handleImageClick(problema.imagen!)}
                          sx={{ color: 'primary.main' }}
                        >
                          <ImageIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={problemas.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[8]}
      />

      {/* Image Preview Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={handleCloseImage}
        maxWidth="md"
        fullWidth
      >
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
              alt="Evidencia del problema"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
} 