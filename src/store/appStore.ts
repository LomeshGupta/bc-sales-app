import { create } from 'zustand';
import { AppNotification } from '@/types';

interface AppStore {
  notifications: AppNotification[];
  unreadCount: number;
  isDrawerOpen: boolean;
  snackbar: { open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' } | null;

  // Actions
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  setDrawerOpen: (open: boolean) => void;
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
  hideSnackbar: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  notifications: [
    {
      id: '1',
      title: 'New Order',
      message: 'Sales Order SO-10045 created by John Doe',
      type: 'info',
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Payment Received',
      message: 'Customer Fabrikam, Inc paid $12,500',
      type: 'success',
      read: false,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  unreadCount: 2,
  isDrawerOpen: false,
  snackbar: null,

  addNotification: (notification) => {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  setDrawerOpen: (open) => set({ isDrawerOpen: open }),

  showSnackbar: (message, severity = 'info') =>
    set({ snackbar: { open: true, message, severity } }),

  hideSnackbar: () =>
    set((state) => ({ snackbar: state.snackbar ? { ...state.snackbar, open: false } : null })),
}));
