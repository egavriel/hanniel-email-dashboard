import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(): string {
  return process.env.SESSION_SECRET!;
}

function sign(value: string): string {
  const secret = getSessionSecret();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex");
  return `${value}.${signature}`;
}

function verify(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const value = signed.substring(0, lastDot);
  const expected = sign(value);
  if (signed !== expected) return null;
  return value;
}

export async function createSession(): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const signed = sign(token);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return false;
  return verify(session.value) !== null;
}

export function validatePassword(password: string): boolean {
  return password === process.env.DASHBOARD_PASSWORD;
}
