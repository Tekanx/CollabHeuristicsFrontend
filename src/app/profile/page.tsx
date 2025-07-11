'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Visibility, 
  VisibilityOff 
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { evaluadorService } from '@/services/evaluadorService';
import { coordinadorService } from '@/services/coordinadorService';
import { Evaluador } from '@/components/interface/Evaluador';
import { Coordinador } from '@/components/interface/Coordinador';
import { hashPassword } from '@/utils/hashUtils';

type UserProfile = Evaluador | Coordinador;

interface FormErrors {
  nombre?: string;
  apellido?: string;
  correo?: string;
  numero?: string;
  contrasena?: string;
  genero?: string;
}

interface NormalizedProfile {
  id_evaluador?: number;
  id_coordinador?: number;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  numero: string;
  correo: string;
  genero: number;
  url_avatar: string;
  contrasena: string;
}

const genderOptions = [
  { value: 0, label: 'Masculino' },
  { value: 1, label: 'Femenino' },
  { value: 2, label: 'Otro' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, getDashboardPath } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<NormalizedProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<NormalizedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Función auxiliar para normalizar los datos del perfil
  const normalizeProfile = (profileData: UserProfile): NormalizedProfile => {
    return {
      ...(profileData as any),
      nombre: String(profileData.nombre || ''),
      apellido: String(profileData.apellido || ''),
      correo: String(profileData.correo || ''),
      numero: String(profileData.numero || ''),
      contrasena: String(profileData.contrasena || ''),
      nombre_usuario: String(profileData.nombre_usuario || ''),
      genero: Number(profileData.genero || 0),
    };
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      console.log('🔍 Iniciando carga del perfil...');
      
      const role = sessionStorage.getItem('role');
      console.log('📋 Rol detectado:', role);
      
      if (!role) {
        console.error('❌ No se encontró rol en sessionStorage');
        console.log('SessionStorage completo:', sessionStorage);
        setErrorMessage('No se pudo determinar el rol del usuario. Por favor, inicie sesión nuevamente.');
        return;
      }

      let profileData: UserProfile;
      
      if (role === 'EVALUADOR') {
        console.log('👤 Cargando perfil de evaluador...');
        profileData = await evaluadorService.getProfile();
        console.log('✅ Perfil de evaluador cargado:', profileData);
      } else if (role === 'COORDINADOR') {
        console.log('👥 Cargando perfil de coordinador...');
        profileData = await coordinadorService.getProfile();
        console.log('✅ Perfil de coordinador cargado:', profileData);
      } else {
        console.error('❌ Rol no válido:', role);
        setErrorMessage(`Rol de usuario no válido: ${role}`);
        return;
      }

      if (profileData && 'nombre_usuario' in profileData) {
        const normalizedData = normalizeProfile(profileData);
        setProfile(normalizedData);
        setOriginalProfile({ ...normalizedData });
        console.log('🎉 Perfil configurado exitosamente:', normalizedData);
      } else {
        console.error('❌ Datos de perfil inválidos:', profileData);
        setErrorMessage('Los datos del perfil recibidos no son válidos');
      }
    } catch (error: any) {
      console.error('💥 Error loading profile:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Error desconocido';
      setErrorMessage(`Error al cargar el perfil: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!profile) return false;

    // Validar nombre (solo caracteres)
    const nombre = profile.nombre.trim();
    if (!nombre) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      newErrors.nombre = 'El nombre solo puede contener letras';
    }

    // Validar apellido (solo caracteres)
    const apellido = profile.apellido.trim();
    if (!apellido) {
      newErrors.apellido = 'El apellido es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
      newErrors.apellido = 'El apellido solo puede contener letras';
    }

    // Validar correo electrónico
    const correo = profile.correo.trim();
    if (!correo) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      newErrors.correo = 'Ingrese un correo electrónico válido';
    }

    // Validar número telefónico (solo números, mínimo 8 dígitos)
    const numero = profile.numero.trim();
    if (!numero) {
      newErrors.numero = 'El número telefónico es requerido';
    } else if (!/^\d+$/.test(numero)) {
      newErrors.numero = 'El número telefónico solo puede contener dígitos';
    } else if (numero.length < 8) {
      newErrors.numero = 'El número telefónico debe tener al menos 8 dígitos';
    } else if (numero.length > 15) {
      newErrors.numero = 'El número telefónico no puede tener más de 15 dígitos';
    }

    // Validar contraseña
    const contrasena = profile.contrasena.trim();
    if (!contrasena) {
      newErrors.contrasena = 'La contraseña es requerida';
    } else if (contrasena.length < 6) {
      newErrors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleCancel = () => {
    if (originalProfile) {
      setProfile({ ...originalProfile });
    }
    setIsEditing(false);
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (!profile || !validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      // Crear una copia del perfil para enviar
      const profileToSave = { ...profile };

      // Encriptar la contraseña si ha cambiado
      if (originalProfile && profile.contrasena !== originalProfile.contrasena) {
        profileToSave.contrasena = await hashPassword(profile.contrasena);
      }

      const role = sessionStorage.getItem('role');
      
      if (role === 'EVALUADOR') {
        await evaluadorService.updateProfile(profileToSave as Evaluador);
      } else if (role === 'COORDINADOR') {
        await coordinadorService.updateProfile(profileToSave as Coordinador);
      }

      // Actualizar el perfil original con los nuevos datos
      setOriginalProfile({ ...profileToSave });
      setProfile({ ...profileToSave });
      setIsEditing(false);
      setSuccessMessage('Perfil actualizado exitosamente');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Error desconocido';
      setErrorMessage(`Error al guardar el perfil: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof NormalizedProfile) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    
    let value = event.target.value;
    
    // Filtrar solo dígitos para el número telefónico
    if (field === 'numero') {
      value = value.replace(/\D/g, '');
      // Limitar a 15 dígitos máximo
      if (value.length > 15) {
        value = value.slice(0, 15);
      }
    }
    
    setProfile({
      ...profile,
      [field]: value,
    });
    
    // Limpiar error del campo específico
    if (errors[field as keyof FormErrors]) {
      setErrors({
        ...errors,
        [field]: undefined,
      });
    }
  };

  const handleGenderChange = (event: any) => {
    if (!profile) return;
    
    setProfile({
      ...profile,
      genero: Number(event.target.value),
    });
  };

  const renderField = (
    field: keyof NormalizedProfile, 
    label: string, 
    isEditable: boolean = false,
    type: string = 'text'
  ) => {
    if (!profile) return null;

    const value = profile[field] as string;
    const error = errors[field as keyof FormErrors];

    if (field === 'contrasena' && isEditable && isEditing) {
      return (
        <TextField
          fullWidth
          label={label}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange(field)}
          error={!!error}
          helperText={error}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      );
    }

    if (field === 'contrasena' && !isEditing) {
      return (
        <TextField
          fullWidth
          label={label}
          type="password"
          value="••••••••"
          variant="filled"
          InputProps={{
            readOnly: true,
          }}
        />
      );
    }

    if (isEditable && isEditing) {
      return (
        <TextField
          fullWidth
          label={label}
          type={type}
          value={value}
          onChange={handleChange(field)}
          error={!!error}
          helperText={error}
          inputProps={{
            maxLength: field === 'numero' ? 15 : undefined,
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <EditIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      );
    }

    return (
      <TextField
        fullWidth
        label={label}
        value={value}
        variant="filled"
        InputProps={{
          readOnly: true,
        }}
      />
    );
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            {errorMessage || 'Error al cargar la información del perfil'}
            <Button 
              variant="text" 
              onClick={loadProfile}
              sx={{ ml: 2 }}
            >
              Reintentar
            </Button>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{ width: 100, height: 100, mr: 3 }}
            >
              {profile.nombre?.charAt(0)?.toUpperCase() || 'U'}
              {profile.apellido?.charAt(0)?.toUpperCase() || ''}
            </Avatar>
            <Typography variant="h4">Perfil de Usuario</Typography>
          </Box>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderField('nombre_usuario', 'Nombre de usuario')}
            </Grid>
            <Grid item xs={6}>
              {renderField('nombre', 'Nombre', true)}
            </Grid>
            <Grid item xs={6}>
              {renderField('apellido', 'Apellido', true)}
            </Grid>
            <Grid item xs={12}>
              {renderField('correo', 'Correo electrónico', true, 'email')}
            </Grid>
            <Grid item xs={12}>
              {renderField('contrasena', 'Contraseña', true)}
            </Grid>
            <Grid item xs={6}>
              {renderField('numero', 'Número telefónico', true, 'tel')}
            </Grid>
            <Grid item xs={6}>
              <FormControl 
                fullWidth 
                variant={isEditing ? "outlined" : "filled"}
                error={!!errors.genero}
              >
                <InputLabel>Género</InputLabel>
                <Select
                  value={profile.genero}
                  label="Género"
                  onChange={handleGenderChange}
                  disabled={!isEditing}
                >
                  {genderOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {!isEditing ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleEdit}
                >
                  Modificar información
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push(getDashboardPath())}
                >
                  Devolverse a Dashboard
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={logout}
                >
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancelar cambios
                </Button>
              </>
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
} 