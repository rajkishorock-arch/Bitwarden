import { create } from 'zustand';
import type { User } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('vault_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('vault_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } else {
      localStorage.removeItem('vault_user');
      localStorage.removeItem('access_token');
      set({ user: null, isAuthenticated: false });
    }
  },

  logout: () => {
    localStorage.removeItem('vault_user');
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },
}));
