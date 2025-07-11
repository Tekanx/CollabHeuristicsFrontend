'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import { useRouter } from 'next/navigation';
import { problemaService } from '@/services/problemaService';
import { evaluacionService } from '@/services/evaluacionService';
import { ProblemaConPuntuaciones } from '@/components/interface/ResumenFinal';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface HeuristicaResumen {
  id: number;
  nombre: string;
  cantidadProblemas: number;
  color: string;
}

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

interface ResumenFinalProps {
  evaluacionId: number;
}

export default function ResumenFinal({ evaluacionId }: ResumenFinalProps) {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [problemas, setProblemas] = useState<ProblemaConPuntuaciones[]>([]);
  const [evaluadores, setEvaluadores] = useState<any[]>([]);
  const [heuristicas, setHeuristicas] = useState<HeuristicaResumen[]>([]);
  const [evaluacionData, setEvaluacionData] = useState<any>(null);
  
  // Estados para filtros y búsqueda
  const [search, setSearch] = useState('');
  const [selectedHeuristica, setSelectedHeuristica] = useState<string>('');
  const [frecuenciaOperador, setFrecuenciaOperador] = useState<string>('');
  const [frecuenciaValor, setFrecuenciaValor] = useState<string>('');
  const [severidadOperador, setSeveridadOperador] = useState<string>('');
  const [severidadValor, setSeveridadValor] = useState<string>('');
  const [criticidadOperador, setCriticidadOperador] = useState<string>('');
  const [criticidadValor, setCriticidadValor] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para panel de acciones
  const [showFilter, setShowFilter] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Estados para el panel de ranking
  const [ordenamiento, setOrdenamiento] = useState<'asc' | 'desc'>('desc');
  const [cantidadProblemas, setCantidadProblemas] = useState<number>(10);
  const [tipoRanking, setTipoRanking] = useState<'frecuencia' | 'severidad' | 'criticidad' | null>(null);
  
  // Estados para diálogo de confirmación
  const [openFinalizarDialog, setOpenFinalizarDialog] = useState(false);
  
  // Estados para visualización de gráficos
  const [vistaChart, setVistaChart] = useState(true); // true = Chart.js, false = Cards
  const [tipoChart, setTipoChart] = useState<'bar' | 'doughnut'>('bar');
  
  // Referencias para Chart.js
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);
  
  const router = useRouter();

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar datos básicos de la evaluación
        const [evaluacionInfo, evaluadoresData] = await Promise.all([
          evaluacionService.getEvaluacion(evaluacionId),
          evaluacionService.getEvaluadoresByEvaluacion(evaluacionId)
        ]);

        setEvaluacionData(evaluacionInfo);
        
        // Ordenar evaluadores por ID y agregar numeración
        const evaluadoresOrdenados = evaluadoresData
          .sort((a: any, b: any) => a.id_evaluador - b.id_evaluador)
          .map((evaluador: any, index: number) => ({
            ...evaluador,
            numeroEvaluador: index + 1
          }));
        
        setEvaluadores(evaluadoresOrdenados);

        // Cargar problemas con puntuaciones
        console.log('🔄 Cargando problemas de la evaluación...');
        const todosLosProblemas = await problemaService.getProblemasByEvaluacion(evaluacionId);
        
        // Crear estructura básica de problemas
        const problemasByIdMap = new Map<number, any>();
        
        todosLosProblemas.forEach((problema: any) => {
          const heuristicaIncumplida = problema.fk_heuristica_incumplida ? `N${problema.fk_heuristica_incumplida}` : 'No definida';
          
          problemasByIdMap.set(problema.id_problema, {
            id: problema.id_problema,
            numeroProblema: problema.numero_problema,
            identificador: evaluacionInfo.evaluacion_identificador,
            nombreProblema: problema.nombre_problema || 'Sin nombre',
            descripcion: problema.descripcion_problema || 'Sin descripción',
            heuristicaIncumplida: heuristicaIncumplida,
            ejemploOcurrencia: problema.ejemplo_ocurrencia || 'Sin ejemplo',
            imagen: problema.url_imagen || '',
            puntuaciones: evaluadoresOrdenados.map((evaluador: any) => ({
              id_evaluador: evaluador.id_evaluador,
              numero_evaluador: evaluador.numeroEvaluador,
              nombre_evaluador: `${evaluador.nombre} ${evaluador.apellido}`,
              probabilidad: 0,
              severidad: 0,
              criticidad: 0
            })),
            // Calcular promedios
            promedioFrecuencia: 0,
            promedioSeveridad: 0,
            promedioCriticidad: 0
          });
        });

        // Intentar cargar puntuaciones reales
        try {
          const problemasConPuntuacionesRaw = await problemaService.getProblemasConPuntuaciones(evaluacionId);
          
          if (problemasConPuntuacionesRaw.length > 0) {
            problemasConPuntuacionesRaw.forEach((row: any[]) => {
              const [
                id_problema, numero_problema, nombre_problema, descripcion,
                ejemplo_ocurrencia, url_imagen, id_evaluador, evaluador_username,
                evaluador_nombre, evaluador_apellido, probabilidad, severidad,
                criticidad, nombre_principio
              ] = row;

              if (problemasByIdMap.has(id_problema)) {
                const problema = problemasByIdMap.get(id_problema);
                const evaluadorInfo = evaluadoresOrdenados.find(e => e.id_evaluador === id_evaluador);
                
                if (evaluadorInfo) {
                  const puntuacionIndex = problema.puntuaciones.findIndex(
                    (p: any) => p.numero_evaluador === evaluadorInfo.numeroEvaluador
                  );
                  
                  if (puntuacionIndex !== -1) {
                    problema.puntuaciones[puntuacionIndex] = {
                      id_evaluador: id_evaluador,
                      numero_evaluador: evaluadorInfo.numeroEvaluador,
                      nombre_evaluador: `${evaluador_nombre || evaluador_username} ${evaluador_apellido || ''}`.trim(),
                      probabilidad: probabilidad ?? 0,
                      severidad: severidad ?? 0,
                      criticidad: criticidad ?? 0
                    };
                  }
                }
              }
            });
          }
        } catch (puntuacionesError) {
          console.error('⚠️ Error al cargar puntuaciones:', puntuacionesError);
        }

        // Calcular promedios para cada problema
        const problemasFinales = Array.from(problemasByIdMap.values()).map(problema => {
          const puntuacionesValidas = problema.puntuaciones.filter((p: any) => p.probabilidad !== 0 || p.severidad !== 0);
          
          if (puntuacionesValidas.length > 0) {
            problema.promedioFrecuencia = puntuacionesValidas.reduce((sum: number, p: any) => sum + p.probabilidad, 0) / puntuacionesValidas.length;
            problema.promedioSeveridad = puntuacionesValidas.reduce((sum: number, p: any) => sum + p.severidad, 0) / puntuacionesValidas.length;
            problema.promedioCriticidad = puntuacionesValidas.reduce((sum: number, p: any) => sum + p.criticidad, 0) / puntuacionesValidas.length;
          }
          
          return problema;
        });
        
        setProblemas(problemasFinales);

        // Calcular estadísticas de heurísticas basadas en TODOS los problemas
        const heuristicasStats = HEURISTICAS_NIELSEN.map((heuristica, index) => {
          const problemasDeHeuristica = problemasFinales.filter(p => 
            p.heuristicaIncumplida === `N${heuristica.id}`
          );
          console.log(`📊 Heurística N${heuristica.id}: ${problemasDeHeuristica.length} problemas`);
          return {
            id: heuristica.id,
            nombre: heuristica.nombre,
            cantidadProblemas: problemasDeHeuristica.length,
            color: `hsl(${(index * 360) / HEURISTICAS_NIELSEN.length}, 70%, 50%)`
          };
        });

        console.log('📈 Estadísticas de heurísticas calculadas:', heuristicasStats);
        setHeuristicas(heuristicasStats);

      } catch (error) {
        console.error('Error al cargar datos del resumen:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [evaluacionId]);

  // Actualizar ancho del gráfico
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.offsetWidth;
        setChartWidth(Math.max(400, containerWidth - 40));
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    window.addEventListener('resize', updateWidth);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Función para aplicar filtros numéricos
  const aplicarFiltroNumerico = (valor: number, operador: string, valorFiltro: string): boolean => {
    if (!operador || !valorFiltro) return true;
    
    const filtroNum = parseFloat(valorFiltro);
    if (isNaN(filtroNum)) return true;
    
    if (valor < 0) return false;
    
    switch (operador) {
      case '>=': return valor >= filtroNum;
      case '<=': return valor <= filtroNum;
      case '>': return valor > filtroNum;
      case '<': return valor < filtroNum;
      case '=': return valor === filtroNum;
      default: return true;
    }
  };

  // Filtrar problemas
  const filteredProblemas = problemas.filter(problema => {
    const matchesSearch = search === '' || 
      problema.id.toString().includes(search) ||
      problema.nombreProblema.toLowerCase().includes(search.toLowerCase()) ||
      problema.descripcion.toLowerCase().includes(search.toLowerCase());
    
    const matchesHeuristica = selectedHeuristica === '' || 
      problema.heuristicaIncumplida === `N${selectedHeuristica}`;
    
    let matchesFrecuencia = true;
    let matchesSeveridad = true;
    let matchesCriticidad = true;
    
    if (frecuenciaOperador && frecuenciaValor) {
      matchesFrecuencia = aplicarFiltroNumerico(problema.promedioFrecuencia, frecuenciaOperador, frecuenciaValor);
    }
    
    if (severidadOperador && severidadValor) {
      matchesSeveridad = aplicarFiltroNumerico(problema.promedioSeveridad, severidadOperador, severidadValor);
    }
    
    if (criticidadOperador && criticidadValor) {
      matchesCriticidad = aplicarFiltroNumerico(problema.promedioCriticidad, criticidadOperador, criticidadValor);
    }
    
    return matchesSearch && matchesHeuristica && matchesFrecuencia && matchesSeveridad && matchesCriticidad;
  });

  // Aplicar ranking (solo cambia el estado)
  const aplicarRanking = (tipo: 'frecuencia' | 'severidad' | 'criticidad') => {
    setTipoRanking(tipo);
    setPage(0); // Reset pagination when applying ranking
  };

  // Restablecer visualización de tabla
  const restablecerVisualizacion = () => {
    setTipoRanking(null);
    setPage(0);
  };

  // Generar lista ordenada (función pura, no modifica estado)
  const generateRankedList = (tipo: 'frecuencia' | 'severidad' | 'criticidad', problemas: ProblemaConPuntuaciones[]) => {
    let problemasOrdenados = [...problemas];
    
    problemasOrdenados.sort((a, b) => {
      let valorA = 0;
      let valorB = 0;
      
      switch (tipo) {
        case 'frecuencia':
          valorA = a.promedioFrecuencia;
          valorB = b.promedioFrecuencia;
          break;
        case 'severidad':
          valorA = a.promedioSeveridad;
          valorB = b.promedioSeveridad;
          break;
        case 'criticidad':
          valorA = a.promedioCriticidad;
          valorB = b.promedioCriticidad;
          break;
      }
      
      return ordenamiento === 'desc' ? valorB - valorA : valorA - valorB;
    });
    
    // Limitar a la cantidad especificada
    return problemasOrdenados.slice(0, cantidadProblemas);
  };

  // Obtener problemas a mostrar según el ranking activo
  const getProblemasToShow = () => {
    if (tipoRanking) {
      return generateRankedList(tipoRanking, filteredProblemas);
    }
    return filteredProblemas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  };

  // Manejadores de eventos
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
    setTipoRanking(null); // Reset ranking when searching
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewProblem = (problemId: number) => {
    router.push(`/coordinator/evaluacion/problema/${problemId}`);
  };

  const handleFinalizarEvaluacion = async () => {
    try {
      console.log('Finalizando evaluación...');
      await evaluacionService.finalizarEvaluacion(evaluacionId);
      
      // Recargar datos de la evaluación para reflejar los cambios
      const evaluacionActualizada = await evaluacionService.getEvaluacion(evaluacionId);
      setEvaluacionData(evaluacionActualizada);
      
      setOpenFinalizarDialog(false);
      console.log('✅ Evaluación finalizada exitosamente');
    } catch (error) {
      console.error('❌ Error al finalizar evaluación:', error);
      // Aquí podrías agregar una notificación de error para el usuario
    }
  };

  // Obtener columnas dinámicas para evaluadores (copiado de Resumen.tsx)
  const getEvaluadorColumns = (): { key: string; label: string; width: string }[] => {
    const columns: { key: string; label: string; width: string }[] = [];
    evaluadores.forEach(evaluador => {
      columns.push({
        key: `freq_${evaluador.numeroEvaluador}`,
        label: `Ev.${evaluador.numeroEvaluador} - Frec.`,
        width: `${Math.max(80, 100 / evaluadores.length)}px`
      });
      columns.push({
        key: `sev_${evaluador.numeroEvaluador}`,
        label: `Ev.${evaluador.numeroEvaluador} - Sev.`,
        width: `${Math.max(80, 100 / evaluadores.length)}px`
      });
    });
    return columns;
  };
{  /*
  const getChipColor = (valor: number) => {
    if (valor === 0) return 'default';
    if (valor >= 4) return 'error';
    if (valor >= 3) return 'warning';
    return 'success';
  };
  */
}
    // Función para obtener el color del chip según el valor
    const getChipColor = (valor: number): { color: string; bgcolor: string } => {
      if (valor === 0) return { color: '#666', bgcolor: '#f5f5f5' };
      if (valor <= 2) return { color: '#2e7d32', bgcolor: '#e8f5e8' };
      if (valor === 3) return { color: '#ef6c00', bgcolor: '#fff3e0' };
      return { color: '#d91e1e', bgcolor: '#ffebee' };
    };
    // Función para obtener el color del chip según el valor
    const getChipColorPromedios = (valor: number): { color: string; bgcolor: string } => {
      if (valor === 0) return { color: '#666', bgcolor: '#f5f5f5' };
      if (valor <= 2) return { color: '#2e7d32', bgcolor: '#e8f5e8' };
      if (valor <= 3) return { color: '#ef6c00', bgcolor: '#fff3e0' };
      return { color: '#d91e1e', bgcolor: '#ffebee' };
    };

    const getChipColorCriticidad = (valor: number): { color: string; bgcolor: string } => {
      if (valor === 0) return { color: '#666', bgcolor: '#f5f5f5' };
      if (valor <= 3) return { color: '#2e7d32', bgcolor: '#e8f5e8' };
      if (valor <= 5) return { color: '#ef6c00', bgcolor: '#fff3e0' };
      if (valor <= 7) return { color: '#d32f2f', bgcolor: '#ffebee' };
      return { color: '#d91e1e', bgcolor: '#ffebee' };
    };

  // Datos para Chart.js
  const chartData = {
    labels: heuristicas.map(h => h.nombre.length > 30 ? h.nombre.substring(0, 30) + '...' : h.nombre),
    datasets: [
      {
        label: 'Cantidad de problemas',
        data: heuristicas.map(h => h.cantidadProblemas),
        backgroundColor: heuristicas.map(h => h.color),
        borderColor: heuristicas.map(h => h.color),
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: tipoChart === 'doughnut',
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            return heuristicas[index]?.nombre || '';
          }
        }
      },
    },
    scales: tipoChart === 'bar' ? {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    } : undefined
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Resumen de la Evaluación */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resumen de la Evaluación
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Total de problemas encontrados:</strong> {problemas.length}
              </Typography>
            </Alert>
          </Grid>
          <Grid item xs={12} md={6}>
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Total de evaluadores:</strong> {evaluadores.length}
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Paper>

      {/* Visualizaciones de Heurísticas */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Problemas por Heurística
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Cambia entre vista gráfica (Chart.js) y vista de cards interactivas" placement="top">
              <FormControlLabel
                control={
                  <Switch
                    checked={vistaChart}
                    onChange={(e) => {
                      setVistaChart(e.target.checked);
                      setSelectedHeuristica(''); // Reset filtro al cambiar vista
                    }}
                  />
                }
                label={vistaChart ? "Vista Gráfica" : "Vista Cards"}
              />
            </Tooltip>
            {vistaChart && (
              <Tooltip title="Selecciona el tipo de gráfico para visualizar los datos" placement="top">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Tipo de gráfico</InputLabel>
                  <Select
                    value={tipoChart}
                    onChange={(e) => setTipoChart(e.target.value as 'bar' | 'doughnut')}
                    label="Tipo de gráfico"
                  >
                    <MenuItem value="bar">Barras</MenuItem>
                    <MenuItem value="doughnut">Dona</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            )}
          </Box>
        </Box>

        {vistaChart ? (
          // Vista Chart.js
          <Box ref={chartContainerRef} sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
            {tipoChart === 'bar' ? (
              <Bar data={chartData} options={chartOptions} width={chartWidth} height={250} />
            ) : (
              <Doughnut data={chartData} options={chartOptions} width={chartWidth} height={250} />
            )}
          </Box>
        ) : (
          // Vista Cards interactivas
          <Grid container spacing={2}>
            {heuristicas.map((heuristica) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={heuristica.id}>
                <Tooltip title={`Filtrar por ${heuristica.nombre}`}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'scale(1.02)' },
                      border: selectedHeuristica === heuristica.id.toString() ? '2px solid #1976d2' : '1px solid #e0e0e0'
                    }}
                    onClick={() => {
                      if (selectedHeuristica === heuristica.id.toString()) {
                        setSelectedHeuristica(''); // Deseleccionar si ya está seleccionado
                      } else {
                        setSelectedHeuristica(heuristica.id.toString());
                      }
                      setPage(0); // Reset pagination
                      setTipoRanking(null); // Reset ranking
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box 
                          sx={{ 
                            width: 20, 
                            height: 20, 
                            backgroundColor: heuristica.color, 
                            borderRadius: '50%', 
                            mr: 1 
                          }} 
                        />
                        <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
                          N{heuristica.id}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 40 }}>
                        {heuristica.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip 
                          label={`${heuristica.cantidadProblemas} problemas`}
                          color={heuristica.cantidadProblemas > 0 ? "primary" : "default"}
                          size="small"
                        />
                        <AssessmentIcon color="action" />
                      </Box>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Controles de búsqueda y acciones */}
      <Paper sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2, 
        mb: 3, 
        alignItems: 'center', 
        bgcolor: '#f5f7fa', 
        p: 2, 
        borderRadius: 2 
      }}>
        <TextField
          size="small"
          placeholder="Buscar por ID o Nombre del Problema"
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250, flexGrow: 1 }}
        />
        
        <Tooltip title="Mostrar panel de acciones">
          <IconButton onClick={() => setShowActions(!showActions)}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Mostrar filtros adicionales">
          <IconButton onClick={() => setShowFilter(!showFilter)}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Restablecer visualización de tabla">
          <IconButton onClick={restablecerVisualizacion} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Panel de Acciones REESTRUCTURADO */}
      {showActions && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
          <Grid container spacing={3}>
            {/* Columna de botones de ranking */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Acciones
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="info"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    onClick={() => aplicarRanking('frecuencia')}
                    sx={{ maxWidth: 200 }}
                  >
                    Ranking de Frecuencia
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="info"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    onClick={() => aplicarRanking('severidad')}
                    sx={{ maxWidth: 200 }}
                  >
                    Ranking de Severidad
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="info"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    onClick={() => aplicarRanking('criticidad')}
                    sx={{ maxWidth: 200 }}
                  >
                    Ranking de Criticidad
                  </Button>
                </Grid>
              </Grid>
              
              {/* Botón Declarar Evaluación Terminada - Solo mostrar si no tiene fecha de término */}
              {!evaluacionData?.fecha_termino && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setOpenFinalizarDialog(true)}
                  sx={{ mt: 3, py: 1.5, fontSize: '1rem' }}
                >
                  Declarar evaluación terminada
                </Button>
              )}
            </Grid>
            
            {/* Columna de configuración de ranking */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Configuración de Ranking
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Ordenamiento</InputLabel>
                <Select
                  value={ordenamiento}
                  onChange={(e) => setOrdenamiento(e.target.value as 'asc' | 'desc')}
                  label="Ordenamiento"
                >
                  <MenuItem value="desc">Descendente</MenuItem>
                  <MenuItem value="asc">Ascendente</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                size="small"
                label="Cantidad de problemas"
                type="number"
                value={cantidadProblemas}
                onChange={(e) => setCantidadProblemas(parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
          </Grid>
          
          {tipoRanking && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Mostrando ranking de <strong>{tipoRanking}</strong> con n° de problemas <strong>{cantidadProblemas}</strong> en orden <strong>{ordenamiento === 'desc' ? 'descendente' : 'ascendente'}</strong>
              </Typography>
            </Alert>
          )}
        </Paper>
      )}

      {/* Panel de Filtros */}
      {showFilter && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
          <Typography variant="h6" gutterBottom>
            Filtros Avanzados
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Principio incumplido</InputLabel>
                <Select
                  value={selectedHeuristica}
                  onChange={(e) => {
                    setSelectedHeuristica(e.target.value);
                    setPage(0);
                    setTipoRanking(null);
                  }}
                  label="Principio incumplido"
                >
                  <MenuItem value="">Todos los principios</MenuItem>
                  {HEURISTICAS_NIELSEN.map(h => (
                    <MenuItem key={h.id} value={h.id}>N{h.id} - {h.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Filtros de Frecuencia */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Valor"
                  type="number"
                  value={frecuenciaValor}
                  onChange={(e) => {
                    setFrecuenciaValor(e.target.value);
                    setPage(0);
                    setTipoRanking(null);
                  }}
                  inputProps={{ min: 0, max: 5, step: 0.1 }}
                  sx={{ width: 80 }}
                  disabled={!frecuenciaOperador}
                />
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>Frec.</InputLabel>
                  <Select
                    value={frecuenciaOperador}
                    onChange={(e) => {
                      setFrecuenciaOperador(e.target.value);
                      setPage(0);
                      setTipoRanking(null);
                    }}
                    label="Frec."
                  >
                    <MenuItem value="">-</MenuItem>
                    <MenuItem value=">=">&gt;=</MenuItem>
                    <MenuItem value="<=">&lt;=</MenuItem>
                    <MenuItem value=">">&gt;</MenuItem>
                    <MenuItem value="<">&lt;</MenuItem>
                    <MenuItem value="=">=</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            
            {/* Filtros de Severidad */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Valor"
                  type="number"
                  value={severidadValor}
                  onChange={(e) => {
                    setSeveridadValor(e.target.value);
                    setPage(0);
                    setTipoRanking(null);
                  }}
                  inputProps={{ min: 0, max: 5, step: 0.1 }}
                  sx={{ width: 80 }}
                  disabled={!severidadOperador}
                />
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>Sev.</InputLabel>
                  <Select
                    value={severidadOperador}
                    onChange={(e) => {
                      setSeveridadOperador(e.target.value);
                      setPage(0);
                      setTipoRanking(null);
                    }}
                    label="Sev."
                  >
                    <MenuItem value="">-</MenuItem>
                    <MenuItem value=">=">&gt;=</MenuItem>
                    <MenuItem value="<=">&lt;=</MenuItem>
                    <MenuItem value=">">&gt;</MenuItem>
                    <MenuItem value="<">&lt;</MenuItem>
                    <MenuItem value="=">=</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            
            {/* Filtros de Criticidad */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Valor"
                  type="number"
                  value={criticidadValor}
                  onChange={(e) => {
                    setCriticidadValor(e.target.value);
                    setPage(0);
                    setTipoRanking(null);
                  }}
                  inputProps={{ min: 0, max: 5, step: 0.1 }}
                  sx={{ width: 80 }}
                  disabled={!criticidadOperador}
                />
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <InputLabel>Crit.</InputLabel>
                  <Select
                    value={criticidadOperador}
                    onChange={(e) => {
                      setCriticidadOperador(e.target.value);
                      setPage(0);
                      setTipoRanking(null);
                    }}
                    label="Crit."
                  >
                    <MenuItem value="">-</MenuItem>
                    <MenuItem value=">=">&gt;=</MenuItem>
                    <MenuItem value="<=">&lt;=</MenuItem>
                    <MenuItem value=">">&gt;</MenuItem>
                    <MenuItem value="<">&lt;</MenuItem>
                    <MenuItem value="=">=</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabla de problemas CON PUNTUACIONES INDIVIDUALES */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
              {tipoRanking ? `Ranking de ${tipoRanking}` : 'Problemas con Puntuaciones por Evaluador'}
            </Typography>
            <Tooltip 
              title={
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Esta tabla muestra los problemas con puntuaciones individuales por evaluador y promedios calculados.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Las puntuaciones se muestran con colores: Gris (0), Verde (1-2), Amarillo (3), Rojo (4-5).
                  </Typography>
                  <Typography variant="body2">
                    Los valores con "-" indican que el evaluador aún no ha puntuado ese problema.
                  </Typography>
                </Box>
              }
              placement="top"
            >
              <InfoIcon color="info" sx={{ cursor: 'help' }} />
            </Tooltip>
          </Box>
        </Box>
        {/* Paginación superior - solo mostrar cuando no hay ranking activo */}
        {!tipoRanking && (
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
        )}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {/* Columnas fijas */}
                <TableCell width="10%">
                  <Tooltip title="ID del problema">
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>ID</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell width="20%">
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Nombre del Problema</Typography>
                </TableCell>
                
                {/* Columnas dinámicas de evaluadores */}
                {getEvaluadorColumns().map((col) => (
                  <TableCell key={col.key} align="center" width={col.width}>
                    <Tooltip title={`Puntuaciones del evaluador ${col.label.split(' ')[0]}`}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {col.label}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                ))}
                
                {/* Columnas de promedios */}
                <TableCell width="8%" align="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Prom. Frec.</Typography>
                </TableCell>
                <TableCell width="8%" align="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Prom. Sev.</Typography>
                </TableCell>
                <TableCell width="8%" align="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Prom. Crit.</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getProblemasToShow().length > 0 ? (
                getProblemasToShow().map((problema, index) => (
                  <TableRow key={problema.id} hover>
                    <TableCell>
                      {tipoRanking && (
                        <Chip 
                          label={`#${index + 1}`} 
                          size="small" 
                          color="primary" 
                          sx={{ mr: 1 }} 
                        />
                      )}
                      <Tooltip title="Hacer clic para ver el detalle del problema">
                        <Link
                          component="button"
                          variant="body2"
                          onClick={() => handleViewProblem(problema.id)}
                          sx={{ 
                            textDecoration: 'none', 
                            fontWeight: 'bold', 
                            '&:hover': { color: 'primary.main' },
                            cursor: 'pointer'
                          }}
                        >
                          {problema.identificador} - {problema.numeroProblema.toString().padStart(2, '0')}
                        </Link>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      <Tooltip title={problema.descripcion} placement="top">
                        <Typography variant="body2">{problema.nombreProblema}</Typography>
                      </Tooltip>
                    </TableCell>
                    
                    {/* Columnas dinámicas de puntuaciones individuales por evaluador */}
                    {evaluadores
                      .sort((a, b) => a.numeroEvaluador - b.numeroEvaluador)
                      .map(evaluador => {
                        const puntuacion = problema.puntuaciones.find(p => p.numero_evaluador === evaluador.numeroEvaluador);
                        
                        return (
                          <React.Fragment key={evaluador.numeroEvaluador}>
                            <TableCell align="center">
                              <Tooltip title={`Frecuencia: ${puntuacion && (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0) ? puntuacion.probabilidad : 'Sin evaluar'} - ${puntuacion?.nombre_evaluador || evaluador.nombre}`}>
                                <Chip 
                                  label={
                                    puntuacion && (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0)
                                      ? puntuacion.probabilidad 
                                      : '-'
                                  } 
                                  size="small"
                                  sx={{
                                    ...getChipColor(puntuacion?.probabilidad ?? 0),
                                    fontWeight: 'bold',
                                    minWidth: '30px'
                                  }}
                                  variant={puntuacion && (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0) ? 'filled' : 'outlined'}
                                />
                              </Tooltip>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title={`Severidad: ${puntuacion && (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0) ? puntuacion.severidad : 'Sin evaluar'} - ${puntuacion?.nombre_evaluador || evaluador.nombre}`}>
                                <Chip 
                                  label={
                                    puntuacion && (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0)
                                      ? puntuacion.severidad 
                                      : '-'
                                  } 
                                  size="small"
                                  sx={{
                                    ...getChipColor(puntuacion?.severidad ?? 0),
                                    fontWeight: 'bold',
                                    minWidth: '30px'
                                  }}
                                  variant={puntuacion && (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0) ? 'filled' : 'outlined'}
                                />
                              </Tooltip>
                            </TableCell>
                          </React.Fragment>
                        );
                      })}
                    
                    {/* Columnas de promedios */}
                    <TableCell align="center">
                      <Chip 
                        label={problema.promedioFrecuencia.toFixed(2)} 
                        size="small"
                        sx={{
                          ...getChipColorPromedios(problema.promedioFrecuencia),
                          fontWeight: 'bold',
                          minWidth: '40px'
                        }}
                        variant={problema.promedioFrecuencia > 0 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={problema.promedioSeveridad.toFixed(2)} 
                        size="small"
                        sx={{
                          ...getChipColorPromedios(problema.promedioSeveridad),
                          fontWeight: 'bold',
                          minWidth: '40px'
                        }}
                        variant={problema.promedioSeveridad > 0 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={problema.promedioCriticidad.toFixed(2)} 
                        size="small"
                        sx={{
                          ...getChipColorCriticidad(problema.promedioCriticidad),
                          fontWeight: 'bold',
                          minWidth: '40px'
                        }}
                        variant={problema.promedioCriticidad > 0 ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2 + (evaluadores.length * 2) + 3} align="center">
                    <Typography variant="body1" sx={{ py: 4 }}>
                      No se encontraron problemas que coincidan con los criterios aplicados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo de confirmación para finalizar evaluación */}
      <Dialog open={openFinalizarDialog} onClose={() => setOpenFinalizarDialog(false)}>
        <DialogTitle>¿Está seguro de que desea declarar la evaluación como terminada?</DialogTitle>
        <DialogContent>
          <Typography>
            Al declarar la evaluación como terminada, se generará el reporte final y no se podrán hacer más cambios.
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFinalizarDialog(false)}>Cancelar</Button>
          <Button onClick={handleFinalizarEvaluacion} variant="contained" color="error">
            Declarar Terminada
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
