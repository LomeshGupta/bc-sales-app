import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ThemeMode } from '@/types';
import { STORAGE_KEYS } from '@/constants';

interface ThemeStore {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      toggleTheme: () =>
        set({ mode: get().mode === 'dark' ? 'light' : 'dark' }),
      setTheme: (mode) => set({ mode }),
    }),
    {
      name: STORAGE_KEYS.THEME,
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
