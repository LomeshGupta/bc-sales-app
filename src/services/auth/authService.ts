import { BCUser, LoginCredentials, BCApiResponse } from "@/types";
import { getOAuthToken, calculateTokenExpiry } from "./tokenService";
import { useAuthStore } from "@/store/authStore";

import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
} from "@/constants";

interface BCUserRecord {
  userId: string;
  username: string;
  displayName?: string;
  email?: string;
  role?: string;
}

/**
 * Login flow — runs entirely in the browser but uses CORS-safe routes:
 *
 * Step 1: POST /api/auth/token       → server calls Microsoft, returns token
 * Step 2: GET  /api/bc?path=/authenticate&filter=...
 *                                    → server calls BC API with token, returns user
 * Step 3: Store result in Zustand + sessionStorage
 */
export async function loginUser(credentials: LoginCredentials): Promise<{
  user: BCUser;
  token: string;
  expiry: number;
}> {
  const store = useAuthStore.getState();
  store.setLoading(true);

  try {
    // ── Step 1: Get OAuth token via server route ──────────────────────────────
    const tokenData = await getOAuthToken();
    const expiry = calculateTokenExpiry(tokenData.expires_in);

    // ── Step 2: Authenticate user via BC proxy route ──────────────────────────
    const filterValue = `username='${credentials.username}' and password='${credentials.password}'`;
    const url = `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}/api/v2.0/companies(${BC_COMPANY_ID})/customers`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Authentication failed (${res.status})`);
    }
    console.log(res);
    const data: BCApiResponse<BCUserRecord> = await res.json();
    const users = data.value;

    if (!users || users.length === 0) {
      throw new Error("Invalid username or password");
    }

    const bcUser = users[0];
    const user: BCUser = {
      userId: bcUser.userId,
      username: bcUser.username,
      displayName: bcUser.displayName || bcUser.username,
      email: bcUser.email,
      role: bcUser.role,
    };

    // ── Step 3: Persist auth state ────────────────────────────────────────────
    store.setAuth(user, tokenData.access_token, expiry);
    return { user, token: tokenData.access_token, expiry };
  } finally {
    store.setLoading(false);
  }
}

export function logoutUser(): void {
  useAuthStore.getState().logout();
}
