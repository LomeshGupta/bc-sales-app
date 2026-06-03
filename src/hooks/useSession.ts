'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getOAuthToken } from '@/services/auth/tokenService';
import { ROUTES } from '@/constants';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export function useSession() {
  const router = useRouter();
  const { isAuthenticated, isTokenExpired, isSessionExpired, updateLastActivity, setToken, logout } = useAuthStore();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => updateLastActivity();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, updateLastActivity]);

  // Session validation on route change
  useEffect(() => {
    if (!isAuthenticated) return;

    if (isSessionExpired()) {
      logout();
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (isTokenExpired()) {
      refreshToken();
    }
  });

  // Periodic token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const scheduleRefresh = async () => {
      try {
        const tokenData = await getOAuthToken();
        const expiry = Date.now() + tokenData.expires_in * 1000;
        setToken(tokenData.access_token, expiry);

        // Schedule next refresh 5 min before expiry
        const nextRefresh = tokenData.expires_in * 1000 - 5 * 60 * 1000;
        refreshTimerRef.current = setTimeout(scheduleRefresh, nextRefresh);
      } catch {
        logout();
        router.replace(ROUTES.LOGIN);
      }
    };

    // Check and schedule
    if (isTokenExpired()) {
      scheduleRefresh();
    }

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [isAuthenticated]);

  async function refreshToken() {
    try {
      const tokenData = await getOAuthToken();
      const expiry = Date.now() + tokenData.expires_in * 1000;
      setToken(tokenData.access_token, expiry);
    } catch {
      logout();
      router.replace(ROUTES.LOGIN);
    }
  }

  return { isAuthenticated };
}
