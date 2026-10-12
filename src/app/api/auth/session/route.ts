import { NextRequest, NextResponse } from "next/server";
import { setServerUser, clearServerUser } from "@/lib/userSession";
import { BC_API_BASE_URL, BC_TENANT_ID, BC_ENV_NAME, COMPANY_NAME } from "@/constants";

export const runtime = "nodejs";

async function authenticate(username: string, password: string) {
  const clientId = process.env.BC_CLIENT_ID || process.env.NEXT_PUBLIC_BC_CLIENT_ID || "";
  const clientSecret = process.env.BC_CLIENT_SECRET || process.env.NEXT_PUBLIC_BC_CLIENT_SECRET || "";
  const scope = process.env.BC_SCOPE || "https://api.businesscentral.dynamics.com/.default";
  const tokenRes = await fetch(`https://login.microsoftonline.com/${BC_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, scope }).toString(), cache: "no-store",
  });
  if (!tokenRes.ok) throw new Error("Failed to authenticate server with Microsoft");
  const token = await tokenRes.json();
  const url = `${BC_API_BASE_URL}/${BC_TENANT_ID}/${BC_ENV_NAME}/ODataV4/Velvotix_Login?Company=${COMPANY_NAME}`;
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ user: username, password }), cache: "no-store" });
  if (!res.ok) throw new Error("Business Central authentication failed");
  const body = await res.json();
  const result = JSON.parse(body.value);
  if (!result.success) throw new Error(result.message || "Invalid username or password");
  return { username, userId: username, SalesRep: result.SalesRep || "", ItemCat: result.itemCategoryFilter || "", location: result.Location || "" };
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    const policy = await authenticate(username, password);
    const response = NextResponse.json({ success: true });
    setServerUser(response, policy);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Authentication failed" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearServerUser(response);
  return response;
}
