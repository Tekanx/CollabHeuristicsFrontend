'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from '@/utils/axiosConfig';
import SettingsIcon from '@mui/icons-material/Settings';
import { problemaService } from '@/services/problemaService';
import { heuristicService } from '@/services/heuristicaService';
import { evaluadorService } from '@/services/evaluadorService';
import { evaluacionService } from '@/services/evaluacionService';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Evaluacion {
  id_evaluacion: number;
  nombre_evaluacion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  evaluacion_identificador: string;
}

interface Participante {
  id_evaluador: number;
  nombre: string;
  apellido: string;
  progreso: number;
  errores_encontrados: number;
}

interface Evaluador {
  id_evaluador: number;
  nombre: string;
  apellido: string;
  correo: string;
  nombre_usuario: string;
  numero?: string;
  genero?: number;
  paso_actual?: number;
  cantidadProblemas?: number;
}

interface BarData {
  id: number;
  name: string;
  heuristic: string;
  value: number;
  color: string;
}

interface VistaGeneralProps {
  evaluacion: Evaluacion;
}

export default function VistaGeneral({ evaluacion }: VistaGeneralProps) {
  const [loading, setLoading] = useState(true);
  const [loadingHeuristicas, setLoadingHeuristicas] = useState(true);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [progresoData, setProgresoData] = useState<any>({
    labels: ['Paso 1', 'Paso 2', 'Paso 3'],
    datasets: [
      {
        label: 'Completado (%)',
        data: [0, 0, 0],
        backgroundColor: ['#4CAF50', '#2196F3', '#F44336'],
      },
    ],
  });
  
  const [barData, setBarData] = useState<BarData[]>([]);
  const [selectedColor, setSelectedColor] = useState('#2196F3');
  const [openSettings, setOpenSettings] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);

  // Efecto para ajustar el ancho del gráfico según el contenedor
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

  // Handlers para el diálogo de configuración
  const handleSettingsOpen = () => setOpenSettings(true);
  const handleSettingsClose = () => setOpenSettings(false);
  const handleColorChange = (color: string) => setSelectedColor(color);

  // Cargar datos de problemas por heurística
  useEffect(() => {
    const fetchHeuristicasData = async () => {
      try {
        setLoadingHeuristicas(true);
        
        // Obtener todas las heurísticas
        const heuristicasData = await heuristicService.getAllHeuristicas();
        
        // Inicializar datos de barras con todas las heurísticas
        const initialBarData = heuristicasData.map((h, index) => ({
          id: h.id_heuristica,
          name: h.nombre,
          heuristic: h.nombre,
          value: 0,
          color: selectedColor
        }));
        
        // Obtener conteo de problemas por principio
        const problemCounts = await problemaService.getCantidadPrincipiosPorProblema(evaluacion.id_evaluacion) as unknown as any[][];
        console.log('API problemCounts:', problemCounts);
        
        // Transformar los conteos en un formato utilizable
        // Cada elemento en problemCounts es [numero_principio, nombre_principio, cantidad]
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
        
        // Crear datos para el gráfico usando los conteos de problemas
        if (Object.keys(countsByPrincipio).length > 0) {
          const updatedBarData = Object.entries(countsByPrincipio).map(([numero, data]) => ({
            id: Number(numero),
            name: data.nombre,
            heuristic: `Principio ${numero}`,
            value: Number(data.cantidad),
            color: selectedColor
          }));
          
          console.log('updatedBarData para el gráfico:', updatedBarData);
          setBarData(updatedBarData);
        } else {
          // Si no hay datos, usar los datos iniciales
          setBarData(initialBarData);
        }
      } catch (error) {
        console.error('Error al cargar datos de heurísticas:', error);
        // En caso de error, mantener un conjunto de datos predeterminado
        setBarData([
          { id: 1, name: 'Visibilidad', heuristic: 'N1', value: 10, color: selectedColor },
          { id: 2, name: 'Relación sistema/mundo real', heuristic: 'N2', value: 8, color: selectedColor },
          { id: 3, name: 'Control y libertad', heuristic: 'N3', value: 6, color: selectedColor },
          { id: 4, name: 'Consistencia y estándares', heuristic: 'N4', value: 15, color: selectedColor },
          { id: 5, name: 'Prevención de errores', heuristic: 'N5', value: 12, color: selectedColor },
          { id: 6, name: 'Reconocimiento', heuristic: 'N6', value: 7, color: selectedColor },
          { id: 7, name: 'Flexibilidad', heuristic: 'N7', value: 5, color: selectedColor },
          { id: 8, name: 'Estética', heuristic: 'N8', value: 9, color: selectedColor },
          { id: 9, name: 'Manejo de errores', heuristic: 'N9', value: 11, color: selectedColor },
          { id: 10, name: 'Ayuda y documentación', heuristic: 'N10', value: 4, color: selectedColor },
        ]);
      } finally {
        setLoadingHeuristicas(false);
      }
    };

    if (evaluacion.id_evaluacion) {
      fetchHeuristicasData();
    }
  }, [evaluacion.id_evaluacion, selectedColor]);

  // Cargar datos generales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener participantes de la evaluación
        const participantesResponse = await axios.get(`/evaluaciones/${evaluacion.id_evaluacion}/evaluadores`);
        
        // Obtener datos reales para cada participante
        const participantesPromises = participantesResponse.data.map(async (p: any) => {
          try {
            // Obtener la cantidad real de problemas encontrados por este evaluador
            const cantidadProblemas = await evaluadorService.getCantidadProblemasDeEvaluacion(
              p.id_evaluador, 
              evaluacion.id_evaluacion
            );
            
            // Obtener progreso real del evaluador usando el servicio
            let progreso = 1; // Valor por defecto
            try {
              const progresoReal = await evaluacionService.getProgresoEvaluador(evaluacion.id_evaluacion, p.id_evaluador);
              progreso = progresoReal || 1; // Si es null, usar 1
              console.log(`👤 Evaluador ${p.nombre}: progreso real = ${progresoReal}`);
            } catch (progresoError) {
              console.warn(`⚠️ No se pudo obtener progreso para evaluador ${p.id_evaluador}:`, progresoError);
              progreso = 1; // Fallback
            }
            
            return {
              ...p,
              progreso,
              errores_encontrados: cantidadProblemas // Usar dato real de la API
            };
          } catch (error) {
            console.error(`Error al obtener datos para el evaluador ${p.id_evaluador}:`, error);
            // En caso de error, usar un valor por defecto
            return {
              ...p,
              progreso: 1,
              errores_encontrados: 0
            };
          }
        });
        
        const participantesConDatos = await Promise.all(participantesPromises);
        console.log('Participantes con datos reales:', participantesConDatos);
        setParticipantes(participantesConDatos);
        
      } catch (error) {
        console.error('Error al cargar datos de vista general:', error);
      } finally {
        setLoading(false);
      }
    };

    if (evaluacion.id_evaluacion) {
      fetchData();
    }
  }, [evaluacion.id_evaluacion]);

  if (loading || loadingHeuristicas) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Gráficos */}
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
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
              height={200} 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                width: '100%',
                overflow: 'auto' 
              }}
            >
              {loadingHeuristicas ? (
                <CircularProgress />
              ) : (
                <Bar 
                  data={{
                    labels: barData.map(item => item.name),
                    datasets: [
                      {
                        label: 'Problemas encontrados',
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
                  height={280}
                  width={chartWidth}
                />
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Participantes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Participantes de la evaluación
            </Typography>
            
            <Grid container spacing={3}>
              {participantes.map((participante) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={participante.id_evaluador}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        mb: 1,
                        bgcolor: participante.progreso === 1 ? '#4CAF50' : 
                                participante.progreso === 2 ? '#2196F3' : '#F44336'
                      }}
                    >
                      {participante.nombre.charAt(0)}{participante.apellido.charAt(0)}
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {participante.nombre} {participante.apellido}
                    </Typography>
                    <Chip 
                      label={!participante.progreso ? 'No iniciado' : 
                             (participante.progreso || 0) === 4 ? 'Evaluación completada' : 
                             (participante.progreso || 0) === 3 ? 'Paso 3: En progreso' : 
                             (participante.progreso || 0) === 2 ? 'Paso 2: En progreso' : 
                             (participante.progreso || 0) === 1 ? 'Paso 1: En progreso' : 
                             'Paso 1: En progreso'} 
                      color={(participante.progreso || 0) === 4 ? "success" :
                             (participante.progreso || 0) === 3 ? "success" : 
                             (participante.progreso || 0) === 2 ? "primary" : 
                             (participante.progreso || 0) === 1 ? "warning" : 
                             "default"}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
                      {participante.errores_encontrados} {participante.errores_encontrados === 1 ? 'problema encontrado' : 'problemas encontrados'}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
              
              {participantes.length === 0 && (
                <Grid item xs={12}>
                  <Typography align="center" color="text.secondary">
                    No hay participantes en esta evaluación
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para configurar color */}
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
    </Box>
  );
} 