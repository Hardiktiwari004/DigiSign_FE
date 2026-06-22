import { create } from "zustand";
import { User } from "@/types/api";
import { clearTokens, setTokens } from "@/lib/client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  login: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsLoading: (isLoading) => set({ isLoading }),
  login: (user, tokens) => {
    setTokens(tokens);
    set({ user, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
