import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "admin_session";

function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function verifyAdminPassword(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password) && input === password;
}

export async function isAdminAuthenticated() {
  // Read cookies first so every page behind this check renders per request.
  // Otherwise a build without ADMIN_PASSWORD prerenders /admin as a static
  // redirect to /admin/login, which loops with the login page once signed in.
  const cookieStore = await cookies();
  const token = expectedToken();
  if (!token) return false;
  return cookieStore.get(COOKIE_NAME)?.value === token;
}

export async function setAdminSession() {
  const token = expectedToken();
  if (!token) throw new Error("ADMIN_PASSWORD is not configured.");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
