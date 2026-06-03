import { NextRequest, NextResponse } from 'next/server';

const BC_API_BASE    = process.env.BC_API_BASE_URL    || 'https://api.businesscentral.dynamics.com/v2.0';
const BC_TENANT      = process.env.BC_TENANT_ID       || '';
const BC_COMPANY     = process.env.BC_COMPANY_ID      || '';
const BC_CLIENT_ID   = process.env.BC_CLIENT_ID       || '';
const BC_SECRET      = process.env.BC_CLIENT_SECRET   || '';
const BC_SCOPE       = process.env.BC_SCOPE           || 'https://api.businesscentral.dynamics.com/.default';

// In-memory token cache (per serverless instance)
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getServerToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const res = await fetch(
    `https://login.microsoftonline.com/${BC_TENANT}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: BC_CLIENT_ID,
        client_secret: BC_SECRET,
        scope: BC_SCOPE,
      }).toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

function buildBCUrl(path: string, sp: URLSearchParams): string {
  // Support both /api/custom/v2.0 and standard OData paths
  const base = `${BC_API_BASE}/${BC_TENANT}/Sandbox/api/custom/v2.0/companies(${BC_COMPANY})`;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const fwd = new URLSearchParams();
  for (const key of ['$filter', '$top', '$skip', '$orderby', '$count', '$select', '$expand', 'filter']) {
    const val = sp.get(key);
    if (val) fwd.set(key, val);
  }

  const qs = fwd.toString();
  return `${base}${cleanPath}${qs ? `?${qs}` : ''}`;
}

async function handler(req: NextRequest, method: string) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '';

  if (!path) {
    return NextResponse.json({ error: 'Missing ?path= param' }, { status: 400 });
  }

  try {
    const token = await getServerToken();
    const bcUrl = buildBCUrl(path, searchParams);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      body = await req.text();
    }

    const bcRes = await fetch(bcUrl, { method, headers, body });

    // Return raw BC response (including errors)
    const contentType = bcRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await bcRes.json();
      return NextResponse.json(data, { status: bcRes.status });
    }

    const text = await bcRes.text();
    return new NextResponse(text, {
      status: bcRes.status,
      headers: { 'Content-Type': contentType || 'text/plain' },
    });
  } catch (err: any) {
    console.error('[BC Proxy]', err.message);
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

export const GET    = (req: NextRequest) => handler(req, 'GET');
export const POST   = (req: NextRequest) => handler(req, 'POST');
export const PATCH  = (req: NextRequest) => handler(req, 'PATCH');
export const DELETE = (req: NextRequest) => handler(req, 'DELETE');
