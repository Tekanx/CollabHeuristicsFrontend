'use client';

import { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Grid,
  Button,
} from '@mui/material';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import VistaGeneral from '@/components/dashboard/CoordinadorTabs/VistaGeneral';
import Participantes from '@/components/dashboard/CoordinadorTabs/Participantes';
import HeuristicasIncumplidas from '@/components/dashboard/CoordinadorTabs/HeuristicasIncumplidas';
import Consolidacion from '@/components/dashboard/CoordinadorTabs/Consolidacion';
import ResumenFinal from '@/components/dashboard/CoordinadorTabs/ResumenFinal';
import Configuracion from '@/components/dashboard/CoordinadorTabs/Configuracion';
import axios from '@/utils/axiosConfig';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
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
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function EvaluacionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, getDashboardPath } = useAuth();
  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');

  // Cargar datos de la evaluación
  useEffect(() => {
    const fetchEvaluacion = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/evaluaciones/${params.id}`);
        setEvaluacion(response.data);
        sessionStorage.setItem('identificadorEvaluacion', response.data.evaluacion_identificador);
      } catch (err: any) {
        console.error('Error al cargar la evaluación:', err);
        setError('No se pudo cargar la información de la evaluación.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluacion();
  }, [params.id]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Función para formatear fechas localmente sin problemas de zona horaria
  const formatDateLocal = (dateString: string) => {
    if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
      return 'N/A';
    }
    
    try {
      console.log('📅 [EvaluacionPage] Formateando fecha:', dateString);
      
      let date: Date;
      
      if (dateString.includes('T')) {
        // Es una fecha ISO con hora - extraer solo la parte de la fecha
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-');
        date = new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        // Es solo una fecha (YYYY-MM-DD), tratarla como local
        const [year, month, day] = dateString.split('-');
        date = new Date(Number(year), Number(month) - 1, Number(day));
      }
      
      const formattedDate = date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      });
      
      console.log('📅 [EvaluacionPage] Fecha original:', dateString, '-> Fecha formateada:', formattedDate);
      
      return formattedDate;
    } catch (error) {
      console.error('❌ [EvaluacionPage] Error al formatear fecha:', dateString, error);
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (error || !evaluacion) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="h6">
              {error || 'No se encontró la evaluación solicitada.'}
            </Typography>
          </Paper>
        </Container>
      </>
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
          <Typography color="text.primary">Evaluación {evaluacion.evaluacion_identificador}</Typography>
        </Breadcrumbs>

        {/* Encabezado */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">
              {evaluacion.nombre_evaluacion}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push(getDashboardPath())}
              sx={{ minWidth: 180 }}
            >
              Volver al Dashboard
            </Button>
          </Box>
          <Typography variant="body1" paragraph>
            {evaluacion.descripcion || 'Sin descripción'}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Identificador
              </Typography>
              <Typography variant="body1">
                {evaluacion.evaluacion_identificador}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha de inicio
              </Typography>
              <Typography variant="body1">
                {formatDateLocal(evaluacion.fecha_inicio)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Fecha de término
              </Typography>
              <Typography variant="body1">
                {evaluacion.fecha_termino ? formatDateLocal(evaluacion.fecha_termino) : 'No definida'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Pestañas */}
        <Paper sx={{ width: '100%' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="Pestañas de la evaluación"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ justifyContent: 'center' }}
          >
            <Tab label="Vista General" />
            <Tab label="Participantes" />
            <Tab label="Heurísticas incumplidas" />
            <Tab label="Consolidación" />
            <Tab label="Resumen Final" />
            <Tab label="Configuración" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <VistaGeneral evaluacion={evaluacion} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Participantes evaluacionId={evaluacion.id_evaluacion} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <HeuristicasIncumplidas evaluacionId={evaluacion.id_evaluacion} />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Consolidacion evaluacionId={evaluacion.id_evaluacion} />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <ResumenFinal evaluacionId={evaluacion.id_evaluacion} />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <Configuracion evaluacionId={evaluacion.id_evaluacion} />
          </TabPanel>
        </Paper>
      </Container>
    </>
  );
}