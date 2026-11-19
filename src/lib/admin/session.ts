import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Db } from "@/lib/pg";

/**
 * Admin sessions and login throttling (Phase 1, 2026-11-16). Framework-free
 * so it can be tested; src/lib/admin-auth.ts connects it to cookies.
 *
 * Replaces the old cookie that held SHA-256(ADMIN_PASSWORD): it never
 * changed, never expired on the server and survived logout.
 *
 * - Login: constant-time password check; refused while the client IP has
 *   IP_MAX_FAILURES failures in the window, or the whole site has
 *   GLOBAL_MAX_FAILURES (slows down distributed guessing). Every attempt is
 *   recorded with a keyed hash of the IP, never the IP itself.
 * - Session: 32 random bytes in an HttpOnly cookie; only SHA-256(token) is
 *   stored. Ends after SESSION_ABSOLUTE_MS, or SESSION_IDLE_MS without use,
 *   on logout (row deleted), or when ADMIN_PASSWORD changes (fingerprint).
 */

export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;
const TOUCH_EVERY_MS = 5 * 60 * 1000;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const IP_MAX_FAILURES = 5;
export const GLOBAL_MAX_FAILURES = 50;
const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

export type SessionRow = { id: string; credentialFingerprint: string; createdAt: Date; lastSeenAt: Date; expiresAt: Date };

export type AdminAuthStore = {
  /** Failed logins since `since`: from this IP hash, and from everyone. */
  failuresSince(ipHash: string, since: Date): Promise<{ ip: number; all: number }>;
  recordAttempt(ipHash: string, succeeded: boolean, at: Date): Promise<void>;
  createSession(row: { tokenHash: string; credentialFingerprint: string; createdAt: Date; expiresAt: Date; ipHash: string; userAgent: string | null }): Promise<void>;
  findSession(tokenHash: string): Promise<SessionRow | null>;
  touchSession(id: string, at: Date): Promise<void>;
  deleteSession(tokenHash: string): Promise<void>;
  /** Removes expired sessions and old login attempts. */
  purge(now: Date): Promise<void>;
};

export type LoginOutcome =
  | { ok: true; token: string; expiresAt: Date }
  | { ok: false; reason: "invalid" | "locked" | "not_configured" | "unavailable" };

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Changes whenever ADMIN_PASSWORD changes; stored with each session. */
export function credentialFingerprint(password: string): string {
  return createHmac("sha256", password).update("connectrip-admin-session-v1").digest("hex");
}

/** Keyed hash of the client IP for the attempt log (the raw IP is never stored). */
export function ipHash(password: string, ip: string | null): string {
  return createHmac("sha256", sha256(`connectrip-admin-ip-v1:${password}`)).update(ip ?? "unknown").digest("hex");
}

export function passwordMatches(input: string, password: string): boolean {
  // Hash both sides first: equal lengths for timingSafeEqual, and the length of the password does not leak.
  return timingSafeEqual(Buffer.from(sha256(input), "hex"), Buffer.from(sha256(password), "hex"));
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function hashToken(token: string): string {
  return sha256(token);
}

export async function attemptLogin(args: {
  password: string;
  adminPassword: string | undefined;
  ip: string | null;
  userAgent: string | null;
  store: AdminAuthStore | null;
  now?: Date;
}): Promise<LoginOutcome> {
  const { adminPassword, store } = args;
  if (!adminPassword) return { ok: false, reason: "not_configured" };
  if (!store) return { ok: false, reason: "unavailable" };
  const now = args.now ?? new Date();
  const since = new Date(now.getTime() - LOGIN_WINDOW_MS);
  const who = ipHash(adminPassword, args.ip);
  try {
    const failures = await store.failuresSince(who, since);
    if (failures.ip >= IP_MAX_FAILURES || failures.all >= GLOBAL_MAX_FAILURES) {
      // Recorded as a failure too, so a locked client cannot keep probing the window open.
      await store.recordAttempt(who, false, now);
      return { ok: false, reason: "locked" };
    }
    const matches = passwordMatches(args.password, adminPassword);
    await store.recordAttempt(who, matches, now);
    if (!matches) return { ok: false, reason: "invalid" };

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_MS);
    await store.createSession({
      tokenHash: hashToken(token),
      credentialFingerprint: credentialFingerprint(adminPassword),
      createdAt: now,
      expiresAt,
      ipHash: who,
      userAgent: args.userAgent ? args.userAgent.slice(0, 300) : null,
    });
    await store.purge(now).catch(() => {});
    return { ok: true, token, expiresAt };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** The session behind a cookie token, or null. Expired / stale sessions are deleted. */
export async function validateSession(args: { token: string | undefined; adminPassword: string | undefined; store: AdminAuthStore | null; now?: Date }): Promise<{ sessionId: string } | null> {
  const { token, adminPassword, store } = args;
  if (!token || !adminPassword || !store || token.length > 200) return null;
  const now = args.now ?? new Date();
  const tokenHash = hashToken(token);
  try {
    const row = await store.findSession(tokenHash);
    if (!row) return null;
    const fingerprintOk = safeEqual(row.credentialFingerprint, credentialFingerprint(adminPassword));
    const expired = row.expiresAt.getTime() <= now.getTime() || now.getTime() - row.lastSeenAt.getTime() > SESSION_IDLE_MS;
    if (!fingerprintOk || expired) {
      await store.deleteSession(tokenHash);
      return null;
    }
    if (now.getTime() - row.lastSeenAt.getTime() > TOUCH_EVERY_MS) await store.touchSession(row.id, now);
    return { sessionId: row.id };
  } catch {
    return null;
  }
}

export async function endSession(token: string | undefined, store: AdminAuthStore | null): Promise<void> {
  if (!token || !store) return;
  await store.deleteSession(hashToken(token)).catch(() => {});
}

// --- Stores -------------------------------------------------------------------

type DbSession = { id: string; credential_fingerprint: string; created_at: Date | string; last_seen_at: Date | string; expires_at: Date | string };

export function postgresAdminAuthStore(db: Db): AdminAuthStore {
  return {
    async failuresSince(ipHashValue, since) {
      const result = await db.query<{ ip: number | string; all: number | string }>(
        `SELECT count(*) FILTER (WHERE ip_hash = $2) AS ip, count(*) AS all FROM admin_login_attempts WHERE succeeded = false AND attempted_at > $1`,
        [since.toISOString(), ipHashValue],
      );
      return { ip: Number(result.rows[0]?.ip ?? 0), all: Number(result.rows[0]?.all ?? 0) };
    },
    async recordAttempt(ipHashValue, succeeded, at) {
      await db.query(`INSERT INTO admin_login_attempts (ip_hash, succeeded, attempted_at) VALUES ($1, $2, $3)`, [ipHashValue, succeeded, at.toISOString()]);
    },
    async createSession(row) {
      await db.query(
        `INSERT INTO admin_sessions (token_hash, credential_fingerprint, created_at, last_seen_at, expires_at, ip_hash, user_agent) VALUES ($1, $2, $3, $3, $4, $5, $6)`,
        [row.tokenHash, row.credentialFingerprint, row.createdAt.toISOString(), row.expiresAt.toISOString(), row.ipHash, row.userAgent],
      );
    },
    async findSession(tokenHash) {
      const result = await db.query<DbSession>(`SELECT id, credential_fingerprint, created_at, last_seen_at, expires_at FROM admin_sessions WHERE token_hash = $1`, [tokenHash]);
      const r = result.rows[0];
      return r
        ? { id: r.id, credentialFingerprint: r.credential_fingerprint, createdAt: new Date(r.created_at), lastSeenAt: new Date(r.last_seen_at), expiresAt: new Date(r.expires_at) }
        : null;
    },
    async touchSession(id, at) {
      await db.query(`UPDATE admin_sessions SET last_seen_at = $2 WHERE id = $1`, [id, at.toISOString()]);
    },
    async deleteSession(tokenHash) {
      await db.query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [tokenHash]);
    },
    async purge(now) {
      await db.query(`DELETE FROM admin_sessions WHERE expires_at <= $1 OR last_seen_at <= $2`, [now.toISOString(), new Date(now.getTime() - SESSION_IDLE_MS).toISOString()]);
      await db.query(`DELETE FROM admin_login_attempts WHERE attempted_at <= $1`, [new Date(now.getTime() - ATTEMPT_RETENTION_MS).toISOString()]);
    },
  };
}

/** In-memory store: local development without a database only (one process, lost on restart). */
export function memoryAdminAuthStore(): AdminAuthStore {
  const attempts: { ipHash: string; succeeded: boolean; at: number }[] = [];
  const sessions = new Map<string, SessionRow & { tokenHash: string }>();
  return {
    async failuresSince(ipHashValue, since) {
      const recent = attempts.filter((a) => !a.succeeded && a.at > since.getTime());
      return { ip: recent.filter((a) => a.ipHash === ipHashValue).length, all: recent.length };
    },
    async recordAttempt(ipHashValue, succeeded, at) {
      attempts.push({ ipHash: ipHashValue, succeeded, at: at.getTime() });
    },
    async createSession(row) {
      sessions.set(row.tokenHash, { id: randomBytes(16).toString("hex"), tokenHash: row.tokenHash, credentialFingerprint: row.credentialFingerprint, createdAt: row.createdAt, lastSeenAt: row.createdAt, expiresAt: row.expiresAt });
    },
    async findSession(tokenHash) {
      return sessions.get(tokenHash) ?? null;
    },
    async touchSession(id, at) {
      for (const s of sessions.values()) if (s.id === id) s.lastSeenAt = at;
    },
    async deleteSession(tokenHash) {
      sessions.delete(tokenHash);
    },
    async purge(now) {
      for (const [k, s] of sessions) if (s.expiresAt <= now || now.getTime() - s.lastSeenAt.getTime() > SESSION_IDLE_MS) sessions.delete(k);
      const cutoff = now.getTime() - ATTEMPT_RETENTION_MS;
      for (let i = attempts.length - 1; i >= 0; i--) if (attempts[i].at <= cutoff) attempts.splice(i, 1);
    },
  };
}
