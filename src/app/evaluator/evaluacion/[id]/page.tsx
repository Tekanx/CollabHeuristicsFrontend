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
import { BarChart } from '@mui/x-charts';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import SettingsIcon from '@mui/icons-material/Settings';
import ImageIcon from '@mui/icons-material/Image';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import ParticipantsList from '@/components/ParticipantsList';
import Paso1EncontrarProblemas from '@/components/evaluacion/pasos/Paso1EncontrarProblemas';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Paso2Consolidar from '@/components/evaluacion/pasos/Paso2Consolidar';
import Paso3Resumen from '@/components/evaluacion/pasos/Paso3Resumen';

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

// Mock data for the problems table
interface Problem {
  id: string;
  name: string;
  heuristic: string;
  comments: string;
  image: string;
}

const mockProblems: Problem[] = Array.from({ length: 20 }, (_, i) => ({
  id: `HE-${String(i + 1).padStart(2, '0')}`,
  name: `Ejemplo de nombre del error que fue encontrado por el evaluador ${i + 1}`,
  heuristic: `Ejemplo de incumplido N${i + 1}`,
  comments: `Ejemplo de comentario largo del evaluador que explica el incumplimiento encontrado ${i + 1}`,
  image: '/map.png',
}));

interface BarData {
  heuristic: string;
  value: number;
  id: number;
  color: string;
}

// Nielsen's heuristics with default colors
const NIELSEN_HEURISTICS: Array<{ id: number; name: string; color: string }> = [
  { id: 1, name: 'Visibilidad del estado del sistema', color: '#1976d2' },
  { id: 2, name: 'Correspondencia entre el sistema y el mundo real', color: '#2e7d32' },
  { id: 3, name: 'Control y libertad del usuario', color: '#ed6c02' },
  { id: 4, name: 'Consistencia y estándares', color: '#9c27b0' },
  { id: 5, name: 'Prevención de errores', color: '#d32f2f' },
  { id: 6, name: 'Reconocimiento antes que recuerdo', color: '#0288d1' },
  { id: 7, name: 'Flexibilidad y eficiencia de uso', color: '#689f38' },
  { id: 8, name: 'Diseño estético y minimalista', color: '#455a64' },
  { id: 9, name: 'Ayuda a los usuarios a reconocer, diagnosticar y recuperarse de errores', color: '#c2185b' },
  { id: 10, name: 'Ayuda y documentación', color: '#5d4037' }
];

// Mock data for the bar chart
const mockBarData: BarData[] = [
  { id: 1, heuristic: 'Visibilidad del estado del sistema', value: 35, color: '#1976d2' },
  { id: 2, heuristic: 'Correspondencia entre el sistema y el mundo real', value: 25, color: '#2e7d32' },
  { id: 3, heuristic: 'Control y libertad del usuario', value: 20, color: '#ed6c02' },
  { id: 4, heuristic: 'Consistencia y estándares', value: 15, color: '#9c27b0' },
  { id: 5, heuristic: 'Prevención de errores', value: 5, color: '#d32f2f' },
  { id: 6, heuristic: 'Reconocimiento antes que recuerdo', value: 50, color: '#0288d1' },
  { id: 7, heuristic: 'Flexibilidad y eficiencia de uso', value: 60, color: '#689f38'},
  { id: 8, heuristic: 'Diseño estético y minimalista', value: 5, color: '#455a64' },
  { id: 9, heuristic: 'Ayuda a los usuarios a reconocer, diagnosticar y recuperarse de errores', value: 5, color: '#c2185b' },
  { id: 10, heuristic: 'Ayuda y documentación', value: 80, color: '#5d4037' }
];

// Mock data for participants with current step
const mockParticipants = [
  { id: 1, nombre: 'Juan', apellido: 'Pérez', avatar: '', currentStep: 1 },
  { id: 2, nombre: 'María', apellido: 'García', avatar: '', currentStep: 2 },
  { id: 3, nombre: 'Carlos', apellido: 'López', avatar: '', currentStep: 3 },
  { id: 4, nombre: 'Ana', apellido: 'Martínez', avatar: '', currentStep: 1 },
];

function CircularProgressWithLabel({ value }: { value: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" value={value} size={60} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, getDashboardPath } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(8);
  const [openSettings, setOpenSettings] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#1976d2');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);
  const [pasoActual, setPasoActual] = useState(1); // 1: Paso 1, 2: Paso 2, 3: Paso 3, 4: Resumen
  const [openConfirm, setOpenConfirm] = useState(false);

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

  const getStepName = (step: number) => {
    switch(step) {
      case 1: return 'Encontrar Problemas';
      case 2: return 'Consolidación';
      case 3: return 'Calcular métricas';
      case 4: return 'Resumen Final';
      default: return 'No iniciado';
    }
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
      link.download = 'evidence.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Finalizar paso 1
  const handleFinalizarPaso1 = () => setOpenConfirm(true);
  const handleConfirmFinalizar = () => {
    setPasoActual(2);
    setOpenConfirm(false);
  };
  const handleCancelFinalizar = () => setOpenConfirm(false);

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
              <Paper sx={{ paddingTop: 3, paddingLeft: 3, paddingRight: 3, paddingBottom: 0, mb: 3, height: 300, marginTop: 0, marginBottom: 2 }}>
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
                      <Box sx={{ textAlign: 'center' }}>
                        <CircularProgressWithLabel value={100} />
                        <Typography sx={{ mt: 1 }}>Paso 1</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <CircularProgressWithLabel value={80} />
                        <Typography sx={{ mt: 1 }}>Paso 2</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <CircularProgressWithLabel value={0} />
                        <Typography sx={{ mt: 1 }}>Paso 3</Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Chart Section */}
                  <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                        minWidth: '400px', // Minimum width
                        width: '100%',
                        overflow: 'auto' // In case the chart gets too small
                      }}
                    >
                      <BarChart
                        xAxis={[{
                          scaleType: 'band',
                          data: mockBarData.map(item => `PH${item.id}`),
                          label: 'Heurísticas',
                          labelStyle: { display: 'none' },
                          tickLabelStyle: {
                            fontSize: 12,
                            angle: 0
                          }
                        }]}
                        series={[{
                          type: 'bar',
                          data: mockBarData.map(item => item.value),
                          label: 'Cantidad de problemas',
                          color: selectedColor
                        }]}
                        height={180}
                        width={chartWidth}
                        margin={{ top: 20, right: 20, bottom: 30, left: 50 }}
                        slotProps={{
                          legend: {
                            hidden: true
                          }
                        }}
                      />
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
                        <TableCell width="25%">Nombre del problema encontrado</TableCell>
                        <TableCell width="20%">Heurística incumplida</TableCell>
                        <TableCell width="35%">Comentarios</TableCell>
                        <TableCell width="10%" align="center">Imagen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mockProblems
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((problem) => (
                          <TableRow key={problem.id}>
                            <TableCell>{problem.id}</TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {problem.name}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {problem.heuristic}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {problem.comments}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Ver imagen">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleImageClick(problem.image)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <ImageIcon />
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
                  count={mockProblems.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[8]}
                />
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Other tabs */}
        <TabPanel value={tabValue} index={1}>
          <Paso1EncontrarProblemas 
            mostrarFinalizarPaso1={pasoActual === 1}
            onFinalizarPaso1={handleFinalizarPaso1}
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
            <Paso2Consolidar mostrarFinalizarPaso2={pasoActual === 2} onFinalizarPaso2={() => setPasoActual(3)} />
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
            <Paso3Resumen mostrarFinalizarPaso3={pasoActual === 3} onFinalizarPaso3={() => setPasoActual(4)} />
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
            <Typography>Resumen Final (Coming soon)</Typography>
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
                  objectFit: 'contain'
                }}
              />
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