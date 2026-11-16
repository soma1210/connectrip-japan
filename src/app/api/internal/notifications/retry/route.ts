import { handleRetryJob } from "@/lib/inquiries/retryJob";
import { notifierFromEnv } from "@/lib/notify/email";
import { dbFromEnv } from "@/lib/pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Notification retry job (src/lib/inquiries/retryJob.ts). Bearer CRON_SECRET; 404 while it is not set. */
export async function POST(request: Request) {
  return handleRetryJob(request, { db: dbFromEnv(), notifier: notifierFromEnv(), secret: process.env.CRON_SECRET });
}
