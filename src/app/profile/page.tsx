'use client';

import { useState } from 'react';
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
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';

interface UserProfile {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  avatarUrl: string;
}

// Mock profile data - Replace with API call in production
const mockProfile: UserProfile = {
  username: 'evaluator',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  gender: 'Masculino',
  avatarUrl: '',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, getDashboardPath } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(mockProfile);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // Implement save functionality
    console.log('Saving profile:', profile);
    setIsEditing(false);
  };

  const handleChange = (field: keyof UserProfile) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [field]: event.target.value,
    });
  };

  const renderField = (field: keyof UserProfile, label: string, isEditable: boolean = false) => {
    if (isEditable && isEditing) {
      return (
        <TextField
          fullWidth
          label={label}
          value={profile[field]}
          onChange={handleChange(field)}
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
        value={profile[field]}
        variant="filled"
        InputProps={{
          readOnly: true,
        }}
      />
    );
  };

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{ width: 100, height: 100, mr: 3 }}
              src={profile.avatarUrl}
            >
              {profile.firstName.charAt(0)}
            </Avatar>
            <Typography variant="h4">Perfil de Usuario</Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderField('username', 'Nombre de usuario')}
            </Grid>
            <Grid item xs={6}>
              {renderField('firstName', 'Nombre')}
            </Grid>
            <Grid item xs={6}>
              {renderField('lastName', 'Apellido')}
            </Grid>
            <Grid item xs={12}>
              {renderField('email', 'Correo', true)}
            </Grid>
            <Grid item xs={6}>
              {renderField('phone', 'Número telefónico', true)}
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth variant={isEditing ? "outlined" : "filled"}>
                <InputLabel>Género</InputLabel>
                <Select
                  value={profile.gender}
                  label="Género"
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  readOnly={!isEditing}
                >
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => router.push(getDashboardPath())}
            >
              Devolverse a Dashboard
            </Button>
            <Button
              variant="contained"
              color={isEditing ? 'success' : 'primary'}
              onClick={isEditing ? handleSave : handleEdit}
            >
              {isEditing ? 'Guardar cambios' : 'Modificar información'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={logout}
            >
              Cerrar sesión
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
} 