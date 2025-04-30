'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Box,
  IconButton,
  Grid,
  Stack,
} from '@mui/material';
import { MoreVert as MoreVertIcon, Group as GroupIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';

interface Evaluation {
  id: string;
  title: string;
  participants: string;
  startDate: string;
  endDate: string;
  progress: number;
}

// Mock data - Replace with API calls in production
const mockEvaluations: Evaluation[] = [
  {
    id: '1',
    title: 'Evaluación de Usabilidad - Portal Web',
    participants: 'Juan, María, Carlos',
    startDate: '2024-03-01',
    endDate: '2024-03-15',
    progress: 100,
  },
  {
    id: '2',
    title: 'Análisis Heurístico - App Móvil',
    participants: 'Ana, Pedro',
    startDate: '2024-03-10',
    endDate: '2024-03-25',
    progress: 45,
  },
  {
    id: '3',
    title: 'Evaluación UX - Dashboard',
    participants: 'Luis, Sofia',
    startDate: '2024-03-15',
    endDate: '2024-03-30',
    progress: 0,
  },
  {
    id: '4',
    title: 'Análisis de Interfaz - E-commerce',
    participants: 'Diego, Carmen',
    startDate: '2024-03-20',
    endDate: '2024-04-05',
    progress: 75,
  },
  {
    id: '5',
    title: 'Evaluación de Accesibilidad - Blog',
    participants: 'Roberto, Elena',
    startDate: '2024-03-25',
    endDate: '2024-04-10',
    progress: 20,
  }
];

export default function EvaluatorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentEvaluations, setRecentEvaluations] = useState<Evaluation[]>(mockEvaluations);

  useEffect(() => {
    if (!user || user.role !== 'Evaluador') {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchTerm);
  };

  const handleLeaveEvaluation = () => {
    // Implement leave evaluation functionality
    console.log('Leaving evaluation');
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Search and Actions Section*/}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              {/* Search Section - 2/3 width */}
              <Grid item xs={8}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Buscar Evaluación
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      placeholder="Nombre de evaluación"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                    >
                      Buscar Evaluación
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* Actions Section - 1/3 width */}
              <Grid item xs={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Acciones
                  </Typography>
                  <Stack spacing={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                    >
                      Solicitar evaluación heurística
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      onClick={handleLeaveEvaluation}
                    >
                      Salir de una evaluación heurística
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Recent Evaluations Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tus 5 Evaluaciones más recientes
              </Typography>
              <List>
                {recentEvaluations.slice(0, 5).map((evaluation) => (
                  <ListItem
                    key={evaluation.id}
                    sx={{
                      mb: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                    }}
                  >
                    <ListItemText
                      primary={evaluation.title}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {evaluation.participants}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {`${evaluation.startDate} - ${evaluation.endDate}`}
                          </Box>
                          <Box>
                            {`Tiempo de Avance: ${evaluation.progress}%`}
                          </Box>
                        </Box>
                      }
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => router.push(`/dashboard/${evaluation.id}`)}
                    >
                      {evaluation.progress > 0 ? 'Retomar' : 'Iniciar'}
                    </Button>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => router.push('/evaluations')}
              >
                Ver todas tus evaluaciones
              </Button>
            </Paper>
          </Grid>

          
        </Grid>
      </Container>
    </>
  );
} 