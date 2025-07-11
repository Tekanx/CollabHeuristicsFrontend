'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  Link
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TableChartIcon from '@mui/icons-material/TableChart';
import InfoIcon from '@mui/icons-material/Info';
import { useParams, useRouter } from 'next/navigation';
import { problemaService } from '@/services/problemaService';
import { evaluacionService } from '@/services/evaluacionService';
import { ProblemaConPuntuaciones, HeuristicaResumen, PuntuacionEvaluador } from '@/components/interface/ResumenFinal';

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
  evaluacionId?: string;
}

function ResumenFinal({ evaluacionId }: ResumenFinalProps) {
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [loadingPuntuaciones, setLoadingPuntuaciones] = useState(false);
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para visualización
  const [vistaChart, setVistaChart] = useState(true); // true = Chart.js, false = Cards
  const [tipoChart, setTipoChart] = useState<'bar' | 'doughnut'>('bar');
  const [openFinalizarDialog, setOpenFinalizarDialog] = useState(false);
  
  // Referencias para Chart.js
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);
  
  const router = useRouter();
  const params = useParams();
  const evaluacionIdFinal = evaluacionId || (params?.id as string);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!evaluacionIdFinal) {
          console.error('No se proporcionó ID de evaluación');
          return;
        }

        // Cargar datos básicos de la evaluación
        const [evaluacionInfo, evaluadoresData] = await Promise.all([
          evaluacionService.getEvaluacion(Number(evaluacionIdFinal)),
          evaluacionService.getEvaluadoresByEvaluacion(Number(evaluacionIdFinal))
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

        // NUEVA ESTRATEGIA: Cargar TODOS los problemas primero, luego completar con puntuaciones
        console.log('🔄 Cargando TODOS los problemas de la evaluación...');
        const todosLosProblemas = await problemaService.getProblemasByEvaluacion(Number(evaluacionIdFinal));
        console.log('📊 Total de problemas en la evaluación:', todosLosProblemas.length);
        console.log('📊 Problemas cargados:', todosLosProblemas);

        // Crear estructura básica de todos los problemas
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
              probabilidad: 0, // Por defecto sin evaluar
              severidad: 0,    // Por defecto sin evaluar
              criticidad: 0,   // Por defecto sin evaluar
            }))
          });
        });

        console.log('🗺️ Estructura básica de problemas creada:', problemasByIdMap);

        // AHORA intentar cargar puntuaciones reales para complementar
        try {
          setLoadingPuntuaciones(true);
          console.log('🔍 Intentando cargar puntuaciones reales...');
          
          const problemasConPuntuacionesRaw = await problemaService.getProblemasConPuntuaciones(Number(evaluacionIdFinal));
          
          console.log('📊 ¡DATOS DE PUNTUACIONES RECIBIDOS!');
          console.log('📊 Número total de filas con puntuaciones:', problemasConPuntuacionesRaw.length);
          
          if (problemasConPuntuacionesRaw.length > 0) {
            console.log('🔄 Actualizando problemas con puntuaciones reales...');
            
            // Procesar puntuaciones y actualizar los problemas existentes
            problemasConPuntuacionesRaw.forEach((row: any[], index: number) => {
              console.log(`📋 Procesando fila de puntuación ${index + 1}:`, row);
              
              const [
                id_problema,          // 0
                numero_problema,      // 1  
                nombre_problema,      // 2
                descripcion,          // 3
                ejemplo_ocurrencia,   // 4  
                url_imagen,           // 5
                id_evaluador,         // 6
                evaluador_username,   // 7
                evaluador_nombre,     // 8
                evaluador_apellido,   // 9
                probabilidad,         // 10
                severidad,           // 11
                criticidad,          // 12
                nombre_principio     // 13
              ] = row;

              // Si el problema existe en nuestro mapa, actualizar sus puntuaciones
              if (problemasByIdMap.has(id_problema)) {
                const problema = problemasByIdMap.get(id_problema);
                const evaluadorInfo = evaluadoresOrdenados.find(e => e.id_evaluador === id_evaluador);
                
                if (evaluadorInfo) {
                  // Buscar y actualizar la puntuación del evaluador específico
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
                    
                    console.log(`✅ Actualizada puntuación para problema ${id_problema}, evaluador ${evaluadorInfo.numeroEvaluador}:`, {
                      probabilidad: probabilidad ?? 0,
                      severidad: severidad ?? 0,
                      criticidad: criticidad ?? 0
                    });
                  } else {
                    console.log(`⚠️ No se encontró puntuación para actualizar: problema ${id_problema}, evaluador ${evaluadorInfo.numeroEvaluador}`);
                  }
                }
              }
            });
            
            console.log('✅ Puntuaciones reales aplicadas a los problemas');
          }
          
          setLoadingPuntuaciones(false);
        } catch (puntuacionesError) {
          console.error('⚠️ Error al cargar puntuaciones, pero continuando con problemas básicos:', puntuacionesError);
          setLoadingPuntuaciones(false);
        }

        // Convertir el mapa a array final
        const problemasFinales = Array.from(problemasByIdMap.values());
        console.log('🎯 PROBLEMAS FINALES PARA ESTADO:', problemasFinales);
        console.log('📊 Total de problemas finales:', problemasFinales.length);
        
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
  }, [evaluacionIdFinal]);

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

  // Función para aplicar filtros de frecuencia y severidad
  const aplicarFiltroNumerico = (valor: number, operador: string, valorFiltro: string): boolean => {
    if (!operador || !valorFiltro) return true;
    
    const filtroNum = parseInt(valorFiltro);
    if (isNaN(filtroNum)) return true;
    
    // Solo aplicar filtro si el valor es mayor a -1 (ha sido evaluado)
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

  // Filtrar problemas con los nuevos filtros
  const filteredProblemas = problemas.filter(problema => {
    const matchesSearch = search === '' || 
      problema.id.toString().includes(search) ||
      problema.nombreProblema.toLowerCase().includes(search.toLowerCase()) ||
      problema.descripcion.toLowerCase().includes(search.toLowerCase());
    
    const matchesHeuristica = selectedHeuristica === '' || 
      problema.heuristicaIncumplida === `N${selectedHeuristica}`;
    
    // Aplicar filtros de frecuencia y severidad
    let matchesFrecuencia = true;
    let matchesSeveridad = true;
    
    if (frecuenciaOperador && frecuenciaValor) {
      // Verificar que al menos un evaluador que haya sido evaluado cumpla con el filtro de frecuencia
      matchesFrecuencia = problema.puntuaciones.some(puntuacion => 
        (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0) && aplicarFiltroNumerico(puntuacion.probabilidad, frecuenciaOperador, frecuenciaValor)
      );
    }
    
    if (severidadOperador && severidadValor) {
      // Verificar que al menos un evaluador que haya sido evaluado cumpla con el filtro de severidad
      matchesSeveridad = problema.puntuaciones.some(puntuacion => 
        (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0) && aplicarFiltroNumerico(puntuacion.severidad, severidadOperador, severidadValor)
      );
    }
    
    return matchesSearch && matchesHeuristica && matchesFrecuencia && matchesSeveridad;
  });

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

  // Manejadores de eventos
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewProblem = (problemId: number) => {
    sessionStorage.setItem('evaluacionId', evaluacionIdFinal!);
    router.push(`/evaluator/evaluacion/problema/${problemId}?returnTo=/evaluator/evaluacion/${evaluacionIdFinal}`);
  };

  const handleFinalizarEvaluacion = () => {
    setOpenFinalizarDialog(true);
  };

  const confirmFinalizarEvaluacion = () => {
    // Aquí implementarías la lógica para finalizar la evaluación
    console.log('Finalizando evaluación...');
    setOpenFinalizarDialog(false);
    
    // Redirigir al dashboard del evaluador
    router.push('/dashboard/evaluator');
  };
  // Función para obtener el color del chip según el valor
  const getChipColor = (valor: number): { color: string; bgcolor: string } => {
    if (valor === 0) return { color: '#666', bgcolor: '#f5f5f5' };
    if (valor <= 2) return { color: '#2e7d32', bgcolor: '#e8f5e8' };
    if (valor === 3) return { color: '#ef6c00', bgcolor: '#fff3e0' };
    return { color: '#d91e1e', bgcolor: '#ffebee' };
  };
  // Obtener columnas dinámicas para evaluadores con nueva numeración
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Resumen de la Evaluación - MOVIDO AL INICIO */}
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

      {/* Visualizaciones de Heurísticas - SEGUNDA POSICIÓN */}
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
                    onChange={(e) => setVistaChart(e.target.checked)}
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
          // Propuesta 1: Chart.js - ALTURA REDUCIDA A 300px (línea siguiente)
          <Box ref={chartContainerRef} sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
            {tipoChart === 'bar' ? (
              <Bar data={chartData} options={chartOptions} width={chartWidth} height={250} />
            ) : (
              <Doughnut data={chartData} options={chartOptions} width={chartWidth} height={250} />
            )}
          </Box>
        ) : (
          // Propuesta 2: Cards interactivas
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
                    onClick={() => setSelectedHeuristica(heuristica.id.toString())}
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

      {/* Controles superiores - CON NUEVOS FILTROS */}
      <Paper sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center', bgcolor: '#f5f7fa', p: 2, borderRadius: 2 }}>
        <Tooltip title="Búsqueda implementada como en Paso1EncontrarProblemas.tsx">
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
        </Tooltip>
        
        <Tooltip title="Filtro implementado como en Paso2Consolidar.tsx">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por principio</InputLabel>
            <Select
              value={selectedHeuristica}
              onChange={(e) => {
                setSelectedHeuristica(e.target.value);
                setPage(0);
              }}
              label="Filtrar por principio"
            >
              <MenuItem value="">Todos los principios</MenuItem>
              {HEURISTICAS_NIELSEN.map(h => (
                <MenuItem key={h.id} value={h.id}>N{h.id} - {h.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Tooltip>

        {/* NUEVOS FILTROS DE FRECUENCIA */}
        <Tooltip title="Filtrar problemas por puntuación de frecuencia (solo evalúa problemas que han sido evaluados)">
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Frecuencia</InputLabel>
            <Select
              value={frecuenciaOperador}
              onChange={(e) => {
                setFrecuenciaOperador(e.target.value);
                setPage(0);
              }}
              label="Frecuencia"
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

        <Tooltip title="Valor de frecuencia para filtrar (0-4)">
          <TextField
            size="small"
            placeholder="Valor"
            type="number"
            value={frecuenciaValor}
            onChange={(e) => {
              setFrecuenciaValor(e.target.value);
              setPage(0);
            }}
            inputProps={{ min: 0, max: 4 }}
            sx={{ width: 80 }}
            disabled={!frecuenciaOperador}
          />
        </Tooltip>

        {/* NUEVOS FILTROS DE SEVERIDAD */}
        <Tooltip title="Filtrar problemas por puntuación de severidad (solo evalúa problemas que han sido evaluados)">
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Severidad</InputLabel>
            <Select
              value={severidadOperador}
              onChange={(e) => {
                setSeveridadOperador(e.target.value);
                setPage(0);
              }}
              label="Severidad"
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

        <Tooltip title="Valor de severidad para filtrar (0-4)">
          <TextField
            size="small"
            placeholder="Valor"
            type="number"
            value={severidadValor}
            onChange={(e) => {
              setSeveridadValor(e.target.value);
              setPage(0);
            }}
            inputProps={{ min: 0, max: 4 }}
            sx={{ width: 80 }}
            disabled={!severidadOperador}
          />
        </Tooltip>
      </Paper>

      {/* Tabla de problemas con puntuaciones dinámicas */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
              Problemas con Puntuaciones por Evaluador
            </Typography>
            <Tooltip 
              title={
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Esta tabla muestra los problemas que han sido evaluados por al menos un evaluador.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Se adapta dinámicamente según el número de evaluadores (mínimo 2, máximo 5).
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Las puntuaciones se muestran con colores: Verde (0-2), Amarillo (3), Rojo (4).
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Se muestra "-" solo cuando ambas puntuaciones son 0 (sin evaluar). Si al menos una puntuación es diferente de 0, se muestran las puntuaciones reales.
                  </Typography>
                  <Typography variant="body2">
                    Evaluadores numerados como Ev.1, Ev.2, etc. ordenados de menor a mayor ID.
                  </Typography>
                </Box>
              }
              placement="top"
            >
              <InfoIcon color="action" sx={{ cursor: 'help' }} />
            </Tooltip>
          </Box>
        </Box>
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
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {/* Columnas fijas */}
                <TableCell width="10%">
                  <Tooltip title="ID clickeable para ver detalle del problema">
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
                
                {/* Columna de acciones */}
                <TableCell width="10%" align="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Acciones</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || loadingPuntuaciones ? (
                <TableRow>
                  <TableCell colSpan={2 + (evaluadores.length * 2) + 1} align="center">
                    <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={30} />
                      <Typography variant="body2" color="text.secondary">
                        {loadingPuntuaciones ? 'Cargando puntuaciones...' : 'Cargando datos...'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredProblemas.length > 0 ? (
                (() => {
                  console.log('🎯 RENDERIZANDO TABLA:');
                  console.log('📊 filteredProblemas.length:', filteredProblemas.length);
                  console.log('📊 problemas estado completo:', problemas);
                  console.log('📊 evaluadores disponibles:', evaluadores);
                  console.log('📊 página actual:', page);
                  console.log('📊 filas por página:', rowsPerPage);
                  
                  const problemasAMostrar = filteredProblemas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
                  console.log('📊 problemas a mostrar en esta página:', problemasAMostrar);
                  
                  return problemasAMostrar.map((problema) => {
                    console.log(`🔍 RENDERIZANDO PROBLEMA ID ${problema.id}:`, problema);
                    console.log(`🔍 Puntuaciones del problema:`, problema.puntuaciones);
                    
                    return (
                      <TableRow key={problema.id} hover>
                        <TableCell>
                          <Tooltip title="Hacer clic para ver el detalle del problema">
                            <Link
                              component="button"
                              variant="body2"
                              onClick={() => handleViewProblem(problema.id)}
                              sx={{ textDecoration: 'none', fontWeight: 'bold', '&:hover': { color: 'primary.main' } }}
                            >
                              {problema.identificador} - {problema.numeroProblema.toString().padStart(2, '0')}
                            </Link>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          <Tooltip title={problema.descripcion}>
                            <Typography variant="body2">{problema.nombreProblema}</Typography>
                          </Tooltip>
                        </TableCell>
                        
                        {/* Columnas dinámicas de puntuaciones - Ordenadas por número de evaluador */}
                        {evaluadores
                          .sort((a, b) => a.numeroEvaluador - b.numeroEvaluador)
                          .map(evaluador => {
                            const puntuacion = problema.puntuaciones.find(p => p.numero_evaluador === evaluador.numeroEvaluador);
                            
                            console.log(`👤 Evaluador ${evaluador.numeroEvaluador}:`, evaluador);
                            console.log(`📊 Puntuación encontrada:`, puntuacion);
                            
                            return (
                              <React.Fragment key={evaluador.numeroEvaluador}>
                                <TableCell align="center">
                                  <Tooltip title={`Frecuencia: ${puntuacion && (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0) ? puntuacion.probabilidad : 'Sin evaluar'} - ${puntuacion?.nombre_evaluador || 'Sin nombre'}`}>
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
                                  <Tooltip title={`Severidad: ${puntuacion && (puntuacion.probabilidad !== 0 || puntuacion.severidad !== 0) ? puntuacion.severidad : 'Sin evaluar'} - ${puntuacion?.nombre_evaluador || 'Sin nombre'}`}>
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
                        
                        <TableCell align="center">
                          <Tooltip title="Ver detalle completo del problema">
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => handleViewProblem(problema.id)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()
              ) : (
                <TableRow>
                  <TableCell colSpan={2 + (evaluadores.length * 2) + 1} align="center">
                    <Typography variant="body1" sx={{ py: 4 }}>
                      {problemas.length === 0 
                        ? 'No se encontraron problemas con puntuaciones en esta evaluación. Los problemas deben ser evaluados primero en el Paso 3.'
                        : 'No se encontraron problemas que coincidan con los criterios de búsqueda y filtros aplicados.'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Botón Finalizar - MOVIDO AL FINAL, ESTILO PASO2 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleFinalizarEvaluacion}
          startIcon={<AssessmentIcon />}
          sx={{ minWidth: 200 }}
        >
          Finalizar Evaluación
        </Button>
      </Box>

      {/* Diálogo de confirmación para finalizar evaluación */}
      <Dialog open={openFinalizarDialog} onClose={() => setOpenFinalizarDialog(false)}>
        <DialogTitle>¿Está seguro de que desea finalizar la evaluación?</DialogTitle>
        <DialogContent>
          <Typography>
            Al finalizar la evaluación, se generará el reporte final y no se podrán hacer más cambios.
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFinalizarDialog(false)}>Cancelar</Button>
          <Button onClick={confirmFinalizarEvaluacion} variant="contained" color="success">
            Finalizar Evaluación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ResumenFinal;