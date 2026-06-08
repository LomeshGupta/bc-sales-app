import { BCUser, LoginCredentials, BCApiResponse } from "@/types";
import { getOAuthToken, calculateTokenExpiry } from "./tokenService";
import { useAuthStore } from "@/store/authStore";

import {
  BC_TENANT_ID,
  BC_COMPANY_ID,
  BC_API_BASE_URL,
  BC_ENV_NAME,
  COMPANY_NAME,
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
interface BCLoginResponse {
  "@odata.context": string;
  value: string;
}

interface BCLoginResult {
  success: boolean;
  message: string;
  fullName?: string;
  Location?: string;
}

export async function loginUser(credentials: LoginCredentials): Promise<{
  user: BCUser;
  token: string;
  expiry: number;
}> {
  const store = useAuthStore.getState();
  store.setLoading(true);

  let accessToken = "";
  let loginSuccess = false;
  let loginMessage = "";
  let loginLocation = "";

  try {
    // ============================================================
    // Get OAuth Token
    // ============================================================
    const tokenData = await getOAuthToken();

    accessToken = tokenData.access_token;

    const expiry = calculateTokenExpiry(tokenData.expires_in);

    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // ============================================================
    // Authenticate User
    // ============================================================
    const loginUrl =
      `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
      `/ODataV4/Velvotix_Login?Company=${COMPANY_NAME}`;

    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user: credentials.username,
        password: credentials.password,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(
        `Business Central login service returned ${loginResponse.status}`,
      );
    }

    const responseData: BCLoginResponse = await loginResponse.json();

    let result: BCLoginResult;

    try {
      result = JSON.parse(responseData.value);
    } catch {
      throw new Error("Invalid response received from Business Central");
    }

    loginSuccess = result.success;
    loginMessage = result.message;
    loginLocation = result.Location ?? "";

    // ============================================================
    // Failed Login
    // ============================================================
    if (!result.success) {
      throw new Error(result.message || "Invalid username or password");
    }

    // ============================================================
    // Create User Object
    // ============================================================
    const user: BCUser = {
      userId: credentials.username,
      username: credentials.username,
      displayName: result.fullName || credentials.username,
      email: "",
      role: "",
      location: result.Location,
    };

    // ============================================================
    // Save Auth State
    // ============================================================
    store.setAuth(user, accessToken, expiry);

    // ============================================================
    // Login Log (Success)
    // ============================================================
    void saveLoginLog({
      token: accessToken,
      userName: credentials.username,
      location: loginLocation,
      success: true,
      type: "Web",
    });

    return {
      user,
      token: accessToken,
      expiry,
    };
  } catch (error) {
    // ============================================================
    // Login Log (Failure)
    // ============================================================
    if (accessToken) {
      void saveLoginLog({
        token: accessToken,
        userName: credentials.username,
        location: loginLocation,
        success: false,
        type: "Web",
      });
    }

    throw error;
  } finally {
    store.setLoading(false);
  }
}

interface LoginLogParams {
  token: string;
  userName: string;
  location?: string;
  success: boolean;
  type: string;
}

async function getBrowserLocation(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve("");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          resolve(`${latitude},${longitude}`);
        } catch {
          resolve("");
        }
      },
      () => resolve(""),
      {
        enableHighAccuracy: false,
        timeout: 5000,
      },
    );
  });
}

async function saveLoginLog({
  token,
  userName,
  location,
  success,
  type,
}: LoginLogParams): Promise<void> {
  const browserLocation = await getBrowserLocation();
  try {
    const logsUrl =
      `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}` +
      `/ODataV4/Company('${BC_COMPANY_ID}')/LoginLogs`;

    await fetch(logsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        userName,
        time: new Date().toISOString(),
        location: browserLocation,
        device: navigator.userAgent,
        type,
        Success: success,
      }),
    });
  } catch (error) {
    console.error("Failed to save login log", error);
  }
}

export function logoutUser(): void {
  useAuthStore.getState().logout();
}
