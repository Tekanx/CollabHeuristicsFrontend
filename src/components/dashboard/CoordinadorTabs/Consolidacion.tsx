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
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from '@/utils/axiosConfig';
import { useRouter } from 'next/navigation';

// Escalas de severidad
const ESCALA_SEVERIDAD = [
  { valor: 0, nombre: 'No es un problema', descripcion: 'No es un problema de usabilidad' },
  { valor: 1, nombre: 'Problema Cosmético', descripcion: 'El problema es solo "visual", aún así, el sistema funciona' },
  { valor: 2, nombre: 'Problema Menor', descripcion: 'El problema no impide el correcto funcionamiento del sistema, pero lo dificulta' },
  { valor: 3, nombre: 'Problema Mayor', descripcion: 'El problema genera dificultades para utilizar el sistema' },
  { valor: 4, nombre: 'Problema Catastrófico', descripcion: 'El problema impide el funcionamiento adecuado del sistema, generando errores' },
];

// Escalas de frecuencia
const ESCALA_FRECUENCIA = [
  { valor: 0, nombre: '< 1%', descripcion: 'Casi nunca ocurre' },
  { valor: 1, nombre: '1 a 10%', descripcion: 'Ocurre con muy poca frecuencia' },
  { valor: 2, nombre: '11% a 50%', descripcion: 'Ocurre con frecuencia moderada' },
  { valor: 3, nombre: '51% a 90%', descripcion: 'Ocurre con alta frecuencia' },
  { valor: 4, nombre: '>90%', descripcion: 'Ocurre casi siempre' },
];

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
  promedioFrecuencia: number;
  promedioSeveridad: number;
  promedioCriticidad: number;
}

interface ConsolidacionProps {
  evaluacionId: number;
}

export default function Consolidacion({ evaluacionId }: ConsolidacionProps) {
  const [loading, setLoading] = useState(true);
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [selectedHeuristica, setSelectedHeuristica] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  
  // Estados para filtros numéricos específicos
  const [frecuenciaOperador, setFrecuenciaOperador] = useState<string>('');
  const [frecuenciaValor, setFrecuenciaValor] = useState<string>('');
  const [severidadOperador, setSeveridadOperador] = useState<string>('');
  const [severidadValor, setSeveridadValor] = useState<string>('');
  const [criticidadOperador, setCriticidadOperador] = useState<string>('');
  const [criticidadValor, setCriticidadValor] = useState<string>('');
  
  const router = useRouter();
  const identificadorEvaluacion = sessionStorage.getItem('identificadorEvaluacion');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
      
        
        console.log('🔍 Solicitando problemas consolidados para evaluación:', evaluacionId);
        
        // Obtener los problemas consolidados de la evaluación
        const response = await axios.get(`/evaluaciones/${evaluacionId}/problemas/consolidados`);
        
        console.log('📊 Respuesta del backend:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // Procesar la respuesta real del backend
          const problemasConsolidados = response.data.map((problema: any) => ({
            id: problema.id,
            numeroProblema: problema.numeroProblema, // Usar el número del problema del backend
            nombreProblema: problema.nombreProblema || 'Sin nombre',
            descripcion: problema.descripcion || 'Sin descripción',
            heuristicaIncumplida: problema.heuristicaIncumplida || 'No definida',
            ejemploOcurrencia: problema.ejemploOcurrencia || 'Sin ejemplo',
            imagen: problema.imagen || '',
            // Usar los promedios reales calculados por el backend
            promedioFrecuencia: problema.promedioFrecuencia,
            promedioSeveridad: problema.promedioSeveridad,
            promedioCriticidad: problema.promedioCriticidad,
          }));
          
          console.log('✅ Problemas consolidados procesados:', problemasConsolidados);
          setProblemas(problemasConsolidados);
        } else {
          console.warn('⚠️ No se encontraron problemas consolidados');
          setProblemas([]);
        }
        
      } catch (error) {
        console.error('❌ Error al cargar datos de consolidación:', error);
        setProblemas([]);
      } finally {
        setLoading(false);
      }
    };

    if (evaluacionId) {
      fetchData();
    }
  }, [evaluacionId]);

  // Función para aplicar filtros numéricos (similar a Resumen.tsx)
  const aplicarFiltroNumerico = (valor: number, operador: string, valorFiltro: string): boolean => {
    if (!operador || !valorFiltro) return true;
    
    const filtroNum = parseFloat(valorFiltro);
    if (isNaN(filtroNum)) return true;
    
    // Solo aplicar filtro si el valor es mayor a 0 (ha sido evaluado)
    if (valor <= 0) return false;
    
    switch (operador) {
      case '>=': return valor >= filtroNum;
      case '<=': return valor <= filtroNum;
      case '>': return valor > filtroNum;
      case '<': return valor < filtroNum;
      case '=': return valor === filtroNum;
      default: return true;
    }
  };

  // Filtrar problemas según criterios actualizados
  const filteredProblemas = problemas.filter((problema) => {
    // Filtrar por heurística
    const matchesHeuristica = selectedHeuristica === '' || 
      problema.heuristicaIncumplida === `N${selectedHeuristica}`;
    
    // Nuevos filtros numéricos específicos
    const matchesFrecuenciaEspecifica = frecuenciaOperador === '' || frecuenciaValor === '' ||
      aplicarFiltroNumerico(problema.promedioFrecuencia, frecuenciaOperador, frecuenciaValor);
    
    const matchesSeveridadEspecifica = severidadOperador === '' || severidadValor === '' ||
      aplicarFiltroNumerico(problema.promedioSeveridad, severidadOperador, severidadValor);
    
    const matchesCriticidadEspecifica = criticidadOperador === '' || criticidadValor === '' ||
      aplicarFiltroNumerico(problema.promedioCriticidad, criticidadOperador, criticidadValor);
    
    // Filtrar por búsqueda
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      problema.nombreProblema.toLowerCase().includes(searchLower) ||
      problema.descripcion.toLowerCase().includes(searchLower) ||
      problema.ejemploOcurrencia.toLowerCase().includes(searchLower) ||
      problema.heuristicaIncumplida.toLowerCase().includes(searchLower);
    
    return matchesHeuristica && 
           matchesFrecuenciaEspecifica && matchesSeveridadEspecifica && matchesCriticidadEspecifica && 
           matchesSearch;
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

  const handleImageClick = (imageUrl: string) => {
    setOpenImage(imageUrl);
  };

  // Función para resetear todos los filtros
  const handleResetFilters = () => {
    setFrecuenciaOperador('');
    setFrecuenciaValor('');
    setSeveridadOperador('');
    setSeveridadValor('');
    setCriticidadOperador('');
    setCriticidadValor('');
    setSelectedHeuristica('');
    setSearchQuery('');
    setPage(0);
  };
  
  // Función para obtener el color del chip según el valor
  const getChipColor = (valor: number): { color: string; bgcolor: string } => {
    if (valor === 0) return { color: '#666', bgcolor: '#f5f5f5' };
    if (valor <= 2) return { color: '#2e7d32', bgcolor: '#e8f5e8' };
    if (valor === 3) return { color: '#ef6c00', bgcolor: '#fff3e0' };
    return { color: '#d32f2f', bgcolor: '#ffebee' };
  };

  const getChipColorCriticidad = (valor: number): { color: string; bgcolor: string } => {
    if (valor === 0) return { color: '#666', bgcolor: '#f5f5f5' };
    if (valor <= 3) return { color: '#2e7d32', bgcolor: '#e8f5e8' };
    if (valor <= 5) return { color: '#ef6c00', bgcolor: '#fff3e0' };
    if (valor <= 7) return { color: '#d32f2f', bgcolor: '#ffebee' };
    return { color: '#d91e1e', bgcolor: '#ffebee' };
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
      {/* Panel de escalas */}
      <Box sx={{ mb: 3, display: 'flex', gap: 3 }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Escala de Frecuencia
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nota</TableCell>
                <TableCell>Frecuencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ESCALA_FRECUENCIA.map((escala) => (
                <TableRow key={escala.valor}>
                  <TableCell>{escala.valor}</TableCell>
                  <TableCell>{escala.nombre}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
        
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Escala de Severidad
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nota</TableCell>
                <TableCell>Severidad</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ESCALA_SEVERIDAD.map((escala) => (
                <TableRow key={escala.valor}>
                  <TableCell>{escala.valor}</TableCell>
                  <TableCell>{escala.nombre}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#f5f7fa' }}>
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
          placeholder="Filtrar por"
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
        
        <Tooltip title="Mostrar filtros adicionales">
          <IconButton onClick={() => setShowFilter(!showFilter)}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      </Paper>
      
      {/* Filtros adicionales - ACTUALIZADOS con filtros numéricos */}
      {showFilter && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>          
          {/* Contenedor horizontal para todos los filtros */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap', mb: 2 }}>
            {/* Filtros de Frecuencia */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Frecuencia:</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Valor de frecuencia para filtrar (0-4)" placement="top">
                  <TextField
                    size="small"
                    placeholder="Valor"
                    type="number"
                    value={frecuenciaValor}
                    onChange={(e) => {
                      setFrecuenciaValor(e.target.value);
                      setPage(0);
                    }}
                    inputProps={{ min: 0, max: 4, step: 0.1 }}
                    sx={{ width: 100 }}
                    disabled={!frecuenciaOperador}
                  />
                </Tooltip>
                
                <Tooltip title="Filtrar problemas por puntuación de frecuencia promedio" placement="top">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Operador</InputLabel>
                    <Select
                      value={frecuenciaOperador}
                      onChange={(e) => {
                        setFrecuenciaOperador(e.target.value);
                        setPage(0);
                      }}
                      label="Operador"
                    >
                      <MenuItem value="">Sin filtro</MenuItem>
                      <MenuItem value=">=">&gt;=</MenuItem>
                      <MenuItem value="<=">&lt;=</MenuItem>
                      <MenuItem value=">">&gt;</MenuItem>
                      <MenuItem value="<">&lt;</MenuItem>
                      <MenuItem value="=">=</MenuItem>
                    </Select>
                  </FormControl>
                </Tooltip>
              </Box>
            </Box>

            {/* Filtros de Severidad */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Severidad:</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Valor de severidad para filtrar (0-4)" placement="top">
                  <TextField
                    size="small"
                    placeholder="Valor"
                    type="number"
                    value={severidadValor}
                    onChange={(e) => {
                      setSeveridadValor(e.target.value);
                      setPage(0);
                    }}
                    inputProps={{ min: 0, max: 4, step: 0.1 }}
                    sx={{ width: 100 }}
                    disabled={!severidadOperador}
                  />
                </Tooltip>
                
                <Tooltip title="Filtrar problemas por puntuación de severidad promedio" placement="top">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Operador</InputLabel>
                    <Select
                      value={severidadOperador}
                      onChange={(e) => {
                        setSeveridadOperador(e.target.value);
                        setPage(0);
                      }}
                      label="Operador"
                    >
                      <MenuItem value="">Sin filtro</MenuItem>
                      <MenuItem value=">=">&gt;=</MenuItem>
                      <MenuItem value="<=">&lt;=</MenuItem>
                      <MenuItem value=">">&gt;</MenuItem>
                      <MenuItem value="<">&lt;</MenuItem>
                      <MenuItem value="=">=</MenuItem>
                    </Select>
                  </FormControl>
                </Tooltip>
              </Box>
            </Box>

            {/* Filtros de Criticidad */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Criticidad:</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Valor de criticidad para filtrar (0-4)" placement="top">
                  <TextField
                    size="small"
                    placeholder="Valor"
                    type="number"
                    value={criticidadValor}
                    onChange={(e) => {
                      setCriticidadValor(e.target.value);
                      setPage(0);
                    }}
                    inputProps={{ min: 0, max: 4, step: 0.1 }}
                    sx={{ width: 100 }}
                    disabled={!criticidadOperador}
                  />
                </Tooltip>
                
                <Tooltip title="Filtrar problemas por puntuación de criticidad promedio" placement="top">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Operador</InputLabel>
                    <Select
                      value={criticidadOperador}
                      onChange={(e) => {
                        setCriticidadOperador(e.target.value);
                        setPage(0);
                      }}
                      label="Operador"
                    >
                      <MenuItem value="">Sin filtro</MenuItem>
                      <MenuItem value=">=">&gt;=</MenuItem>
                      <MenuItem value="<=">&lt;=</MenuItem>
                      <MenuItem value=">">&gt;</MenuItem>
                      <MenuItem value="<">&lt;</MenuItem>
                      <MenuItem value="=">=</MenuItem>
                    </Select>
                  </FormControl>
                </Tooltip>
              </Box>
            </Box>

            {/* Botón de reset filtros - como cuarta columna */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200, alignItems: 'center' }}>
              {/* Espaciador invisible para alinear con los títulos */}
              <Typography variant="body2" sx={{ fontWeight: 'bold', visibility: 'hidden' }}>
                Espaciador
              </Typography>
              {/* Botón alineado con los controles */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Restablecer todos los filtros" placement="top">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={handleResetFilters}
                    sx={{ 
                      textTransform: 'none',
                      borderColor: '#d1d5db',
                      color: '#6b7280',
                      '&:hover': {
                        borderColor: '#9ca3af',
                        backgroundColor: '#f9fafb'
                      }
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Tabla de problemas consolidados */}
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
              <TableCell sx={{ width: '25%' }}>Definición del problema</TableCell>
              <TableCell sx={{ width: '30%' }}>Descripcion</TableCell>
              <TableCell sx={{ width: '15%' }}>Heurística incumplida y ejemplo de concurrencia</TableCell>
              <TableCell sx={{ width: '5%' }}>Imagen</TableCell>
              <TableCell align="center" sx={{ width: '5%' }}>Promedio Frecuencia</TableCell>
              <TableCell align="center" sx={{ width: '5%' }}>Promedio Severidad</TableCell>
              <TableCell align="center" sx={{ width: '5%' }}>Promedio Criticidad</TableCell>
              <TableCell align="center" sx={{ width: '5%' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProblemas.length > 0 ? (
              paginatedProblemas.map((problema) => (
                <TableRow key={problema.id}>
                  <TableCell>{identificadorEvaluacion}-{problema.numeroProblema.toString().padStart(2, '0')}</TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {problema.nombreProblema}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {problema.descripcion}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {problema.heuristicaIncumplida}<br />
                    {problema.ejemploOcurrencia}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver imagen">
                      <IconButton 
                        size="small" 
                        disabled={!problema.imagen}
                        color="primary"
                        onClick={() => problema.imagen && handleImageClick(problema.imagen)}
                      >
                        <ImageIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={`Promedio de Frecuencia: ${(problema.promedioFrecuencia || 0).toFixed(2)}`}>
                      <Chip 
                        label={(problema.promedioFrecuencia || 0).toFixed(2)} 
                        size="small"
                        variant={problema.promedioFrecuencia > 0 ? 'filled' : 'outlined'}
                        sx={{ 
                          ...getChipColor(problema.promedioFrecuencia || 0),
                          fontWeight: 'bold',
                          minWidth: '50px'
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={`Promedio de Severidad: ${(problema.promedioSeveridad || 0).toFixed(2)}`}>
                      <Chip 
                        label={(problema.promedioSeveridad || 0).toFixed(2)} 
                        size="small"
                        variant={problema.promedioSeveridad > 0 ? 'filled' : 'outlined'}
                        sx={{ 
                          ...getChipColor(problema.promedioSeveridad || 0),
                          fontWeight: 'bold',
                          minWidth: '50px'
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={`Promedio de Criticidad: ${(problema.promedioCriticidad || 0).toFixed(2)}`}>
                      <Chip 
                        label={(problema.promedioCriticidad || 0).toFixed(2)} 
                        size="small"
                        variant={problema.promedioCriticidad > 0 ? 'filled' : 'outlined'}
                        sx={{ 
                          ...getChipColorCriticidad(problema.promedioCriticidad || 0),
                          fontWeight: 'bold',
                          minWidth: '50px'
                        }}
                      />
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
                <TableCell colSpan={9} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No se encontraron problemas consolidados con los filtros seleccionados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para mostrar imagen */}
      <Dialog 
        open={!!openImage} 
        onClose={() => setOpenImage(null)}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Vista previa de imagen</Typography>
          <IconButton
            aria-label="close"
            onClick={() => setOpenImage(null)}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {openImage && (
            <Box
              component="img"
              src={openImage}
              alt="Problema"
              sx={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
