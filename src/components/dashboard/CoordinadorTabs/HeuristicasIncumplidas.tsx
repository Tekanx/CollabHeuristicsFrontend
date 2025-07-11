'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Tooltip,
  TablePagination,
  Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageIcon from '@mui/icons-material/Image';
import axios from '@/utils/axiosConfig';
import { useRouter } from 'next/navigation';

// Heurísticas de Nielsen
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

interface Problema {
  id: number;
  numeroProblema: number;
  nombreProblema: string;
  descripcion: string;
  heuristicaIncumplida: string;
  ejemploOcurrencia: string;
  imagen: string;
  id_evaluador: number;
  nombreEvaluador?: string;
}

interface Evaluador {
  id_evaluador: number;
  nombre: string;
  apellido: string;
}

interface HeuristicasIncumplidasProps {
  evaluacionId: number;
}

export default function HeuristicasIncumplidas({ evaluacionId }: HeuristicasIncumplidasProps) {
  const [loading, setLoading] = useState(true);
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [evaluadores, setEvaluadores] = useState<Evaluador[]>([]);
  const [selectedEvaluador, setSelectedEvaluador] = useState<string>('');
  const [selectedHeuristica, setSelectedHeuristica] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const router = useRouter();
  const identificadorEvaluacion = sessionStorage.getItem('identificadorEvaluacion');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener evaluadores asignados a la evaluación
        const evaluadoresResponse = await axios.get(`/evaluaciones/${evaluacionId}/evaluadores`);
        setEvaluadores(evaluadoresResponse.data);
        
        // Obtener todos los problemas de la evaluación
        const problemasResponse = await axios.get(`/evaluaciones/${evaluacionId}/problemas`);
        
        // Mapear los problemas para incluir información del evaluador
        const problemasConEvaluador = problemasResponse.data.map((problema: any) => {
          const evaluador = evaluadoresResponse.data.find(
            (e: Evaluador) => e.id_evaluador === problema.fk_evaluador
          );
          
          return {
            id: problema.id_problema,
            numeroProblema: problema.numero_problema,
            nombreProblema: problema.nombre_problema || 'Sin nombre',
            descripcion: problema.descripcion_problema || 'Sin descripción',
            heuristicaIncumplida: problema.fk_heuristica_incumplida ? `N${problema.fk_heuristica_incumplida}` : 'No definida',
            ejemploOcurrencia: problema.ejemplo_ocurrencia || 'Sin ejemplo',
            imagen: problema.url_imagen || '',
            id_evaluador: problema.fk_evaluador,
            nombreEvaluador: evaluador ? `${evaluador.nombre} ${evaluador.apellido}` : 'Desconocido',
          };
        });
        
        setProblemas(problemasConEvaluador);
      } catch (error) {
        console.error('Error al cargar datos de heurísticas incumplidas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (evaluacionId) {
      fetchData();
    }
  }, [evaluacionId]);

  // Filtrar problemas según los criterios seleccionados
  const filteredProblemas = problemas.filter((problema) => {
    // Filtrar por evaluador
    const matchesEvaluador = selectedEvaluador === '' || 
      problema.id_evaluador.toString() === selectedEvaluador;
    
    // Filtrar por heurística
    const matchesHeuristica = selectedHeuristica === '' || 
      problema.heuristicaIncumplida === `N${selectedHeuristica}`;
    
    // Filtrar por búsqueda
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      problema.nombreProblema.toLowerCase().includes(searchLower) ||
      problema.descripcion.toLowerCase().includes(searchLower) ||
      problema.ejemploOcurrencia.toLowerCase().includes(searchLower) ||
      (problema.nombreEvaluador && problema.nombreEvaluador.toLowerCase().includes(searchLower));
    
    return matchesEvaluador && matchesHeuristica && matchesSearch;
  });

  // Paginación
  const paginatedProblemas = filteredProblemas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleVerProblema = (problemaId: number) => {
    router.push(`/coordinator/evaluacion/problema/${problemaId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f5f7fa' }}>
        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Evaluador</InputLabel>
          <Select
            multiple
            value={selectedEvaluador ? [selectedEvaluador] : []}
            onChange={(e) => {
              const value = e.target.value;
              // When using multiple, the value will be an array
              // We take the first selected value (or empty string if none)
              const selectedVal = Array.isArray(value) && value.length > 0 ? value[0] : '';
              setSelectedEvaluador(selectedVal as string);
              setPage(0);
            }}
            label="Evaluador"
            renderValue={selected => 
              evaluadores
                .filter(e => selected.includes(e.id_evaluador.toString()))
                .map(e => `${e.nombre} ${e.apellido}`)
                .join(', ')
            }
          >
            <MenuItem value="">Todos</MenuItem>
            {evaluadores.map((evaluador) => (
              <MenuItem key={evaluador.id_evaluador} value={evaluador.id_evaluador.toString()}>
                <Checkbox checked={selectedEvaluador === evaluador.id_evaluador.toString()} />
                {evaluador.nombre} {evaluador.apellido}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 220 }} size="small">
          <InputLabel>Principio incumplido</InputLabel>
          <Select
            value={selectedHeuristica}
            onChange={(e) => {
              setSelectedHeuristica(e.target.value);
              setPage(0);
            }}
            label="Principio incumplido"
          >
            <MenuItem value="">Todos</MenuItem>
            {HEURISTICAS_NIELSEN.map((h) => (
              <MenuItem key={h.id} value={h.id.toString()}>
                {h.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          size="small"
          placeholder="Buscar problema"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        
        <Button
          variant="contained"
          size="medium"
          onClick={() => {
            setSelectedEvaluador('');
            setSelectedHeuristica('');
            setSearchQuery('');
            setPage(0);
          }}
        >
          Limpiar filtros
        </Button>
      </Paper>
      
      {/* Tabla de problemas */}
      <TableContainer component={Paper}>
        {/* Paginación superior */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredProblemas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{ borderBottom: '1px solid #e0e0e0' }}
        />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '10%' }}>ID</TableCell>
              <TableCell sx={{ width: '25%' }}>Nombre Problema encontrado</TableCell>
              <TableCell sx={{ width: '30%' }}>Descripción</TableCell>
              <TableCell sx={{ width: '10%' }}>Heurística incumplida</TableCell>
              <TableCell sx={{ width: '15%' }}>Ejemplo de ocurrencia</TableCell>
              <TableCell sx={{ width: '5%' }}>Imagen</TableCell>
              <TableCell align="center" sx={{ width: '5%' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProblemas.length > 0 ? (
              paginatedProblemas.map((problema) => (
                <TableRow key={problema.id}>
                  <TableCell>{identificadorEvaluacion}-{problema.numeroProblema.toString().padStart(2, '0')}</TableCell>
                  <TableCell sx={{ maxWidth: 180, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {problema.nombreProblema}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {problema.descripcion}
                  </TableCell>
                  <TableCell>{problema.heuristicaIncumplida}</TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {problema.ejemploOcurrencia}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver imagen">
                      <IconButton 
                        size="small" 
                        disabled={!problema.imagen}
                        color="primary"
                        onClick={() => problema.imagen && window.open(problema.imagen, '_blank')}
                      >
                        <ImageIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Visualizar">
                      <IconButton 
                        color="primary" 
                        size="small"
                        onClick={() => handleVerProblema(problema.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No se encontraron problemas con los filtros seleccionados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
