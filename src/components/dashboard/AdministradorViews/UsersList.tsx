'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Box,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Evaluador } from '@/components/interface/Evaluador';
import { Coordinador } from '@/components/interface/Coordinador';
import { administradorService } from '@/services/administradorService';

interface UsersListProps {
  users: (Evaluador | Coordinador)[];
  userType: 'EVALUADOR' | 'COORDINADOR';
  onEdit: (user: Evaluador | Coordinador) => void;
  onRefresh: () => void;
}

const genderLabels = {
  0: 'Masculino',
  1: 'Femenino',
  2: 'Otro'
};

export default function UsersList({ users, userType, onEdit, onRefresh }: UsersListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Evaluador | Coordinador | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteClick = (user: Evaluador | Coordinador) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      setError('');

      const userId = userType === 'EVALUADOR' 
        ? (userToDelete as Evaluador).id_evaluador 
        : (userToDelete as Coordinador).id_coordinador;

      if (userType === 'EVALUADOR') {
        await administradorService.deleteEvaluador(userId);
      } else {
        await administradorService.deleteCoordinador(userId);
      }

      onRefresh();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(`Error al eliminar el ${userType.toLowerCase()}: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
    setError('');
  };

  const getUserId = (user: Evaluador | Coordinador) => {
    return userType === 'EVALUADOR' 
      ? (user as Evaluador).id_evaluador 
      : (user as Coordinador).id_coordinador;
  };

  if (users.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No hay {userType.toLowerCase()}s registrados
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Haz clic en "Crear {userType.toLowerCase()}" para agregar el primero
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Nombre Completo</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Género</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={getUserId(user)} hover>
                <TableCell>
                  <Chip label={getUserId(user)} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {user.nombre_usuario}
                  </Typography>
                </TableCell>
                <TableCell>
                  {user.nombre} {user.apellido}
                </TableCell>
                <TableCell>{user.correo}</TableCell>
                <TableCell>{user.numero}</TableCell>
                <TableCell>
                  {genderLabels[user.genero as keyof typeof genderLabels]}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(user)}
                    color="primary"
                    title="Editar usuario"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(user)}
                    color="error"
                    title="Eliminar usuario"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar al {userType.toLowerCase()} <strong>{userToDelete?.nombre_usuario}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
