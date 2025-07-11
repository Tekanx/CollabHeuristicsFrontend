'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Grid,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel, 
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import SettingsIcon from '@mui/icons-material/Settings';
import ImageIcon from '@mui/icons-material/Image';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import ParticipantsList from '@/components/ParticipantsList';
import Paso1EncontrarProblemas from '@/components/evaluacion/pasos/Paso1EncontrarProblemas';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckIcon from '@mui/icons-material/Check';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import Paso2Consolidar from '@/components/evaluacion/pasos/Paso2Consolidar';
import Paso3Calcular from '@/components/evaluacion/pasos/Paso3Calcular';
import { heuristicService } from '@/services/heuristicaService';
import { Heuristica } from '@/components/interface/Heuristica';
import { PrincipioHeuristica } from '@/components/interface/PrincipioHeuristica';
import { problemaService } from '@/services/problemaService';
import axios from '@/utils/axiosConfig';
import { Problema } from '@/components/interface/Problema';
import { evaluacionService } from '@/services/evaluacionService';
import ResumenFinal from '@/components/evaluacion/pasos/Resumen';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { evaluadorService } from '@/services/evaluadorService';
import { Evaluador } from '@/components/interface/Evaluador';
import { formatImagePath, handleImageError } from '@/utils/imageUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`evaluation-tabpanel-${index}`}
      aria-labelledby={`evaluation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface BarData {
  heuristic: string;
  name: string;
  value: number;
  id: number;
  color: string;
}

// Registrar los componentes de Chart.js que necesitamos
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

export default function EvaluationPage() {
  // Todos los hooks juntos, al inicio
  const [barData, setBarData] = useState<BarData[]>([]);
  const [heuristicas, setHeuristicas] = useState<Heuristica[]>([]);
  const [principios, setPrincipios] = useState<PrincipioHeuristica[]>([]);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problema[]>([]);
  const [evaluacionId, setEvaluacionId] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(true);

  const params = useParams();
  const router = useRouter();
  const { user, getDashboardPath } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [openSettings, setOpenSettings] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#1976d2');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);
  const [pasoActual, setPasoActual] = useState(1); // Inicialmente 1, paso inicial
  const [openConfirm, setOpenConfirm] = useState(false);
  const [evaluadorAutenticado, setEvaluadorAutenticado] = useState<Evaluador | null>(null);


  // Cargar pasoActual desde API
  useEffect(() => {
    const fetchEvaluadorAutenticado = async () => {
      try {
        const evaluador = await evaluadorService.getEvaluadorAutenticado();
        setEvaluadorAutenticado(evaluador);
      } catch (error) {
        console.error('Error al obtener el evaluador autenticado:', error);
      }
    };

    fetchEvaluadorAutenticado();
  }, []);

  // Separar useEffect para cargar el progreso cuando tenemos el evaluador
  useEffect(() => {
    console.log('🔍 useEffect fetchPasoActual ejecutándose');
    console.log('📊 params.id:', params.id);
    console.log('👤 user:', user);
    console.log('🆔 evaluadorAutenticado?.id_evaluador:', evaluadorAutenticado?.id_evaluador);
    
    const fetchPasoActual = async () => {
      console.log('🚀 Entrando a fetchPasoActual');
      if (params.id && evaluadorAutenticado?.id_evaluador) {
        console.log('✅ Condiciones cumplidas, procediendo con la consulta API');
        console.log('🔗 URL que se va a llamar: /evaluadores/evaluaciones/' + Number(params.id) + '/evaluador/' + evaluadorAutenticado.id_evaluador + '/progreso');
        console.log('📋 Parámetros: evaluacionId=' + Number(params.id) + ', evaluadorId=' + evaluadorAutenticado.id_evaluador);
        try {
          setLoadingProgress(true);
          // Obtener el progreso del evaluador desde la API
          const progreso = await evaluacionService.getProgresoEvaluador(Number(params.id), evaluadorAutenticado.id_evaluador);
          console.log('Progreso del evaluador obtenido:', progreso);
          console.log('Tipo de progreso:', typeof progreso);
          
          // Si el progreso es null, establecer pasoActual en 1 (paso inicial)
          if (progreso === null) {
            setPasoActual(1);
            console.log('Progreso era null, estableciendo pasoActual en 1');
          } else {
            setPasoActual(progreso);
            console.log('Estableciendo pasoActual en:', progreso);
          }
        } catch (error) {
          console.error('Error al cargar el progreso del evaluador:', error);
          // En caso de error, establecer pasoActual en 1
          setPasoActual(1);
        } finally {
          setLoadingProgress(false);
        }
      } else {
        console.log('❌ Condiciones no cumplidas');
        console.log('params.id existe:', !!params.id);
        console.log('evaluador?.id_evaluador existe:', !!evaluadorAutenticado?.id_evaluador);
        setLoadingProgress(false);
      }
    };

    fetchPasoActual();
  }, [params.id, evaluadorAutenticado?.id_evaluador]);

  // Actualizar el pasoActual al finalizar cada paso
  const actualizarPasoActual = async (nuevoPaso: number) => {
    console.log('🔄 [PageMain] actualizarPasoActual called with nuevoPaso:', nuevoPaso);
    try {
      if (evaluadorAutenticado?.id_evaluador) {
        console.log('🔄 [PageMain] Actualizando paso actual...');
        console.log('📋 [PageMain] Parámetros para actualizar:');
        console.log('  - evaluadorId:', evaluadorAutenticado.id_evaluador);
        console.log('  - evaluacionId:', Number(params.id));
        console.log('  - nuevoPaso:', nuevoPaso);
        console.log('🔗 [PageMain] URL que se va a llamar: /evaluadores/evaluaciones/' + Number(params.id) + '/evaluador/' + evaluadorAutenticado.id_evaluador + '/progreso');
        
        const resultado = await evaluacionService.setProgresoEvaluador(Number(params.id), evaluadorAutenticado.id_evaluador, nuevoPaso);
        console.log('✅ [PageMain] Respuesta de la API:', resultado);
        
        // Actualizar el estado local inmediatamente
        console.log('🔄 [PageMain] Actualizando estado local pasoActual de', pasoActual, 'a', nuevoPaso);
        setPasoActual(nuevoPaso);
        console.log('✅ [PageMain] Estado local actualizado exitosamente');
        
        // Opcional: Verificar que el cambio se guardó correctamente en la base de datos
        setTimeout(async () => {
          try {
            console.log('🔍 [PageMain] Verificando el progreso actualizado en la BD...');
            const progresoVerificacion = await evaluacionService.getProgresoEvaluador(Number(params.id), evaluadorAutenticado.id_evaluador);
            console.log('✅ [PageMain] Progreso verificado en BD:', progresoVerificacion);
            
            if (progresoVerificacion !== nuevoPaso) {
              console.warn('⚠️ [PageMain] ADVERTENCIA: El progreso en BD no coincide con el esperado');
              console.warn('  - Esperado:', nuevoPaso);
              console.warn('  - En BD:', progresoVerificacion);
              
              // Forzar actualización del estado si hay discrepancia
              setPasoActual(progresoVerificacion || nuevoPaso);
            }
          } catch (verificacionError) {
            console.error('❌ [PageMain] Error al verificar progreso:', verificacionError);
          }
        }, 1000);
        
      } else {
        console.log('❌ [PageMain] No se puede actualizar: evaluadorAutenticado es null');
        console.log('  - evaluadorAutenticado:', evaluadorAutenticado);
      }
    } catch (error) {
      console.error('❌ [PageMain] Error al actualizar el progreso del evaluador:', error);
      console.error('❌ [PageMain] Error completo:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      
      // Mostrar mensaje de error al usuario
      alert('Error al actualizar el progreso. Por favor, recargue la página.');
    }
  };

  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.offsetWidth;
        setChartWidth(Math.max(400, containerWidth - 40)); // 400px minimum width, 40px for padding
      }
    };

    // Initial width
    updateWidth();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(updateWidth);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    // Add window resize listener for good measure
    window.addEventListener('resize', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleSettingsOpen = () => setOpenSettings(true);
  const handleSettingsClose = () => setOpenSettings(false);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
  };

  const handleCloseImage = () => setSelectedImage(null);

  const handleImageClick = (imagePath: string) => {
    setSelectedImage(formatImagePath(imagePath));
  };

  const handleDownloadImage = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage;
      // Use a more descriptive filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `evidence-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Finalizar paso 1
  const handleFinalizarPaso1 = () => setOpenConfirm(true);
  const handleConfirmFinalizar = async () => {
    await actualizarPasoActual(2);
    setOpenConfirm(false);
  };
  const handleCancelFinalizar = () => setOpenConfirm(false);

  // Add useEffect to fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (params.id) {
          const evaluacionData = await evaluacionService.getEvaluacion(Number(params.id));
          setEvaluacionId(evaluacionData.evaluacion_identificador);

          // Fetch all heuristicas
          const heuristicasData = await heuristicService.getAllHeuristicas();
          setHeuristicas(heuristicasData);

          // Initialize bar data with all heuristicas
          const initialBarData = heuristicasData.map((h, index) => ({
            id: h.id_heuristica,
            name: h.nombre,
            heuristic: h.nombre,
            value: 0,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`
          }));
          setBarData(initialBarData);

          // Fetch principios for each heuristica
          const principiosPromises = heuristicasData.map(h => 
            heuristicService.getPrincipiosHeuristicos(h.id_heuristica)
          );
          const principiosResults = await Promise.all(principiosPromises);
          setPrincipios(principiosResults.flat());

          // Cargar problemas para la tabla
          const response = await problemaService.getProblemasByEvaluacion(Number(params.id));
          const problemasData = response as any[];
          
          console.log('Estructura detallada de los problemas:', {
            cantidadProblemas: problemasData.length,
            primerProblema: problemasData[0],
            todosLosProblemas: problemasData
          });

          // Mapear los datos al formato correcto
          const problemasFormateados = problemasData.map(problema => ({
            identificador: evaluacionData.evaluacion_identificador,
            id: problema.id_problema,
            numeroProblema: problema.numero_problema,
            nombreProblema: problema.nombre_problema || 'Sin nombre',
            descripcion: problema.descripcion_problema || 'Sin descripción',
            heuristicaIncumplida: problema.fk_heuristica_incumplida ? `N${problema.fk_heuristica_incumplida}` : 'Nundefined',
            ejemploOcurrencia: problema.ejemplo_ocurrencia || 'No especificado',
            imagen: problema.url_imagen || '',
            autor: problema.autor || '',
            id_evaluacion: problema.fk_evaluacion,
            id_evaluador: problema.fk_evaluador
          }));

          console.log('Problemas formateados:', problemasFormateados);
          setProblems(problemasFormateados);

          // Fetch problem counts for each principle
          const problemCounts = await problemaService.getCantidadPrincipiosPorProblema(Number(params.id)) as unknown as any[][];
          console.log('API problemCounts:', problemCounts);

          // Transform the problem counts into a more usable format
          // Each item in problemCounts is [numero_principio, nombre_principio, cantidad]
          const countsByPrincipio: Record<number, { nombre: string, cantidad: number }> = {};
          problemCounts.forEach(item => {
            if (Array.isArray(item) && item.length >= 3) {
              const [numero, nombre, cantidad] = item;
              countsByPrincipio[numero] = {
                nombre: String(nombre),
                cantidad: Number(cantidad)
              };
            }
          });
          
          console.log('countsByPrincipio:', countsByPrincipio);

          // Create bar data using the problem counts
          const updatedBarData = Object.entries(countsByPrincipio).map(([numero, data]) => ({
            id: Number(numero),
            name: data.nombre,
            heuristic: `Principio ${numero}`,
            value: Number(data.cantidad),
            color: selectedColor
          }));

          console.log('updatedBarData para el gráfico:', updatedBarData);
          setBarData(updatedBarData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  function StepStatusIndicator({ step, currentStep }: { step: number; currentStep: number }) {
    const getStepStatus = () => {
      if (step < currentStep) return 'completed';
      if (step === currentStep) return 'in-progress';
      return 'not-started';
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'completed': return 'Finalizado';
        case 'in-progress': return 'En curso';
        case 'not-started': return 'No iniciado';
        default: return 'No iniciado';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return '#4caf50';
        case 'in-progress': return '#2196f3';
        case 'not-started': return '#9e9e9e';
        default: return '#9e9e9e';
      }
    };

    const status = getStepStatus();
    
    return (
      <Box sx={{ 
        textAlign: 'center',
        p: 1,
        borderRadius: 1,
        bgcolor: status === 'completed' ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: status === 'completed' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
          border: `2px solid ${getStatusColor(status)}`,
          mb: 1
        }}>
          {status === 'completed' ? (
            <CheckIcon sx={{ fontSize: 30, color: getStatusColor(status) }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ fontSize: 30, color: getStatusColor(status) }} />
          )}
        </Box>
        <Typography sx={{ mt: 1, fontWeight: status === 'completed' ? 'bold' : 'normal' }}>
          Paso {step}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {getStatusText(status)}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              router.push(getDashboardPath());
            }}
          >
            Dashboard
          </Link>
          <Typography color="text.primary">EV {params.id}</Typography>
        </Breadcrumbs>

        {/* Tabs */}
        <Paper sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="evaluation tabs"
          >
            <Tab label="Vista General" />
            <Tab label="Paso 1: Encontrar Problemas" />
            <Tab label="Paso 2: Consolidación" />
            <Tab label="Paso 3: Calcular métricas" />
            <Tab label="Resumen Final" />
          </Tabs>
        </Paper>

        {/* Vista General Tab Content */}
        <TabPanel value={tabValue} index={0}>
          {/* First Row: Progress and Chart */}
          <Grid container spacing={0}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, paddingTop: 3, paddingLeft: 3, paddingRight: 3, mb: 3, height: 270, marginTop: 0, bgcolor: '#f5f7fa', borderRadius: 2 }}>
                <Grid container spacing={1}>
                  {/* Progress Section */}
                  <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom>
                      Progreso personal
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-around', 
                      alignItems: 'center',
                      flex: 1
                    }}>
                      {loadingProgress ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                          <CircularProgress size={30} />
                        </Box>
                      ) : (
                        <>
                          <StepStatusIndicator step={1} currentStep={pasoActual} />
                          <StepStatusIndicator step={2} currentStep={pasoActual} />
                          <StepStatusIndicator step={3} currentStep={pasoActual} />
                        </>
                      )}
                    </Box>
                  </Grid>

                  {/* Chart Section */}
                  <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Typography variant="h6">
                        Problemas encontrados por heurística
                      </Typography>
                      <IconButton onClick={handleSettingsOpen} color="primary">
                        <SettingsIcon />
                      </IconButton>
                    </Box>
                    <Box 
                      ref={chartContainerRef}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        flex: 1,
                        minWidth: '300px',
                        width: '100%',
                        overflow: 'auto'
                      }}
                    >
                      {loading ? (
                        <CircularProgress />
                      ) : (
                        <Bar
                          data={{
                            labels: barData.map(item => item.name),
                            datasets: [
                              {
                                label: 'Cantidad de problemas',
                                data: barData.map(item => item.value),
                                backgroundColor: selectedColor,
                                barThickness: 30,
                                borderRadius: 4,
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                titleFont: {
                                  size: 13,
                                },
                                bodyFont: {
                                  size: 12,
                                },
                                padding: 10,
                                cornerRadius: 4,
                              },
                            },
                            scales: {
                              x: {
                                grid: {
                                  display: false
                                },
                                ticks: {
                                  font: {
                                    size: 12
                                  }
                                }
                              },
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: 'rgba(0,0,0,0.05)'
                                },
                                ticks: {
                                  precision: 0,
                                  font: {
                                    size: 12
                                  }
                                }
                              }
                            }
                          }}
                          height={180}
                          width={chartWidth}
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* Second Row: Problems Table */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Problemas encontrados
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="10%">ID</TableCell>
                        <TableCell width="25%">Nombre del problema</TableCell>
                        <TableCell width="35%">Descripción</TableCell>
                        <TableCell width="10%">Heurística incumplida</TableCell>
                        <TableCell width="10%">Ejemplo de ocurrencia</TableCell>
                        <TableCell width="10%" align="center">Imagen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <CircularProgress />
                          </TableCell>
                        </TableRow>
                      ) : problems && problems.length > 0 ? (
                        problems
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((problem) => (
                          <TableRow key={problem.id}>
                              <TableCell>{problem.identificador} - {problem.numeroProblema}</TableCell>
                              <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {problem.nombreProblema}
                              </TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {problem.descripcion || 'Sin descripción'}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {problem.heuristicaIncumplida || 'No especificada'}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {problem.ejemploOcurrencia || 'No especificado'}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title={problem.imagen ? "Ver imagen" : "Sin imagen"}>
                                <span> {/* Wrapper para poder aplicar Tooltip a un componente disabled */}
                                  <IconButton 
                                    size="small" 
                                    onClick={() => problem.imagen && handleImageClick(problem.imagen)}
                                    sx={{ 
                                      color: problem.imagen ? 'primary.main' : 'text.disabled',
                                      cursor: problem.imagen ? 'pointer' : 'not-allowed'
                                    }}
                                    disabled={!problem.imagen}
                                  >
                                    <ImageIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography>No se encontraron problemas para esta evaluación.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {problems && problems.length > 0 && (
                <TablePagination
                  component="div"
                    count={problems.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5]}
                />
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Other tabs */}
        <TabPanel value={tabValue} index={1}>
          <Paso1EncontrarProblemas 
            mostrarFinalizarPaso1={pasoActual === 1}
            onFinalizarPaso1={handleFinalizarPaso1}
            evaluacionId={params.id as string}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {pasoActual < 2 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
                ¡Todavía no has terminado el "Paso 1: Encontrar incumplimientos" o hay evaluadores que todavía no han terminado!<br />
                Revisa y comunicate con ellos para poder seguir avanzando
              </Typography>
              <WarningAmberIcon sx={{ fontSize: 120, color: '#fbc02d', mt: 2 }} />
            </Box>
          ) : (
            <Paso2Consolidar 
              mostrarFinalizarPaso2={pasoActual === 2}
              onFinalizarPaso2={() => actualizarPasoActual(3)} 
              evaluacionId={params.id as string}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {pasoActual < 3 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
              ¡Todavía no has terminado el "Paso 2: Consolidación" o hay evaluadores que todavía no han terminado!<br />
              Revisa y comunicate con ellos para poder seguir avanzando
              </Typography>
              <WarningAmberIcon sx={{ fontSize: 120, color: '#fbc02d', mt: 2 }} />
            </Box>
          ) : (
            <Paso3Calcular 
              mostrarFinalizarPaso3={pasoActual === 3} 
              onFinalizarPaso3={() => actualizarPasoActual(4)} 
              evaluacionId={params.id as string}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          {pasoActual < 4 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
                ¡Todavía no has terminado el "Paso 3: Calcular métricas" o hay evaluadores que todavía no han terminado!<br />
                Revisa y comunicate con ellos para poder seguir avanzando
              </Typography>
              <WarningAmberIcon sx={{ fontSize: 120, color: '#fbc02d', mt: 2 }} />
            </Box>
          ) : (
            <ResumenFinal />
          )}
        </TabPanel>

        {/* Settings Dialog */}
        <Dialog open={openSettings} onClose={handleSettingsClose} maxWidth="sm" fullWidth>
          <DialogTitle>Configuración de colores</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Color de las barras</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  style={{ width: '50px', height: '30px' }}
                />
                <Typography variant="body2" color="text.secondary">
                  {selectedColor}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSettingsClose}>Cerrar</Button>
          </DialogActions>
        </Dialog>

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
              <IconButton onClick={handleDownloadImage} sx={{ mr: 1 }} title="Descargar imagen">
                <DownloadIcon />
              </IconButton>
              <IconButton 
                onClick={() => selectedImage && window.open(selectedImage, '_blank')}
                sx={{ mr: 1 }} 
                title="Abrir en nueva pestaña"
              >
                <OpenInNewIcon />
              </IconButton>
              <IconButton onClick={handleCloseImage} title="Cerrar">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedImage && (
              <>
                <Box
                  component="div"
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: 'auto',
                    minHeight: '300px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={selectedImage}
                    alt="Problem evidence"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      console.error('Error loading image:', selectedImage);
                      
                      // Intentar con otras extensiones comunes
                      const extensions = ['.jpg', '.jpeg', '.png'];
                      handleImageError(e, extensions);
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                  Ruta original: {selectedImage.startsWith('/') ? selectedImage.substring(1) : selectedImage}
                </Typography>
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="error">
                    Si la imagen no carga, intente abrirla en una nueva pestaña con el botón superior derecho.
                  </Typography>
                </Box>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para finalizar paso 1 */}
        <Dialog open={openConfirm} onClose={handleCancelFinalizar}>
          <DialogTitle>¿Está seguro de que quiere terminar la fase 1?</DialogTitle>
          <DialogActions>
            <Button onClick={handleCancelFinalizar}>Cancelar</Button>
            <Button onClick={handleConfirmFinalizar} variant="contained" color="primary">Finalizar</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
} 