import { bookingStoreFromEnv, handleBookingRequest } from "@/lib/booking-request/handler";

export const runtime = "nodejs";

/**
 * Booking Request Contract 0.3.
 * Saves nothing unless Postgres commits the request (inquiries, kind
 * 'booking_request'); then the staff email goes out through the outbox
 * (src/lib/booking-request/handler.ts). The request is never confirmed here.
 * Guide applications, interviews and the legacy reservation mail route are not involved.
 */
export async function POST(request: Request) {
  return handleBookingRequest(request, { store: bookingStoreFromEnv() });
}
