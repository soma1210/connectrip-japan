import { NextResponse } from "next/server";
import { requestInterview } from "@/lib/interviews";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { applicantCodeFor } from "@/features/guide-interviews/messages";
import { applicantError, applicantFailure } from "../respond";

const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

/**
 * Request an interview time: holds the slot as PENDING_APPROVAL.
 *
 * POST { token, date: "YYYY-MM-DD", time: "HH:mm" } (Japan time)
 * → 201 { success, view } · 404 bad link · 410 expired · 409 taken / already
 * requested · 422 against the booking rules · 429 · 503 calendar or storage down.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (ip && isRateLimited(`interview-request:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs)) {
    return applicantError("RATE_LIMITED");
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { token, date, time } = body ?? {};
  if (typeof token !== "string") return applicantError("INVALID_TOKEN");
  if (typeof date !== "string" || typeof time !== "string") return applicantError("INVALID_TIME");

  try {
    const result = await requestInterview(token, date, time, new URL(request.url).origin);
    if (!result.ok) return applicantError(applicantCodeFor(result.code));
    return NextResponse.json({ success: true, view: result.view }, { status: 201 });
  } catch (error) {
    return applicantFailure("request", error);
  }
}
