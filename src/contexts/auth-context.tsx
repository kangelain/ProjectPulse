
'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import type { User, Role } from '@/types/user';
import { useRouter } from 'next/navigation';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

interface AuthContextType {
  authState: AuthState;
  login: (username: string, role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        setAuthState({ isAuthenticated: true, user, loading: false });
      } else {
        setAuthState({ isAuthenticated: false, user: null, loading: false });
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      setAuthState({ isAuthenticated: false, user: null, loading: false });
      localStorage.removeItem('currentUser'); // Clean up corrupted data
    }
  }, []);

  const login = useCallback((username: string, role: Role) => {
    const user: User = { id: Date.now().toString(), username, role };
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAuthState({ isAuthenticated: true, user, loading: false });
      router.push('/profile');
    } catch (error) {
        console.error("Failed to save user to localStorage", error);
        // Optionally, inform the user that their session might not persist
    }
  }, [router]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
        console.error("Failed to remove user from localStorage", error);
    }
    setAuthState({ isAuthenticated: false, user: null, loading: false });
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
