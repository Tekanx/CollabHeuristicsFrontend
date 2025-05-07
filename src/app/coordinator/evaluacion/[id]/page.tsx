'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, Paper, Tabs, Tab, Breadcrumbs, Link, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import DetallesEvaluacion from '@/components/evaluacion/DetallesEvaluacion';
import TablaProblemas from '@/components/evaluacion/TablaProblemas';
import GraficoHeuristicas from '@/components/evaluacion/GraficoHeuristicas';
import ProgresoEvaluacion from '@/components/evaluacion/ProgresoEvaluacion';
import axios from '@/utils/axiosConfig';

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

// Mock data for testing
const mockProblemas = [
  {
    id: "HE-01",
    nombre: "Botón de navegación poco visible",
    heuristica: "Visibilidad del estado del sistema",
    comentarios: "El botón de retorno no es suficientemente visible para los usuarios",
    imagen: "/mock-image.png"
  },
  // Add more mock problems as needed
];

const mockHeuristicas = [
  { id: 1, nombre: "Visibilidad del estado del sistema", valor: 5, color: "#1976d2" },
  { id: 2, nombre: "Coincidencia entre el sistema y el mundo real", valor: 3, color: "#2e7d32" },
  // Add more mock heuristics as needed
];

const mockPasos = [
  { paso: 1, nombre: "Encontrar Problemas", progreso: 100 },
  { paso: 2, nombre: "Consolidación", progreso: 60 },
  { paso: 3, nombre: "Calcular métricas", progreso: 0 },
];

export default function CoordinatorEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const { getDashboardPath } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvaluacion = async () => {
      try {
        const response = await axios.get(`/evaluaciones/${params.id}`);
        setEvaluacion(response.data);
      } catch (err) {
        console.error('Error fetching evaluation:', err);
        setError('Error al cargar la evaluación');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEvaluacion();
    }
  }, [params.id]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  if (error || !evaluacion) {
    return (
      <Container>
        <Typography color="error">{error || 'No se encontró la evaluación'}</Typography>
      </Container>
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
          <Typography color="text.primary">Evaluación {params.id}</Typography>
        </Breadcrumbs>

        {/* Detalles de la evaluación */}
        <DetallesEvaluacion {...evaluacion} />

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="evaluation tabs"
          >
            <Tab label="Vista General" />
            <Tab label="Gestión de Evaluadores" />
            <Tab label="Revisión de Problemas" />
            <Tab label="Métricas y Reportes" />
            <Tab label="Configuración" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Progress Section */}
            <Grid item xs={12}>
              <ProgresoEvaluacion pasos={mockPasos} />
            </Grid>

            {/* Chart Section */}
            <Grid item xs={12}>
              <GraficoHeuristicas datos={mockHeuristicas} />
            </Grid>

            {/* Problems Table */}
            <Grid item xs={12}>
              <TablaProblemas problemas={mockProblemas} />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography>Gestión de Evaluadores (Próximamente)</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography>Revisión de Problemas (Próximamente)</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography>Métricas y Reportes (Próximamente)</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography>Configuración (Próximamente)</Typography>
        </TabPanel>
      </Container>
    </>
  );
} 