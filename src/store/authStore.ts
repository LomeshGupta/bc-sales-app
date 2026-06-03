import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BCUser } from '@/types';
import { STORAGE_KEYS } from '@/constants';

interface AuthStore {
  user: BCUser | null;
  accessToken: string | null;
  tokenExpiry: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastActivity: number;

  setAuth: (user: BCUser, token: string, expiry: number) => void;
  setToken: (token: string, expiry: number) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateLastActivity: () => void;
  isTokenExpired: () => boolean;
  isSessionExpired: () => boolean;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      tokenExpiry: null,
      isAuthenticated: false,
      isLoading: false,
      lastActivity: Date.now(),

      setAuth: (user, token, expiry) => {
        // Set a cookie so the middleware can guard routes server-side
        setCookie('bc_authed', '1', 30 * 60); // 30 min
        set({ user, accessToken: token, tokenExpiry: expiry, isAuthenticated: true, lastActivity: Date.now() });
      },

      setToken: (token, expiry) => {
        // Renew cookie TTL on token refresh
        setCookie('bc_authed', '1', 30 * 60);
        set({ accessToken: token, tokenExpiry: expiry });
      },

      logout: () => {
        deleteCookie('bc_authed');
        set({ user: null, accessToken: null, tokenExpiry: null, isAuthenticated: false, lastActivity: 0 });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      updateLastActivity: () => {
        setCookie('bc_authed', '1', 30 * 60); // reset cookie TTL on activity
        set({ lastActivity: Date.now() });
      },

      isTokenExpired: () => {
        const { tokenExpiry } = get();
        if (!tokenExpiry) return true;
        return Date.now() >= tokenExpiry - 5 * 60 * 1000;
      },

      isSessionExpired: () => {
        const { lastActivity } = get();
        return Date.now() - lastActivity > 30 * 60 * 1000;
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return sessionStorage;
        return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
      }),
      // Don't persist token to sessionStorage on server
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        tokenExpiry: s.tokenExpiry,
        isAuthenticated: s.isAuthenticated,
        lastActivity: s.lastActivity,
      }),
    }
  )
);
