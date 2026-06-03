import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { getOAuthToken } from '@/services/auth/tokenService';

/**
 * All BC API calls are routed through /api/bc (server-side proxy).
 * This eliminates CORS issues with the BC API domain.
 *
 * Request pattern:
 *   axiosClient.get('/salesOrders', { params: { $top: 20 } })
 *   → GET /api/bc?path=/salesOrders&$top=20
 *   → Server fetches https://api.businesscentral.dynamics.com/...
 */
const axiosClient: AxiosInstance = axios.create({
  baseURL: '/api/bc',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const store = useAuthStore.getState();
    store.updateLastActivity();

    // Move the URL path into the `path` query param for the proxy
    if (config.url && !config.url.startsWith('/api/')) {
      config.params = { path: config.url, ...config.params };
      config.url = '/api/bc';
    }

    // Attach access token as a header so the proxy can optionally forward it.
    // (The server re-fetches its own token, but this keeps the client state in sync.)
    if (store.isTokenExpired() && store.isAuthenticated) {
      try {
        const tokenData = await getOAuthToken();
        const expiry = Date.now() + tokenData.expires_in * 1000;
        store.setToken(tokenData.access_token, expiry);
      } catch {
        store.logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(new Error('Token refresh failed'));
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const store = useAuthStore.getState();

    if (error.response?.status === 401) {
      try {
        const tokenData = await getOAuthToken();
        const expiry = Date.now() + tokenData.expires_in * 1000;
        store.setToken(tokenData.access_token, expiry);
        // Retry the original request
        return axiosClient(error.config!);
      } catch {
        store.logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
