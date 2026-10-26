import { NextResponse, after } from "next/server";
import { buildFormEmail, sendMail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/site";
import {
  GuideStorageUnavailableError,
  createGuideApplication,
} from "@/lib/data/guide-applications";
import { parseApplication } from "@/features/guide-community/validation";
import {
  AREAS,
  EMPLOYMENT_STATUSES,
  GUIDE_EXPERIENCE,
  INTERVIEW_PREFERENCES,
  MONTHLY_AVAILABILITY,
} from "@/features/guide-community/config/options";
import { formatChoice, formatChoices, formatLanguages } from "@/features/guide-community/format";

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

  // Notify Connectrip after responding; a mail failure never affects the saved application.
  after(async () => {
    try {
      const { text, html } = buildFormEmail("Guide Community 応募", [
        { label: "お名前", value: application.name },
        { label: "メールアドレス", value: application.email },
        { label: "電話番号", value: application.phone },
        { label: "居住エリア", value: `${application.prefecture} ${application.city}` },
        { label: "言語", value: formatLanguages(application.languages) },
        { label: "ガイド経験", value: formatChoice(GUIDE_EXPERIENCE, application.guide_experience) },
        {
          label: "対応エリア",
          value: formatChoices(AREAS, application.available_areas, application.available_areas_other),
        },
        { label: "月間稼働", value: formatChoice(MONTHLY_AVAILABILITY, application.monthly_availability) },
        {
          label: "職業",
          value: formatChoice(EMPLOYMENT_STATUSES, application.employment_status, application.employment_status_other),
        },
        { label: "面談希望", value: formatChoice(INTERVIEW_PREFERENCES, application.interview_preference) },
        { label: "管理画面", value: `${SITE_URL}/admin/guide-applications/${id}` },
      ]);
      await sendMail({
        subject: `[ガイド応募] ${application.name} 様`,
        text,
        html,
        replyTo: application.email,
      });
    } catch (error) {
      console.error("[guide-applications] notification email failed", error);
    }
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}
