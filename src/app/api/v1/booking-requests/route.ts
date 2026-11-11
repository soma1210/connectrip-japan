import { NextResponse } from "next/server";
import type { BookingRequestHoneypotResponse } from "@/contracts/bookingRequest";
import { bookingGasFromEnv } from "@/lib/booking-request/gas";
import { honeypotTripped, validateBookingRequest } from "@/lib/booking-request/rules";
import { submitBookingRequest } from "@/lib/booking-request/submit";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

/**
 * Booking Request Contract 0.3.
 * Saves nothing unless the booking Apps Script confirms a sheet row.
 * Guide applications, interviews and the legacy reservation mail route are not involved.
 */
export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const ip = clientIp(request);
  if (isRateLimited(`booking-request:${ip ?? "unknown"}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs)) {
    return NextResponse.json({ ok: false, kind: "rate_limited" }, { status: 429 });
  }
  if (honeypotTripped(raw)) {
    const body: BookingRequestHoneypotResponse = { ok: true, accepted: false };
    return NextResponse.json(body);
  }

  const validated = validateBookingRequest(raw, Date.now(), request.headers.get("idempotency-key"));
  if (!validated.ok) return NextResponse.json(validated.body, { status: validated.status });

  const gas = bookingGasFromEnv();
  if (!gas) return NextResponse.json({ ok: false, kind: "server" }, { status: 503 });

  try {
    const result = await submitBookingRequest(validated.booking, gas);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ ok: false, kind: "server" }, { status: 503 });
  }
}
