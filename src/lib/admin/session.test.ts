/**
 * Admin session / login throttling checks (Phase 1, 2026-11-16).
 * Run: `bun src/lib/admin/session.test.ts`. Postgres store on in-memory PGlite, plus the dev memory store.
 */
import assert from "node:assert/strict";
import { migratedTestDb } from "@/lib/testing/pgliteDb";
import {
  attemptLogin,
  endSession,
  GLOBAL_MAX_FAILURES,
  hashToken,
  IP_MAX_FAILURES,
  LOGIN_WINDOW_MS,
  memoryAdminAuthStore,
  passwordMatches,
  postgresAdminAuthStore,
  SESSION_ABSOLUTE_MS,
  SESSION_IDLE_MS,
  validateSession,
  type AdminAuthStore,
} from "./session";

const PASSWORD = "test-only-admin-password-123";
const { db } = await migratedTestDb();

assert.equal(passwordMatches(PASSWORD, PASSWORD), true);
assert.equal(passwordMatches(PASSWORD.slice(0, -1), PASSWORD), false);
assert.equal(passwordMatches("", PASSWORD), false);
console.log("ok  password check (hashed, constant-time comparison)");

for (const [name, makeStore] of [["postgres", () => postgresAdminAuthStore(db)], ["memory", memoryAdminAuthStore]] as [string, () => AdminAuthStore][]) {
  const store = makeStore();
  const t0 = new Date("2026-11-16T10:00:00Z");
  const at = (ms: number) => new Date(t0.getTime() + ms);
  const login = (password: string, ip: string, now: Date) => attemptLogin({ password, adminPassword: PASSWORD, ip, userAgent: "test", store, now });

  // Not configured / no store.
  assert.deepEqual(await attemptLogin({ password: PASSWORD, adminPassword: undefined, ip: "1.1.1.1", userAgent: null, store }), { ok: false, reason: "not_configured" });
  assert.deepEqual(await attemptLogin({ password: PASSWORD, adminPassword: PASSWORD, ip: "1.1.1.1", userAgent: null, store: null }), { ok: false, reason: "unavailable" });

  // Success → a session; the token itself is never stored.
  const ok = await login(PASSWORD, "10.0.0.1", t0);
  assert.ok(ok.ok);
  const token = ok.token;
  assert.ok(token.length >= 43);
  assert.deepEqual(await validateSession({ token, adminPassword: PASSWORD, store, now: at(60_000) }), { sessionId: (await store.findSession(hashToken(token)))!.id });
  if (name === "postgres") {
    const dump = JSON.stringify((await db.query(`SELECT * FROM admin_sessions`)).rows);
    assert.ok(!dump.includes(token), "only the hash of the token is in the database");
    const attempts = JSON.stringify((await db.query(`SELECT * FROM admin_login_attempts`)).rows);
    assert.ok(!attempts.includes("10.0.0.1"), "the raw IP is not stored");
  }

  // Wrong / forged tokens.
  assert.equal(await validateSession({ token: `${token}x`, adminPassword: PASSWORD, store, now: at(1000) }), null);
  assert.equal(await validateSession({ token: undefined, adminPassword: PASSWORD, store, now: at(1000) }), null);
  // The old cookie value (SHA-256 of the password) is not a session any more.
  assert.equal(await validateSession({ token: hashToken(PASSWORD), adminPassword: PASSWORD, store, now: at(1000) }), null);

  // Idle timeout (with activity it stays alive), absolute timeout, password change, logout.
  const s1 = await login(PASSWORD, "10.0.0.2", t0);
  assert.ok(s1.ok);
  assert.ok(await validateSession({ token: s1.token, adminPassword: PASSWORD, store, now: at(SESSION_IDLE_MS - 60_000) }));
  assert.ok(await validateSession({ token: s1.token, adminPassword: PASSWORD, store, now: at(2 * SESSION_IDLE_MS - 120_000) }), "used recently: still valid");
  assert.equal(await validateSession({ token: s1.token, adminPassword: PASSWORD, store, now: at(4 * SESSION_IDLE_MS) }), null, "idle too long");
  assert.equal(await store.findSession(hashToken(s1.token)), null, "expired session deleted");

  let s2 = await login(PASSWORD, "10.0.0.3", t0);
  assert.ok(s2.ok);
  let now = t0.getTime();
  while (now < t0.getTime() + SESSION_ABSOLUTE_MS - SESSION_IDLE_MS / 2) {
    now += SESSION_IDLE_MS / 2;
    assert.ok(await validateSession({ token: s2.token, adminPassword: PASSWORD, store, now: new Date(now) }));
  }
  assert.equal(await validateSession({ token: s2.token, adminPassword: PASSWORD, store, now: at(SESSION_ABSOLUTE_MS + 1) }), null, "absolute limit, even when active");

  s2 = await login(PASSWORD, "10.0.0.3", t0);
  assert.ok(s2.ok);
  assert.equal(await validateSession({ token: s2.token, adminPassword: "a-new-password-after-rotation", store, now: at(1000) }), null, "password change ends sessions");

  const s3 = await login(PASSWORD, "10.0.0.4", t0);
  assert.ok(s3.ok);
  await endSession(s3.token, store);
  assert.equal(await validateSession({ token: s3.token, adminPassword: PASSWORD, store, now: at(1000) }), null, "logout ends the session on the server");

  // Per-IP lock: 5 failures → locked, even with the right password; other IPs unaffected; unlocked after the window.
  for (let i = 0; i < IP_MAX_FAILURES; i++) assert.deepEqual(await login("wrong", "10.1.1.1", at(i * 1000)), { ok: false, reason: "invalid" });
  assert.deepEqual(await login(PASSWORD, "10.1.1.1", at(10_000)), { ok: false, reason: "locked" });
  assert.ok((await login(PASSWORD, "10.2.2.2", at(10_000))).ok, "another IP can still log in");
  // Attempts while locked count as failures: a client that keeps trying stays locked after the first failures expire.
  for (let i = 1; i <= IP_MAX_FAILURES; i++) assert.deepEqual(await login(PASSWORD, "10.1.1.1", at(10_000 + i * 1000)), { ok: false, reason: "locked" });
  assert.deepEqual(await login(PASSWORD, "10.1.1.1", at(5_000 + LOGIN_WINDOW_MS)), { ok: false, reason: "locked" }, "attempts while locked keep it locked");
  assert.ok((await login(PASSWORD, "10.1.1.1", at(10_000 + 2 * LOGIN_WINDOW_MS))).ok, "unlocked after the window");

  // Global lock against distributed guessing.
  const g0 = t0.getTime() + 10 * LOGIN_WINDOW_MS;
  for (let i = 0; i < GLOBAL_MAX_FAILURES; i++) await login("wrong", `10.3.${Math.floor(i / 4)}.${i % 4}`, new Date(g0 + i));
  assert.deepEqual(await login(PASSWORD, "10.9.9.9", new Date(g0 + 1000)), { ok: false, reason: "locked" });
  assert.ok((await login(PASSWORD, "10.9.9.9", new Date(g0 + LOGIN_WINDOW_MS + 1000))).ok);

  // Purge removes expired sessions.
  await store.purge(new Date(g0 + 3 * SESSION_ABSOLUTE_MS));
  if (name === "postgres") assert.equal(Number((await db.query<{ n: number }>(`SELECT count(*) AS n FROM admin_sessions`)).rows[0].n), 0);
  console.log(`ok  ${name} store: random session token (hash only stored), idle 2h / absolute 12h, password change and logout end sessions, per-IP (5/15min) and global (50/15min) lock`);
}
console.log("\nall admin session checks passed");
