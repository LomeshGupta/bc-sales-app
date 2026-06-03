import { NextResponse } from 'next/server';

// This route runs on the SERVER — no CORS issue.
// The browser calls /api/auth/token; the server calls Microsoft.
export async function POST() {
  const tenantId = process.env.BC_TENANT_ID || process.env.NEXT_PUBLIC_BC_TENANT_ID;
  const clientId = process.env.BC_CLIENT_ID || process.env.NEXT_PUBLIC_BC_CLIENT_ID;
  const clientSecret = process.env.BC_CLIENT_SECRET || process.env.NEXT_PUBLIC_BC_CLIENT_SECRET;
  const scope = process.env.BC_SCOPE || process.env.NEXT_PUBLIC_BC_SCOPE ||
    'https://api.businesscentral.dynamics.com/.default';

  if (!tenantId || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Missing BC credentials in environment variables' },
      { status: 500 }
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });

  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Token] Microsoft error:', res.status, errorText);
      return NextResponse.json(
        { error: 'Failed to obtain OAuth token', detail: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Token] Network error:', err.message);
    return NextResponse.json(
      { error: 'Token request failed', detail: err.message },
      { status: 502 }
    );
  }
}
