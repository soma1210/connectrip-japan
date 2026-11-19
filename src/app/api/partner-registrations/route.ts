import { NextResponse } from "next/server";
import { buildFormEmail, sendMail } from "@/lib/mailer";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import {
  PartnerRegistrationStorageUnavailableError,
  createPartnerRegistration,
} from "@/lib/data/partner-registrations";
import { parsePartnerRegistration } from "@/features/partner-registration/validation";
import {
  BUSINESS_CATEGORIES,
  CURRENT_CHALLENGES,
  CUSTOMER_TYPES,
  INBOUND_EXPERIENCE,
  INTERESTED_COLLABORATIONS,
  OTHER,
  optionLabel,
  optionLabels,
} from "@/features/partner-registration/config";
import { formatDate } from "@/features/guide-community/format";
import type { PartnerRegistrationInput } from "@/features/partner-registration/types";

/** Give up on the notification after this long so a slow SMTP server never delays the respondent. */
const NOTIFICATION_TIMEOUT_MS = 10_000;
/** Per client IP, per serverless instance (see src/lib/rate-limit.ts). */
const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

/** Single line, no control characters, short enough for a mail subject. */
function subjectSafe(value: string, max = 60) {
  const line = value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

/** "Label, Label（other text）" */
function withOther(labels: string[], other: string | null) {
  return [...labels, other ? `その他：${other}` : null].filter(Boolean).join("、");
}

/**
 * Email Connectrip (CONTACT_TO_EMAIL) about a newly saved answer.
 * Never throws: failures are logged and the answer stays saved.
 */
async function notifyNewRegistration(r: PartnerRegistrationInput) {
  try {
    const { text, html } = buildFormEmail("事業者・パートナー向けアンケート", [
      { label: "会社名・店舗名", value: r.company_name },
      { label: "担当者名", value: r.contact_name },
      {
        label: "事業カテゴリ",
        value: [optionLabel(BUSINESS_CATEGORIES, r.business_category), r.business_category_other]
          .filter(Boolean)
          .join("："),
      },
      { label: "所在地・対応エリア", value: r.area },
      { label: "Webサイト", value: r.website },
      { label: "SNSアカウント", value: r.social_accounts.join("\n") },
      { label: "主な顧客層", value: optionLabels(CUSTOMER_TYPES, r.customer_types).join("、") },
      { label: "訪日外国人の受け入れ実績", value: optionLabel(INBOUND_EXPERIENCE, r.inbound_experience) },
      { label: "強み・おすすめポイント", value: r.strengths },
      {
        label: "現在の課題",
        value: withOther(
          optionLabels(CURRENT_CHALLENGES, r.current_challenges.filter((v) => v !== OTHER)),
          r.current_challenges_other,
        ),
      },
      {
        label: "興味のある連携",
        value: withOther(
          optionLabels(INTERESTED_COLLABORATIONS, r.interested_collaborations.filter((v) => v !== OTHER)),
          r.interested_collaborations_other,
        ),
      },
      { label: "メールアドレス", value: r.email },
      { label: "電話番号", value: r.phone },
      { label: "その他・ご相談", value: r.additional_notes },
      { label: "回答日時", value: formatDate(new Date().toISOString(), true) },
    ]);

    const result = await Promise.race([
      sendMail({
        subject: `【事業者アンケート】${subjectSafe(r.company_name)}｜Connectrip Japan`,
        text,
        html,
        replyTo: r.email,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`timed out after ${NOTIFICATION_TIMEOUT_MS}ms`)), NOTIFICATION_TIMEOUT_MS),
      ),
    ]);
    if (result.sent) {
      console.log("[partner-registrations] notification email sent", { messageId: result.messageId });
    } else {
      console.warn("[partner-registrations] notification email skipped: SMTP not configured");
    }
  } catch (error) {
    console.error("[partner-registrations] notification email failed", error);
  }
}

/**
 * Public endpoint for 事業者・パートナー向けアンケート (/partner/survey).
 *
 * 201 { success } on success (also for a repeated submission_id) · 400 bad JSON ·
 * 422 { errors } per field · 429 too many submissions · 503 when no database
 * is connected in production.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (ip && isRateLimited(`partner-registration:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs)) {
    return NextResponse.json({ success: false, message: "Too many submissions." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const result = parsePartnerRegistration(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, errors: result.errors }, { status: 422 });
  }

  // Honeypot filled in: answer like a success so bots learn nothing, but store nothing.
  if (result.isSpam) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  let saved;
  try {
    saved = await createPartnerRegistration(result.data, result.submissionId);
  } catch (error) {
    console.error("[partner-registrations] failed to save", error);
    const unavailable = error instanceof PartnerRegistrationStorageUnavailableError;
    return NextResponse.json(
      { success: false, message: unavailable ? "Storage is not configured." : "Failed to save." },
      { status: unavailable ? 503 : 500 },
    );
  }

  // Saved. A repeated submission was already notified; otherwise try the email —
  // it can never fail the request.
  if (!saved.duplicate) await notifyNewRegistration(result.data);

  return NextResponse.json({ success: true }, { status: 201 });
}
