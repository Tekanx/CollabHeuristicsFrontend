'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { Evaluador } from '@/components/interface/Evaluador';
import { Coordinador } from '@/components/interface/Coordinador';
import { administradorService, CreateUserData } from '@/services/administradorService';
import { hashPassword } from '@/utils/hashUtils';

interface UserFormProps {
  userType: 'EVALUADOR' | 'COORDINADOR';
  editingUser?: Evaluador | Coordinador | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  nombre?: string;
  apellido?: string;
  correo?: string;
  numero?: string;
  contrasena?: string;
  nombre_usuario?: string;
}

const genderOptions = [
  { value: 0, label: 'Masculino' },
  { value: 1, label: 'Femenino' },
  { value: 2, label: 'Otro' },
];

export default function UserForm({ userType, editingUser, onClose, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    nombre_usuario: '',
    nombre: '',
    apellido: '',
    numero: '',
    correo: '',
    contrasena: '',
    genero: 0,
    url_avatar: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (editingUser) {
      setFormData({
        nombre_usuario: editingUser.nombre_usuario,
        nombre: editingUser.nombre,
        apellido: editingUser.apellido,
        numero: String(editingUser.numero),
        correo: editingUser.correo,
        contrasena: '',
        genero: editingUser.genero,
        url_avatar: editingUser.url_avatar || ''
      });
    }
  }, [editingUser]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre de usuario
    const nombreUsuario = formData.nombre_usuario.trim();
    if (!nombreUsuario) {
      newErrors.nombre_usuario = 'El nombre de usuario es requerido';
    } else if (nombreUsuario.length < 3) {
      newErrors.nombre_usuario = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    // Validar nombre
    const nombre = formData.nombre.trim();
    if (!nombre) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      newErrors.nombre = 'El nombre solo puede contener letras';
    }

    // Validar apellido
    const apellido = formData.apellido.trim();
    if (!apellido) {
      newErrors.apellido = 'El apellido es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
      newErrors.apellido = 'El apellido solo puede contener letras';
    }

    // Validar correo
    const correo = formData.correo.trim();
    if (!correo) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      newErrors.correo = 'Ingrese un correo electrónico válido';
    }

    // Validar número telefónico
    const numero = formData.numero.trim();
    if (!numero) {
      newErrors.numero = 'El número telefónico es requerido';
    } else if (!/^\d+$/.test(numero)) {
      newErrors.numero = 'El número telefónico solo puede contener dígitos';
    } else if (numero.length < 8) {
      newErrors.numero = 'El número telefónico debe tener al menos 8 dígitos';
    } else if (numero.length > 15) {
      newErrors.numero = 'El número telefónico no puede tener más de 15 dígitos';
    }

    // Validar contraseña (solo si es crear nuevo usuario o si se cambió)
    if (!editingUser || formData.contrasena.trim()) {
      const contrasena = formData.contrasena.trim();
      if (!contrasena) {
        newErrors.contrasena = 'La contraseña es requerida';
      } else if (contrasena.length < 6) {
        newErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Prepare data
      const dataToSend = { ...formData };
      
      // Only hash password if it's provided (create or update with new password)
      if (dataToSend.contrasena.trim()) {
        dataToSend.contrasena = await hashPassword(dataToSend.contrasena);
      }

      if (editingUser) {
        // Update user
        const userId = userType === 'EVALUADOR' 
          ? (editingUser as Evaluador).id_evaluador 
          : (editingUser as Coordinador).id_coordinador;

        // Remove password from update if it's empty
        const updateData = { ...dataToSend };

        if (userType === 'EVALUADOR') {
          await administradorService.updateEvaluador(userId, updateData);
        } else {
          await administradorService.updateCoordinador(userId, updateData);
        }
        
        setSuccess(`${userType.toLowerCase()} actualizado exitosamente`);
      } else {
        // Create user
        if (userType === 'EVALUADOR') {
          await administradorService.createEvaluador(dataToSend);
        } else {
          await administradorService.createCoordinador(dataToSend);
        }
        
        setSuccess(`${userType.toLowerCase()} creado exitosamente`);
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Error saving user:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al ${editingUser ? 'actualizar' : 'crear'} el ${userType.toLowerCase()}: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateUserData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    
    // Filter only digits for phone number
    if (field === 'numero') {
      value = value.replace(/\D/g, '');
      if (value.length > 15) {
        value = value.slice(0, 15);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleGenderChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      genero: Number(event.target.value),
    }));
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        {editingUser ? 'Editar' : 'Crear'} {userType.toLowerCase()}
      </Typography>
      
      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de usuario"
              value={formData.nombre_usuario}
              onChange={handleChange('nombre_usuario')}
              error={!!errors.nombre_usuario}
              helperText={errors.nombre_usuario}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.nombre}
              onChange={handleChange('nombre')}
              error={!!errors.nombre}
              helperText={errors.nombre}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Apellido"
              value={formData.apellido}
              onChange={handleChange('apellido')}
              error={!!errors.apellido}
              helperText={errors.apellido}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Correo electrónico"
              type="email"
              value={formData.correo}
              onChange={handleChange('correo')}
              error={!!errors.correo}
              helperText={errors.correo}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Número telefónico"
              value={formData.numero}
              onChange={handleChange('numero')}
              error={!!errors.numero}
              helperText={errors.numero}
              inputProps={{ maxLength: 15 }}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Género</InputLabel>
              <Select
                value={formData.genero}
                label="Género"
                onChange={handleGenderChange}
              >
                {genderOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={editingUser ? "Nueva contraseña (dejar vacío para mantener actual)" : "Contraseña"}
              type={showPassword ? 'text' : 'password'}
              value={formData.contrasena}
              onChange={handleChange('contrasena')}
              error={!!errors.contrasena}
              helperText={errors.contrasena}
              required={!editingUser}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
