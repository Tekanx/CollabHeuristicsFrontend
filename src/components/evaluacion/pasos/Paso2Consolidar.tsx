import React, { useState } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, IconButton, Tooltip, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Typography, Snackbar, Alert, DialogContent
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';
import { Problema } from '@/components/interface/Problema';
import { Evaluador } from '@/components/interface/Evaluador';

// Mock de evaluadores
const mockEvaluadores: Evaluador[] = [
  { nombreUsuario: 'eval1', nombre: 'Evaluador 1', apellido: 'Pérez', correo: 'eval1@mail.com', numero: 1, rol: 'EVALUADOR', genero: 1, contrasena: '', paso_actual: 2 },
  { nombreUsuario: 'eval2', nombre: 'Evaluador 2', apellido: 'García', correo: 'eval2@mail.com', numero: 2, rol: 'EVALUADOR', genero: 1, contrasena: '', paso_actual: 2 },
  { nombreUsuario: 'eval3', nombre: 'Evaluador 3', apellido: 'López', correo: 'eval3@mail.com', numero: 3, rol: 'EVALUADOR', genero: 1, contrasena: '', paso_actual: 2 },
];

// Mock de heurísticas
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

// Mock de problemas (agregar campo evaluador para filtro)
const mockProblemas: (Problema & { evaluador: string })[] = Array.from({ length: 20 }, (_, i) => ({
  identificador: `EVSP`,
  id: `HE-${String(i + 1).padStart(2, '0')}`,
  nombreProblema: `Ejemplo de nombre del error ${i + 1}`,
  descripcion: `Ejemplo de descripción del error ${i + 1}`,
  heuristicaIncumplida: `N${((i % 10) + 1)}`,
  ejemploOcurrencia: `Ejemplo de Ocurrencia: Home → Nav ${i + 1}`,
  imagen: '/map.png',
  evaluador: mockEvaluadores[i % mockEvaluadores.length].nombreUsuario,
}));

interface Paso2ConsolidarProps {
  mostrarFinalizarPaso2?: boolean;
  onFinalizarPaso2?: () => void;
}

function Paso2Consolidar({ mostrarFinalizarPaso2 = false, onFinalizarPaso2 }: Paso2ConsolidarProps) {
  const [search, setSearch] = useState('');
  const [selectedEvaluadores, setSelectedEvaluadores] = useState<string[]>(mockEvaluadores.map(e => e.nombreUsuario));
  const [selectedHeuristica, setSelectedHeuristica] = useState<string>('');
  const [selectedProblemas, setSelectedProblemas] = useState<string[]>([]);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openConfirmFinalizar, setOpenConfirmFinalizar] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const router = useRouter();

  // Filtro de problemas
  const filteredProblemas = mockProblemas.filter(p =>
    selectedEvaluadores.includes(p.evaluador) &&
    (selectedHeuristica === '' || p.heuristicaIncumplida === `N${selectedHeuristica}`) &&
    (p.id.toLowerCase().includes(search.toLowerCase()) || p.nombreProblema.toLowerCase().includes(search.toLowerCase()))
  );

  // Selección de problemas
  const handleSelectProblema = (id: string) => {
    setSelectedProblemas(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  // Selección de evaluadores
  const handleToggleEvaluador = (nombreUsuario: string) => {
    setSelectedEvaluadores(prev =>
      prev.includes(nombreUsuario)
        ? prev.filter(e => e !== nombreUsuario)
        : [...prev, nombreUsuario]
    );
  };

  // Confirmar unión de problemas
  const handleUnirProblemas = () => {
    if (selectedProblemas.length < 2) {
      setSnackbar({ open: true, message: 'Debe seleccionar al menos dos problemas para unir.' });
      return;
    }
    setOpenConfirm(true);
  };

  // Redirigir a consolidar
  const handleConfirmUnir = () => {
    setOpenConfirm(false);
    // Buscar los problemas seleccionados
    const problemasSeleccionados = mockProblemas.filter(p => selectedProblemas.includes(p.id));
    // Redirigir pasando los problemas seleccionados (simulación: localStorage, query, o estado global)
    // Aquí usamos sessionStorage para demo
    sessionStorage.setItem('problemasAConsolidar', JSON.stringify(problemasSeleccionados));
    router.push('/evaluator/evaluacion/consolidar');
  };

  // Imagen
  const handleImageClick = (img: string) => setOpenImage(img);
  const handleCloseImage = () => setOpenImage(null);
  const handleDownloadImage = () => {
    if (openImage) {
      const link = document.createElement('a');
      link.href = openImage;
      link.download = 'evidence.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Box>
      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Evaluadores</InputLabel>
          <Select
            multiple
            value={selectedEvaluadores}
            onChange={e => setSelectedEvaluadores(typeof e.target.value === 'string' ? [e.target.value] : e.target.value as string[])}
            label="Evaluadores"
            renderValue={selected =>
              mockEvaluadores.filter(e => selected.includes(e.nombreUsuario)).map(e => e.nombre).join(', ')
            }
          >
            {mockEvaluadores.map(e => (
              <MenuItem key={e.nombreUsuario} value={e.nombreUsuario}>
                <Checkbox checked={selectedEvaluadores.includes(e.nombreUsuario)} />
                {e.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Principio incumplido</InputLabel>
          <Select
            value={selectedHeuristica}
            onChange={e => setSelectedHeuristica(e.target.value)}
            label="Principio incumplido"
          >
            <MenuItem value="">Todos</MenuItem>
            {HEURISTICAS_NIELSEN.map(h => (
              <MenuItem key={h.id} value={h.id}>{h.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
        <Button variant="contained" color="primary" onClick={handleUnirProblemas} sx={{ ml: 2 }}>
          Unir Problemas
        </Button>
        {mostrarFinalizarPaso2 && (
          <Button variant="contained" color="secondary" sx={{ ml: 2 }} onClick={() => setOpenConfirmFinalizar(true)}>
            Finalizar Paso 2
          </Button>
        )}
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
              {filteredProblemas.map((problema) => (
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
                    <Tooltip title={selectedProblemas.includes(problema.id) ? 'Deseleccionar' : 'Seleccionar'}>
                      <IconButton size="small" color={selectedProblemas.includes(problema.id) ? 'success' : 'default'} onClick={() => handleSelectProblema(problema.id)}>
                        {selectedProblemas.includes(problema.id) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal de imagen */}
      <Dialog open={!!openImage} onClose={handleCloseImage} maxWidth="md" fullWidth>
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
          {openImage && (
            <Box
              component="img"
              src={openImage}
              alt="Problem evidence"
              sx={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para unir problemas */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>¿Está seguro de que quiere consolidar los problemas seleccionados?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
          <Button onClick={handleConfirmUnir} variant="contained" color="primary">Consolidar problemas</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para finalizar paso 2 */}
      <Dialog open={openConfirmFinalizar} onClose={() => setOpenConfirmFinalizar(false)}>
        <DialogTitle>¿Está seguro de que quiere terminar la fase 2?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenConfirmFinalizar(false)}>Cancelar</Button>
          <Button onClick={() => { setOpenConfirmFinalizar(false); if (onFinalizarPaso2) onFinalizarPaso2(); }} variant="contained" color="primary">Finalizar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de error */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
        <Alert severity="warning" sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Paso2Consolidar;