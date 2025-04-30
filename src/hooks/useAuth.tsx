'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import bcryptjs from 'bcryptjs';

interface User {
  username: string;
  role: 'Coordinador' | 'Evaluador';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ role: string }>;
  logout: () => void;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data - In a real app, this would come from your backend
const MOCK_USERS = [
  {
    username: 'coordinator',
    // hashed value of "password123"
    password: '$2a$10$7PT41rrxGfUcHtHyIu/7q.IKqZzG2QkAw9.VLzOlE57SuAqFnl4pK',
    role: 'Coordinador'
  },
  {
    username: 'evaluator',
    // hashed value of "password123"
    password: '$2a$10$7PT41rrxGfUcHtHyIu/7q.IKqZzG2QkAw9.VLzOlE57SuAqFnl4pK',
    role: 'Evaluador'
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Handle browser navigation
  useEffect(() => {
    window.addEventListener('popstate', () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    });
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    return user.role === 'Coordinador' ? '/dashboard/coordinator' : '/dashboard/evaluator';
  };

  const login = async (username: string, password: string): Promise<{ role: string }> => {
    console.log('Login attempt:', { username, password });
    
    // In a real app, this would be an API call
    const user = MOCK_USERS.find(u => u.username === username);
    console.log('Found user:', user);
    
    if (!user) {
      console.log('No user found with username:', username);
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);
    
    if (isPasswordValid) {
      const userData = { username, role: user.role as 'Coordinador' | 'Evaluador' };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Login successful:', userData);
      return { role: user.role };
    }
    
    console.log('Password validation failed');
    throw new Error('Invalid credentials');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
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