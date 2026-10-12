import { NextRequest, NextResponse } from "next/server";
import { getServerUser, setServerUser } from "@/lib/userSession";
import {
  cacheKey,
  dedupe,
  getCached,
  invalidateBCCache,
  runBC,
  setCached,
  ttlForPath,
} from "@/lib/bcServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BC_API_BASE =
  process.env.BC_API_BASE_URL ||
  "https://api.businesscentral.dynamics.com/v2.0";
const BC_TENANT = process.env.BC_TENANT_ID || "";
const BC_COMPANY = process.env.BC_COMPANY_ID || "";
const BC_CLIENT_ID = process.env.BC_CLIENT_ID || "";
const BC_SECRET = process.env.BC_CLIENT_SECRET || "";
const BC_SCOPE =
  process.env.BC_SCOPE || "https://api.businesscentral.dynamics.com/.default";
const BC_ENV =
  process.env.BC_ENV_NAME || process.env.NEXT_ENV_NAME || "production";
const COMPANY_NAME = process.env.NEXT_COMP_NAME || "My Company";

let cachedToken: { value: string; expiresAt: number } | null = null;
let tokenRequest: Promise<string> | null = null;

async function getServerToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000)
    return cachedToken.value;
  if (tokenRequest) return tokenRequest;
  tokenRequest = (async () => {
    const res = await fetch(
      `https://login.microsoftonline.com/${BC_TENANT}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: BC_CLIENT_ID,
          client_secret: BC_SECRET,
          scope: BC_SCOPE,
        }).toString(),
        cache: "no-store",
      },
    );
    if (!res.ok)
      throw new Error(`OAuth failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token as string;
  })();
  try {
    return await tokenRequest;
  } finally {
    tokenRequest = null;
  }
}

function escapeOData(value: string) {
  return value.replace(/'/g, "''");
}

function appendFilter(sp: URLSearchParams, filter: string) {
  const existing = sp.get("$filter");
  sp.set("$filter", existing ? `(${existing}) and (${filter})` : filter);
}

function salesRepFilter(user: ReturnType<typeof getServerUser>) {
  const codes = (user?.SalesRep || "")
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!codes.length) return null;
  return codes
    .map((code) => `salespersonCode eq '${escapeOData(code)}'`)
    .join(" or ");
}

function categoryFilter(user: ReturnType<typeof getServerUser>) {
  const categories = (user?.ItemCat || "")
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!categories.length) return null;
  return categories
    .map((code) => `itemCategoryCode eq '${escapeOData(code)}'`)
    .join(" or ");
}

function enforceUserScope(
  path: string,
  sp: URLSearchParams,
  user: ReturnType<typeof getServerUser>,
) {
  const p = path.toLowerCase();

  if (p.includes("velvotixcustomers")) {
    if (!user?.username) return "Customer scope is unavailable";
    appendFilter(sp, `userName eq '${escapeOData(user.username)}'`);
  }

  if (p.includes("soheaderapi")) {
    const filter = salesRepFilter(user);
    if (!filter) return "Sales-order scope is unavailable";
    appendFilter(sp, `(${filter})`);
  }

  if (p === "/items" || p.startsWith("/items?") || p.includes("/items?")) {
    const filter = categoryFilter(user);
    if (!filter) return "Item-category scope is unavailable";
    appendFilter(sp, `(${filter})`);
  }

  if (p.includes("velvotixitems")) {
    const filter = categoryFilter(user);
    if (!filter) return "Inventory scope is unavailable";
    appendFilter(sp, `(${filter})`);
    if (user?.location) {
      const requested = sp.get("$filter") || "";
      const escapedLocation = escapeOData(user.location);
      // A user cannot request inventory for a different assigned location.
      if (
        requested.includes("locationCode eq") &&
        !requested.includes(`locationCode eq '${escapedLocation}'`)
      ) {
        return "Location is outside the user scope";
      }
      appendFilter(sp, `locationCode eq '${escapedLocation}'`);
    }
  }

  if (
    p === "/locations" ||
    p.startsWith("/locations?") ||
    p.includes("/locations?")
  ) {
    if (user?.location)
      appendFilter(sp, `code eq '${escapeOData(user.location)}'`);
  }

  return null;
}

function buildBCUrl(path: string, sp: URLSearchParams): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const target = sp.get("target") || "api";
  const forward = new URLSearchParams();
  for (const [key, value] of sp.entries())
    if (!["path", "target"].includes(key)) forward.append(key, value);

  let base: string;
  if (target === "odata") {
    base = `${BC_API_BASE}/${BC_TENANT}/${BC_ENV}/ODataV4/Company('${encodeURIComponent(COMPANY_NAME)}')`;
  } else if (target === "odata-root") {
    base = `${BC_API_BASE}/${BC_TENANT}/${BC_ENV}/ODataV4`;
  } else {
    base = `${BC_API_BASE}/${BC_TENANT}/${BC_ENV}/api/v2.0/companies(${BC_COMPANY})`;
  }
  const qs = forward.toString();
  return `${base}${cleanPath}${qs ? `?${qs}` : ""}`;
}

function retryDelay(attempt: number, response: Response) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  return Math.min(750 * 2 ** attempt, 8000) + Math.floor(Math.random() * 300);
}

async function fetchBC(url: string, method: string, body?: string) {
  const transient = new Set([408, 429, 502, 503, 504]);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const token = await getServerToken();
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(method === "GET" ? { "Data-Access-Intent": "ReadOnly" } : {}),
      },
      body,
      cache: "no-store",
    });
    if (!transient.has(response.status) || attempt === 3) return response;
    await new Promise((resolve) =>
      setTimeout(resolve, retryDelay(attempt, response)),
    );
  }
  throw new Error("Business Central request failed after retries");
}

async function handler(req: NextRequest, method: string) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "";
  if (!path)
    return NextResponse.json(
      { error: "Missing ?path= param" },
      { status: 400 },
    );

  const user = getServerUser(req);
  if (!user)
    return NextResponse.json(
      { error: "Authenticated user session required" },
      { status: 401 },
    );

  const scopeError = enforceUserScope(path, searchParams, user);
  if (scopeError)
    return NextResponse.json({ error: scopeError }, { status: 403 });

  const bcUrl = buildBCUrl(path, searchParams);
  const key = cacheKey(method, bcUrl);
  const isGet = method === "GET";

  try {
    if (isGet) {
      const cached = await getCached<unknown>(key);
      if (cached !== undefined)
        return NextResponse.json(cached, { headers: { "X-BC-Cache": "HIT" } });
    }

    const body =
      method !== "GET" && method !== "DELETE" ? await req.text() : undefined;
    const result = await runBC(key, async () => {
      const response = await fetchBC(bcUrl, method, body);
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
      return { status: response.status, contentType, data };
    });

    if (result.status >= 200 && result.status < 300 && isGet) {
      await setCached(key, result.data, ttlForPath(path));
    }
    if (result.status >= 200 && result.status < 300 && !isGet)
      invalidateBCCache();

    let response: NextResponse;
    if (typeof result.data === "string") {
      response = new NextResponse(result.data, {
        status: result.status,
        headers: { "Content-Type": result.contentType || "text/plain" },
      });
    } else {
      response = NextResponse.json(result.data, { status: result.status });
    }
    if (result.status >= 200 && result.status < 400)
      setServerUser(response, user);
    return response;
  } catch (err: any) {
    console.error("[BC Proxy]", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Business Central request failed" },
      { status: 502 },
    );
  }
}

export const GET = (req: NextRequest) => handler(req, "GET");
export const POST = (req: NextRequest) => handler(req, "POST");
export const PATCH = (req: NextRequest) => handler(req, "PATCH");
export const DELETE = (req: NextRequest) => handler(req, "DELETE");
