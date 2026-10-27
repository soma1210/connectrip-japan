import { NextResponse } from "next/server";
import { buildFormEmail, sendMail } from "@/lib/mailer";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import {
  PartnerStorageUnavailableError,
  createPartnerApplication,
} from "@/lib/data/partner-applications";
import { parsePartnerApplication } from "@/features/partner-survey/validation";
import { industryLabel } from "@/features/partner-survey/config/questions";
import { generateReceiptNo } from "@/features/partner-survey/receipt";
import { formatDate } from "@/features/guide-community/format";
import type { PartnerApplicationInput } from "@/features/partner-survey/types";

/** Give up on the notification after this long so a slow SMTP server never delays the partner. */
const NOTIFICATION_TIMEOUT_MS = 10_000;
/** Per client IP, per serverless instance (see src/lib/rate-limit.ts). */
const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

/** Single line, no control characters, short enough for a mail subject. */
function subjectSafe(value: string, max = 60) {
  const line = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

/**
 * Email Connectrip (CONTACT_TO_EMAIL) about a newly saved partner application.
 * Never throws: failures are logged and the application stays saved.
 */
async function notifyNewApplication(
  application: PartnerApplicationInput,
  receiptNo: string,
  adminUrl: string,
) {
  try {
    const { text, html } = buildFormEmail("新規パートナー応募", [
      { label: "受付番号", value: receiptNo },
      { label: "会社名・施設名", value: application.company_name },
      { label: "業種", value: industryLabel(application.industry) },
      { label: "エリア", value: application.area },
      { label: "担当者名", value: application.contact_name },
      { label: "メールアドレス", value: application.email },
      { label: "電話番号", value: application.phone },
      { label: "Webサイト・SNS", value: application.website_url },
      { label: "次回連絡の希望日", value: application.next_contact_date },
      { label: "応募日時", value: formatDate(new Date().toISOString(), true) },
    ]);
    const linkText = "管理画面で回答内容を確認する";

    const result = await Promise.race([
      sendMail({
        subject: `【新規パートナー応募】${subjectSafe(application.company_name)}｜Connectrip Japan`,
        text: `${text}\n\n${linkText}\n${adminUrl}`,
        html: `${html}<p style="font-family:sans-serif;margin:20px 0;"><a href="${adminUrl}" style="color:#162e4c;font-weight:bold;">${linkText} →</a></p>`,
        replyTo: application.email,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`timed out after ${NOTIFICATION_TIMEOUT_MS}ms`)), NOTIFICATION_TIMEOUT_MS),
      ),
    ]);
    if (result.sent) {
      console.log("[partner-applications] notification email sent", { messageId: result.messageId });
    } else {
      console.warn("[partner-applications] notification email skipped: SMTP not configured");
    }
  } catch (error) {
    console.error("[partner-applications] notification email failed", error);
  }
}

/**
 * Public endpoint for the partner survey (/partner/apply).
 *
 * 201 { success, receipt } on success (also for a repeated submission_id, which
 * returns the first receipt) · 400 bad JSON · 422 { errors } per field ·
 * 429 too many submissions · 503 when no database is connected in production.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (ip && isRateLimited(`partner:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs)) {
    return NextResponse.json({ success: false, message: "Too many submissions." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const result = parsePartnerApplication(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, errors: result.errors }, { status: 422 });
  }

  // Honeypot filled in: answer like a success so bots learn nothing, but store nothing.
  if (result.isSpam) {
    return NextResponse.json({ success: true, receipt: generateReceiptNo() }, { status: 201 });
  }

  const application = result.data;
  let saved;
  try {
    saved = await createPartnerApplication(application, result.submissionId);
  } catch (error) {
    console.error("[partner-applications] failed to save", error);
    const unavailable = error instanceof PartnerStorageUnavailableError;
    return NextResponse.json(
      { success: false, message: unavailable ? "Storage is not configured." : "Failed to save." },
      { status: unavailable ? 503 : 500 },
    );
  }

  // Saved. A repeated submission was already notified; otherwise try the email —
  // it can never fail the request.
  if (!saved.duplicate) {
    await notifyNewApplication(
      application,
      saved.receipt_no,
      `${new URL(request.url).origin}/admin/partner-applications/${saved.id}`,
    );
  }

  return NextResponse.json({ success: true, receipt: saved.receipt_no }, { status: 201 });
}
