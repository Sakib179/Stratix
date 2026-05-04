import { create } from 'zustand';
import { User } from '@/types';
import { setAccessToken, authApi } from '@/lib/api';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    setAccessToken(token);
  },

  login: (user, token) => {
    setAccessToken(token);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {}
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data: refreshData } = await authApi.refresh();
      const token = refreshData.data.accessToken;
      setAccessToken(token);

      const { data: meData } = await authApi.getMe();
      set({ user: meData.data, isAuthenticated: true, isLoading: false });
    } catch {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (updates) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...updates } });
  },
}));
