// Admin session cookie and the admin allowlist (server only).
//
// Who may sign in: the Google accounts in ADMIN_EMAIL_1 / ADMIN_EMAIL_2, and
// nobody else. The session is a cookie signed with ADMIN_SESSION_SECRET; the
// allowlist is checked again on every request, so removing an address from the
// environment locks that person out without waiting for the cookie to expire.
//
// Local development only: ADMIN_DEV_PASSWORD signs in without Google. It is
// ignored unless NODE_ENV is "development" (`next dev`), so builds for Netlify,
// deploy previews included, never accept it.

import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export type AdminSession =
  | { method: "google"; email: string }
  | { method: "dev-password" };

const isDevelopment = process.env.NODE_ENV === "development";

/** Lower-cased addresses from ADMIN_EMAIL_1 / ADMIN_EMAIL_2 (empty ones dropped). */
export function adminEmails(): string[] {
  return [process.env.ADMIN_EMAIL_1, process.env.ADMIN_EMAIL_2]
    .map((email) => email?.trim().toLowerCase() ?? "")
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string) {
  return adminEmails().includes(email.trim().toLowerCase());
}

/** The development-only password, or null when it must not be offered. */
export function devPassword(): string | null {
  return isDevelopment ? process.env.ADMIN_DEV_PASSWORD || null : null;
}

// Without ADMIN_SESSION_SECRET, `next dev` signs with a per-process key
// (everyone is signed out on restart); anywhere else, nobody can sign in.
const devFallbackSecret = isDevelopment ? crypto.randomBytes(32).toString("hex") : null;

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  if (secret.length >= 32) return secret;
  return devFallbackSecret;
}

export function isSessionConfigured() {
  return sessionSecret() !== null;
}

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Value of the session cookie, or null when it is missing, forged, expired or no longer allowed. */
export async function readSession(): Promise<AdminSession | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;

  let data: { m?: string; e?: string; x?: number };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data.x !== "number" || data.x * 1000 < Date.now()) return null;

  if (data.m === "google" && typeof data.e === "string" && isAllowedAdminEmail(data.e)) {
    return { method: "google", email: data.e };
  }
  if (data.m === "dev-password" && devPassword()) return { method: "dev-password" };
  return null;
}

/** Call only from a Route Handler or Server Action (cookies cannot be set while rendering). */
export async function writeSession(session: AdminSession) {
  const secret = sessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  const payload = Buffer.from(
    JSON.stringify({
      m: session.method,
      e: session.method === "google" ? session.email : undefined,
      x: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    }),
  ).toString("base64url");
  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    secure: !isDevelopment,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}

/** Constant-time comparison for the development password form. */
export function matchesDevPassword(input: string) {
  const password = devPassword();
  if (!password) return false;
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(password).digest();
  return crypto.timingSafeEqual(a, b);
}
