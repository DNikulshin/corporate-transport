import { create } from "zustand";
import type { User } from "../types/user";
import { authStorage } from "../lib/auth-storage";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  isDriver: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  isDriver: () => get().user?.role === "driver",
}));

// Initialize auth state from storage
export async function initializeAuth() {
  const [user, accessToken] = await Promise.all([
    authStorage.getUser(),
    authStorage.getAccessToken(),
  ]);

  if (user && accessToken) {
    useAuthStore.getState().setAuth(user, accessToken);
  } else {
    useAuthStore.getState().setLoading(false);
  }
}
