import { NextResponse } from "next/server";
import { buildFormEmail, sendMail } from "@/lib/mailer";
import {
  GuideStorageUnavailableError,
  createGuideApplication,
} from "@/lib/data/guide-applications";
import { parseApplication } from "@/features/guide-community/validation";
import {
  AREAS,
  EMPLOYMENT_STATUSES,
  GUIDE_EXPERIENCE,
  GUIDE_PURPOSES,
  INTERVIEW_PREFERENCES,
  LANGUAGE_LEVELS,
  labelOf,
} from "@/features/guide-community/config/options";
import { formatChoice, formatChoices, formatDate, languageName } from "@/features/guide-community/format";
import type { GuideApplicationInput } from "@/features/guide-community/types";

const NOTIFICATION_SUBJECT = "【Connectrip】新しいガイド応募がありました";
/** Give up on the notification after this long so a slow SMTP server never delays the applicant. */
const NOTIFICATION_TIMEOUT_MS = 10_000;

/**
 * Email Connectrip (CONTACT_TO_EMAIL) about a newly saved application.
 * Never throws: failures are logged and the application stays saved.
 */
async function notifyNewApplication(application: GuideApplicationInput, adminUrl: string) {
  try {
    const { text, html } = buildFormEmail("新しいガイド応募", [
      { label: "応募者名", value: application.name },
      { label: "Email", value: application.email },
      { label: "電話番号", value: application.phone },
      { label: "居住エリア", value: `${application.prefecture} ${application.city}` },
      { label: "対応言語", value: application.languages.map(languageName).join("、") },
      {
        label: "言語レベル",
        value: application.languages
          .map((skill) => `${languageName(skill)}：${labelOf(LANGUAGE_LEVELS, skill.level)}`)
          .join("\n"),
      },
      { label: "ガイド経験", value: formatChoice(GUIDE_EXPERIENCE, application.guide_experience) },
      {
        label: "対応可能エリア",
        value: formatChoices(AREAS, application.available_areas, application.available_areas_other),
      },
      {
        label: "現在の職業",
        value: formatChoice(EMPLOYMENT_STATUSES, application.employment_status, application.employment_status_other),
      },
      {
        label: "ガイド案件を受ける目的",
        value: formatChoices(GUIDE_PURPOSES, application.guide_purposes, application.guide_purposes_other),
      },
      { label: "面談希望", value: formatChoice(INTERVIEW_PREFERENCES, application.interview_preference) },
      { label: "応募日時", value: formatDate(new Date().toISOString(), true) },
    ]);
    const linkText = "管理画面で応募者の詳細を確認する";

    const result = await Promise.race([
      sendMail({
        subject: NOTIFICATION_SUBJECT,
        text: `${text}\n\n${linkText}\n${adminUrl}`,
        html: `${html}<p style="font-family:sans-serif;margin:20px 0;"><a href="${adminUrl}" style="color:#162e4c;font-weight:bold;">${linkText} →</a></p>`,
        replyTo: application.email,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`timed out after ${NOTIFICATION_TIMEOUT_MS}ms`)), NOTIFICATION_TIMEOUT_MS),
      ),
    ]);
    if (result.sent) {
      console.log("[guide-applications] notification email sent", { messageId: result.messageId });
    } else {
      console.warn("[guide-applications] notification email skipped: SMTP not configured");
    }
  } catch (error) {
    console.error("[guide-applications] notification email failed", error);
  }
}

/**
 * Public endpoint for the Guide Community application form.
 *
 * Accepts the FormValues JSON (src/features/guide-community/config/questions.ts).
 * 201 { success, id } on success · 422 { errors } with per-field messages ·
 * 503 when no database is connected in production.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const result = parseApplication(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, errors: result.errors }, { status: 422 });
  }

  // Honeypot filled in: answer like a success so bots learn nothing, but store nothing.
  if (result.isSpam) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const application = result.data;
  let id: string;
  try {
    id = await createGuideApplication(application);
  } catch (error) {
    console.error("[guide-applications] failed to save", error);
    const unavailable = error instanceof GuideStorageUnavailableError;
    return NextResponse.json(
      { success: false, message: unavailable ? "Storage is not configured." : "Failed to save." },
      { status: unavailable ? 503 : 500 },
    );
  }

  // The application is saved. Try the notification email; it can never fail the request.
  await notifyNewApplication(application, `${new URL(request.url).origin}/admin/guide-applications`);

  return NextResponse.json({ success: true, id }, { status: 201 });
}
