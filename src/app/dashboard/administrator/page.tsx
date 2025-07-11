'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import UsersList from '@/components/dashboard/AdministradorViews/UsersList';
import UserForm from '@/components/dashboard/AdministradorViews/UserForm';
import { administradorService } from '@/services/administradorService';
import { Evaluador } from '@/components/interface/Evaluador';
import { Coordinador } from '@/components/interface/Coordinador';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

export default function AdministratorDashboard() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [evaluadores, setEvaluadores] = useState<Evaluador[]>([]);
  const [coordinadores, setCoordinadores] = useState<Coordinador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Evaluador | Coordinador | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [evaluadoresData, coordinadoresData] = await Promise.all([
        administradorService.getAllEvaluadores(),
        administradorService.getAllCoordinadores()
      ]);
      
      setEvaluadores(evaluadoresData);
      setCoordinadores(coordinadoresData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setShowCreateForm(false);
    setEditingUser(null);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateForm(true);
  };

  const handleEditUser = (user: Evaluador | Coordinador) => {
    setEditingUser(user);
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setEditingUser(null);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const getUserType = () => {
    return tabValue === 0 ? 'EVALUADOR' : 'COORDINADOR';
  };

  const getCurrentUsers = () => {
    return tabValue === 0 ? evaluadores : coordinadores;
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMINISTRADOR">
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Panel de Administración
        </Typography>
        
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Bienvenido, {user?.username}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Evaluadores (${evaluadores.length})`} />
              <Tab label={`Coordinadores (${coordinadores.length})`} />
            </Tabs>
            
            {!showCreateForm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateUser}
              >
                Crear {getUserType().toLowerCase()}
              </Button>
            )}
          </Box>

          <TabPanel value={tabValue} index={0}>
            {showCreateForm ? (
              <UserForm
                userType="EVALUADOR"
                editingUser={editingUser as Evaluador}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
              />
            ) : (
              <UsersList
                users={evaluadores}
                userType="EVALUADOR"
                onEdit={handleEditUser}
                onRefresh={() => setRefreshTrigger(prev => prev + 1)}
              />
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {showCreateForm ? (
              <UserForm
                userType="COORDINADOR"
                editingUser={editingUser as Coordinador}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
              />
            ) : (
              <UsersList
                users={coordinadores}
                userType="COORDINADOR"
                onEdit={handleEditUser}
                onRefresh={() => setRefreshTrigger(prev => prev + 1)}
              />
            )}
          </TabPanel>
        </Paper>
      </Container>
    </ProtectedRoute>
  );
}
