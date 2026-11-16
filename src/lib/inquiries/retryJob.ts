import { createHash, timingSafeEqual } from "node:crypto";
import type { Notifier } from "@/lib/notify/email";
import type { Db } from "@/lib/pg";
import { deliverNotifications } from "./outbox";

/**
 * Notification retry job (Phase 2, 2026-11-16): `POST /api/internal/notifications/retry`
 * with `Authorization: Bearer <CRON_SECRET>`. Sends every due staff email
 * (pending, or failed and past its back-off) through the outbox claim, so it
 * can overlap with a form request or a manual resend without double sends.
 * Called on a schedule by netlify/functions/notification-retry.mts.
 *
 * Disabled (404) while CRON_SECRET is unset or shorter than 32 characters.
 */
const MIN_SECRET = 32;
const BATCH = 25;

function sameSecret(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function handleRetryJob(request: Request, deps: { db: Db | null; notifier: Notifier | null; secret: string | undefined }): Promise<Response> {
  const secret = deps.secret ?? "";
  if (secret.length < MIN_SECRET) return new Response(null, { status: 404 });
  const auth = request.headers.get("authorization") ?? "";
  const given = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!given || !sameSecret(given, secret)) return Response.json({ ok: false }, { status: 401 });
  if (!deps.db) return Response.json({ ok: false, reason: "database_not_configured" }, { status: 503 });
  try {
    const report = await deliverNotifications(deps.db, deps.notifier, { limit: BATCH, actor: "system:retry-job" });
    return Response.json({ ok: true, ...report, notifierConfigured: deps.notifier !== null });
  } catch {
    return Response.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }
}
