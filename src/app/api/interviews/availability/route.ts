import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/interviews";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { applicantError, applicantFailure } from "../respond";

const RATE_LIMIT = { limit: 30, windowMs: 60_000 };

/**
 * Bookable interview slots for a booking link.
 *
 * POST { token } (in the body, so the token stays out of query-string logs)
 * → 200 { success, view, days: [{ date: "YYYY-MM-DD", slots: ["HH:mm", …] }] }.
 * `days` holds only free start times in Japan time — never anything from the
 * interviewer's calendar. It is empty unless the link is waiting for a choice.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (ip && isRateLimited(`interview-availability:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs)) {
    return applicantError("RATE_LIMITED");
  }

  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  if (typeof body?.token !== "string") return applicantError("INVALID_TOKEN");

  try {
    const { view, days } = await getAvailability(body.token);
    if (view.state === "invalid") return applicantError("INVALID_TOKEN");
    return NextResponse.json({ success: true, view, days });
  } catch (error) {
    return applicantFailure("availability", error);
  }
}
