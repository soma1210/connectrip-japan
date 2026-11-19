import { handleInquiry, inquiryStoreFromEnv } from "@/lib/inquiry/handler";

export const runtime = "nodejs";

/** Inquiry form: stored in Postgres (inquiries, kind 'contact'), then the staff email goes out through the outbox. See src/lib/inquiry/handler.ts. */
export async function POST(request: Request) {
  return handleInquiry(request, { store: inquiryStoreFromEnv() });
}
