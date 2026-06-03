'use client';
import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getOAuthToken } from '@/services/auth/tokenService';
import { ROUTES } from '@/constants';

const PROTECTED_PREFIXES = ['/dashboard', '/sales-orders', '/customers', '/reports'];
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isAuthenticated, isSessionExpired, isTokenExpired,
    updateLastActivity, setToken, logout,
  } = useAuthStore();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // Client-side guard (middleware handles server-side)
  useEffect(() => {
    if (!isProtected) return;
    if (!isAuthenticated) {
      router.replace(`${ROUTES.LOGIN}?from=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isSessionExpired()) {
      logout();
      router.replace(ROUTES.LOGIN);
    }
  }, [pathname, isAuthenticated]);

  // Activity tracking — resets session timer + cookie TTL
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleActivity = () => updateLastActivity();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
  }, [isAuthenticated, updateLastActivity]);

  // Proactive token refresh scheduler
  useEffect(() => {
    if (!isAuthenticated) return;

    const scheduleRefresh = async () => {
      try {
        const tokenData = await getOAuthToken();
        const expiry = Date.now() + tokenData.expires_in * 1000;
        setToken(tokenData.access_token, expiry);
        const nextMs = Math.max((tokenData.expires_in - 300) * 1000, 60_000);
        refreshTimerRef.current = setTimeout(scheduleRefresh, nextMs);
      } catch {
        logout();
        router.replace(ROUTES.LOGIN);
      }
    };

    if (isTokenExpired()) scheduleRefresh();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
