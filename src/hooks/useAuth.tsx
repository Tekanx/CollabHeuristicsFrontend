'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  role: 'COORDINADOR' | 'EVALUADOR';
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
        setUser({
          username: payload.sub,
          role: payload.role
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login with:', { username });
      
      const response = await fetch('http://localhost:8085/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre_usuario: username,
          contrasena: password,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login error response:', errorText);
        
        if (response.status === 404) {
          throw new Error('El servidor no está disponible. Verifique que el backend esté corriendo.');
        }
        if (response.status === 401) {
          throw new Error('Credenciales inválidas');
        }
        throw new Error(`Error del servidor: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Login successful:', data);
      
      // Save token
      localStorage.setItem('token', data.token);
      
      // Set user state with role from response
      setUser({
        username: username,
        role: data.role
      });

      // Get the dashboard path based on role
      const dashboardPath = data.role === 'COORDINADOR' ? '/dashboard/coordinator' : '/dashboard/evaluator';
      router.push(dashboardPath);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error al intentar conectar con el servidor' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    return user.role === 'COORDINADOR' ? '/dashboard/coordinator' : '/dashboard/evaluator';
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