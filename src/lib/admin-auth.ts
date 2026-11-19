import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { dbFromEnv } from "@/lib/pg";
import {
  attemptLogin,
  endSession,
  memoryAdminAuthStore,
  postgresAdminAuthStore,
  validateSession,
  type AdminAuthStore,
  type LoginOutcome,
} from "@/lib/admin/session";

/**
 * Admin authentication for /admin (Phase 1, 2026-11-16). The rules live in
 * src/lib/admin/session.ts; this file connects them to cookies and headers.
 *
 * Every protected page and every Server Action calls `requireAdmin()` itself:
 * Server Actions are public POST endpoints and layouts do not guard nested
 * routes (Next.js authentication guide), so the layout check alone is not
 * enough.
 *
 * Sessions are stored in Postgres (admin_sessions). Without POSTGRES_URL,
 * local development keeps them in memory; production refuses to log in.
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";
// __Host- : Secure, Path=/, no Domain: the cookie cannot be set or shadowed by a subdomain.
const COOKIE_NAME = IS_PRODUCTION ? "__Host-cj_admin" : "cj_admin";
const LEGACY_COOKIE = "admin_session";
// Strict: the cookie is never sent on cross-site requests (an outside link lands on /admin/login, which forwards when logged in).
const COOKIE_OPTIONS = { httpOnly: true, secure: IS_PRODUCTION, sameSite: "strict", path: "/" } as const;

const globalForAdmin = globalThis as unknown as { __cjAdminMemoryStore?: AdminAuthStore };

function authStore(): AdminAuthStore | null {
  const db = dbFromEnv();
  if (db) return postgresAdminAuthStore(db);
  if (IS_PRODUCTION) return null;
  return (globalForAdmin.__cjAdminMemoryStore ??= memoryAdminAuthStore());
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** The current admin session (memoised per request), or null. */
export const getAdminSession = cache(async () => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return validateSession({ token, adminPassword: process.env.ADMIN_PASSWORD, store: authStore() });
});

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

/** Call first in every admin page, data loader and Server Action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

/**
 * Like `requireAdmin()`, and returns who acts, for the history log
 * ("admin:" + the first 8 characters of the session id; there is one shared
 * admin login, so the session is the finest identity available).
 */
export async function requireAdminActor(): Promise<string> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return `admin:${session.sessionId.replace(/-/g, "").slice(0, 8)}`;
}

function clientIpFrom(h: Headers): string | null {
  return h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

export type AdminLoginResult = "ok" | Extract<LoginOutcome, { ok: false }>["reason"];

/** Server Action only (sets the cookie). */
export async function loginAdmin(password: string): Promise<AdminLoginResult> {
  const h = await headers();
  const outcome = await attemptLogin({
    password,
    adminPassword: process.env.ADMIN_PASSWORD,
    ip: clientIpFrom(h),
    userAgent: h.get("user-agent"),
    store: authStore(),
  });
  if (!outcome.ok) return outcome.reason;
  const jar = await cookies();
  jar.delete(LEGACY_COOKIE);
  jar.set(COOKIE_NAME, outcome.token, { ...COOKIE_OPTIONS, expires: outcome.expiresAt });
  return "ok";
}

/** Server Action only: ends the session on the server and clears the cookie. */
export async function logoutAdmin(): Promise<void> {
  const jar = await cookies();
  await endSession(jar.get(COOKIE_NAME)?.value, authStore());
  // Overwritten with the same attributes: a __Host- cookie is only replaced by a Secure, Path=/ Set-Cookie.
  jar.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  jar.delete(LEGACY_COOKIE);
}
