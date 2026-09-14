import { OAuthTokenResponse } from "@/types";

let cachedToken: OAuthTokenResponse | null = null;
let tokenExpiry: number | null = null;

// Prevent multiple simultaneous token requests
let tokenRequest: Promise<OAuthTokenResponse> | null = null;

// Refresh the token before actual expiry.
// 5 minutes is reasonable, but never allow a very short-lived
// token to become immediately invalid.
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export async function getOAuthToken(): Promise<OAuthTokenResponse> {
  // 1. Return cached token when it is safely valid
  if (cachedToken && isTokenValid(tokenExpiry)) {
    return cachedToken;
  }

  // 2. If another request is already refreshing the token,
  //    wait for that request instead of creating another one.
  if (tokenRequest) {
    return tokenRequest;
  }

  // 3. Start exactly one token refresh request
  tokenRequest = fetchOAuthToken();

  try {
    const response = await tokenRequest;

    // Store the token
    cachedToken = response;

    // Calculate absolute expiry time
    tokenExpiry = calculateTokenExpiry(response.expires_in);

    return response;
  } catch (error) {
    // Don't leave an invalid token in memory
    cachedToken = null;
    tokenExpiry = null;

    throw error;
  } finally {
    // Allow a future refresh after this request completes
    tokenRequest = null;
  }
}

async function fetchOAuthToken(): Promise<OAuthTokenResponse> {
  const res = await fetch("/api/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    // Important: don't let Next.js cache the token endpoint response
    cache: "no-store",
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type");

    let errorMessage = `Token request failed (${res.status})`;

    if (contentType?.includes("application/json")) {
      const err = await res.json().catch(() => null);

      if (err?.error) {
        errorMessage = err.error;
      }
    } else {
      const text = await res.text().catch(() => "");

      if (text) {
        errorMessage = text;
      }
    }

    throw new Error(errorMessage);
  }

  const response = (await res.json()) as OAuthTokenResponse;

  if (!response.access_token) {
    throw new Error("Token response did not contain an access token");
  }

  if (!response.expires_in || response.expires_in <= 0) {
    throw new Error("Token response contained an invalid expires_in value");
  }

  return response;
}

export function calculateTokenExpiry(expiresIn: number): number {
  return Date.now() + expiresIn * 1000;
}

export function isTokenValid(expiry: number | null): boolean {
  if (!expiry) {
    return false;
  }

  const remainingTime = expiry - Date.now();

  // Token must have more than the refresh buffer remaining
  return remainingTime > TOKEN_REFRESH_BUFFER_MS;
}

/**
 * Optional helper for logout / credential changes.
 */
export function clearOAuthTokenCache(): void {
  cachedToken = null;
  tokenExpiry = null;
}
