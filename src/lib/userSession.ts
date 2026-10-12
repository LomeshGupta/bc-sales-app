import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export interface ServerUserPolicy {
  username: string;
  SalesRep?: string;
  ItemCat?: string;
  location?: string;
  userId?: string;
  issuedAt: number;
}

const COOKIE = "bc_user_session";
const MAX_AGE = 30 * 60;

function secret(): string {
  const value = process.env.BC_SESSION_SECRET || process.env.BC_CLIENT_SECRET;
  if (!value || value.length < 32) throw new Error("BC_SESSION_SECRET must be configured with at least 32 characters");
  return value;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function encode(policy: ServerUserPolicy): string {
  const payload = Buffer.from(JSON.stringify(policy)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(value: string): ServerUserPolicy | null {
  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return null;
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const policy = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ServerUserPolicy;
    if (!policy.username || !policy.issuedAt) return null;
    if (Date.now() - policy.issuedAt > MAX_AGE * 1000) return null;
    return policy;
  } catch {
    return null;
  }
}

export function getServerUser(request: NextRequest): ServerUserPolicy | null {
  const value = request.cookies.get(COOKIE)?.value;
  return value ? decode(value) : null;
}

export function setServerUser(response: NextResponse, policy: Omit<ServerUserPolicy, "issuedAt">) {
  response.cookies.set(COOKIE, encode({ ...policy, issuedAt: Date.now() }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearServerUser(response: NextResponse) {
  response.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}

