import { create } from 'zustand';
import type { UserProfile } from './auth.types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('vault_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  isInitialized: false,

  setUser: (user: UserProfile | null) => {
    if (user) {
      localStorage.setItem('vault_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } else {
      localStorage.removeItem('vault_user');
      localStorage.removeItem('access_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setInitialized: (isInitialized: boolean) => set({ isInitialized }),

  logout: () => {
    localStorage.removeItem('vault_user');
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
