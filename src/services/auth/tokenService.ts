import { OAuthTokenResponse } from '@/types';

/**
 * Fetches an OAuth token via the Next.js server-side API route.
 * This avoids the CORS block that happens when the browser calls
 * login.microsoftonline.com directly.
 *
 * Browser → /api/auth/token (same origin, no CORS)
 *         → Server → login.microsoftonline.com (server-to-server, no CORS)
 */
export async function getOAuthToken(): Promise<OAuthTokenResponse> {
  const res = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // No body needed — credentials live in server-side env vars
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Token request failed (${res.status})`);
  }

  return res.json();
}

export function calculateTokenExpiry(expiresIn: number): number {
  return Date.now() + expiresIn * 1000;
}

export function isTokenValid(expiry: number | null): boolean {
  if (!expiry) return false;
  return Date.now() < expiry - 5 * 60 * 1000; // 5-min buffer
}
