'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hashPassword } from '@/utils/hashUtils';

interface User {
  username: string;
  role: 'COORDINADOR' | 'EVALUADOR' | 'ADMINISTRADOR';
  id_evaluador?: number;
  id_coordinador?: number;
  id_administrador?: number;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for saved JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload); // Debug log
        setUser({
          username: payload.sub,
          role: payload.role,
          id_evaluador: payload.id_evaluador,
          id_coordinador: payload.id_coordinador,
          id_administrador: payload.id_administrador
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 Iniciando proceso de autenticación para:', { username });
      
      // PASO 1: Intentar login como ADMINISTRADOR con contraseña en texto plano
      console.log('📋 PASO 1: Intentando autenticación como ADMINISTRADOR (contraseña en texto plano)');
      
      try {
        const adminResponse = await fetch('http://localhost:8085/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre_usuario: username,
            contrasena: password, // Contraseña en texto plano para administrador
          }),
        });

        console.log('📊 Respuesta ADMINISTRADOR - Status:', adminResponse.status);

        if (adminResponse.ok) {
          const data = await adminResponse.json();
          console.log('✅ Login ADMINISTRADOR exitoso:', data);
          
          // Verificar que efectivamente es ADMINISTRADOR
          if (data.role === 'ADMINISTRADOR') {
            setUser({
              username: username,
              role: data.role,
              id_evaluador: data.id_evaluador,
              id_coordinador: data.id_coordinador,
              id_administrador: data.id_administrador
            });

            console.log('🎉 Usuario ADMINISTRADOR configurado:', {
              username: username,
              role: data.role,
              id_administrador: data.id_administrador
            });

            // Save token
            localStorage.setItem('token', data.token);
            sessionStorage.setItem('role', data.role);

            // Redirect to administrator dashboard
            router.push('/dashboard/administrator');
            return { success: true };
          }
        }
        
        // Si llegamos aquí, el primer intento no fue exitoso
        console.log('❌ Intento como ADMINISTRADOR falló, continuando al PASO 2');
        
      } catch (adminError) {
        console.log('🚫 Error en intento como ADMINISTRADOR:', adminError);
        console.log('➡️ Continuando al PASO 2...');
      }

      // PASO 2: Si no es administrador, enviar contraseña en texto plano para EVALUADOR/COORDINADOR
      console.log('📋 PASO 2: Intentando autenticación como EVALUADOR/COORDINADOR (contraseña en texto plano)');
      
      try {
        // CORECCIÓN: Enviar contraseña en texto plano, no hasheada
        console.log('📝 Enviando contraseña en texto plano para comparación bcrypt en backend...');

        const userResponse = await fetch('http://localhost:8085/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre_usuario: username,
            contrasena: password, // Contraseña en texto plano para que backend use bcrypt.matches()
          }),
        });

        console.log('📊 Respuesta EVALUADOR/COORDINADOR - Status:', userResponse.status);

        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error('❌ Error en respuesta EVALUADOR/COORDINADOR:', errorText);
          
          if (userResponse.status === 404) {
            throw new Error('El servidor no está disponible. Verifique que el backend esté corriendo.');
          }
          if (userResponse.status === 400 || userResponse.status === 401) {
            throw new Error('Credenciales inválidas. Por favor, verifique su nombre de usuario y contraseña.');
          }
          throw new Error(`Error del servidor: ${userResponse.status} ${errorText}`);
        }

        const data = await userResponse.json();
        console.log('✅ Login EVALUADOR/COORDINADOR exitoso:', data);
        
        // Verificar que es EVALUADOR o COORDINADOR
        if (data.role === 'EVALUADOR' || data.role === 'COORDINADOR') {
          setUser({
            username: username,
            role: data.role,
            id_evaluador: data.id_evaluador,
            id_coordinador: data.id_coordinador,
            id_administrador: data.id_administrador
          });

          console.log('🎉 Usuario configurado:', {
            username: username,
            role: data.role,
            id_evaluador: data.id_evaluador,
            id_coordinador: data.id_coordinador
          });

          // Save token
          localStorage.setItem('token', data.token);
          sessionStorage.setItem('role', data.role);

          // Get the dashboard path based on role
          const dashboardPath = data.role === 'COORDINADOR' ? '/dashboard/coordinator' : '/dashboard/evaluator';
          router.push(dashboardPath);

          return { success: true };
        } else {
          throw new Error('Tipo de usuario no válido. Contacte al administrador.');
        }

      } catch (userError) {
        console.error('💥 Error en PASO 2 (EVALUADOR/COORDINADOR):', userError);
        throw userError;
      }

    } catch (error) {
      console.error('💥 Error general en login:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error al intentar conectar con el servidor' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('role');
    setUser(null);
    router.push('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'COORDINADOR':
        return '/dashboard/coordinator';
      case 'ADMINISTRADOR':
        return '/dashboard/administrator';
      default:
        return '/dashboard/evaluator'
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 