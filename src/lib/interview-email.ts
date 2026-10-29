// Interview emails. Applicant mail is in English, the admin notice in Japanese.
// Styling follows buildFormEmail in mailer.ts (navy header, gold title).
//
// Every function here returns { sent } and never throws: a failed email must
// not undo a booking or an approval. Callers record what was sent and the
// admin screen offers a resend / copy fallback.

import { buildFormEmail, escapeHtml, sendMail } from "@/lib/mailer";
import { INTERVIEW_TIME_ZONE } from "@/features/guide-interviews/rules";

/** Give up after this long so a slow SMTP server never stalls an approval. */
const SEND_TIMEOUT_MS = 8_000;
const BRAND = "Connectrip Japan";

export interface EmailResult {
  sent: boolean;
}

/** "Thursday, November 5, 2026" */
export function formatInterviewDate(start: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: INTERVIEW_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(start);
}

/** "14:00–14:30 (Japan Time)" */
export function formatInterviewTime(start: Date, end: Date): string {
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: INTERVIEW_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
  return `${time.format(start)}–${time.format(end)} (Japan Time)`;
}

interface ApplicantMail {
  to: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  details?: { label: string; value: string; href?: string }[];
  button?: { label: string; href: string };
  closing: string[];
}

function renderApplicantMail(mail: ApplicantMail) {
  const text = [
    ...mail.paragraphs,
    "",
    ...(mail.details ?? []).map((d) => `${d.label}:\n${d.value}\n`),
    ...(mail.button ? [`${mail.button.label}:`, mail.button.href, ""] : []),
    ...mail.closing,
    "",
    BRAND,
  ].join("\n");

  const p = (line: string) =>
    `<p style="margin:0 0 14px;color:#111827;font-size:14px;line-height:1.7;">${escapeHtml(line)}</p>`;
  const details = (mail.details ?? [])
    .map(
      (d) => `
        <tr>
          <td style="padding:10px 16px;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eee;">${escapeHtml(d.label)}</td>
          <td style="padding:10px 16px;color:#111827;font-size:14px;vertical-align:top;border-bottom:1px solid #eee;">${
            d.href
              ? `<a href="${escapeHtml(d.href)}" style="color:#162e4c;font-weight:bold;">${escapeHtml(d.value)}</a>`
              : escapeHtml(d.value)
          }</td>
        </tr>`,
    )
    .join("");
  const button = mail.button
    ? `<p style="margin:20px 0;"><a href="${escapeHtml(mail.button.href)}" style="display:inline-block;background:#162e4c;color:#ffffff;padding:12px 22px;text-decoration:none;font-weight:bold;font-size:14px;">${escapeHtml(mail.button.label)}</a></p>`
    : "";

  const html = `
    <div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;">
      <div style="background:#162e4c;color:#c9a45c;padding:14px 20px;font-weight:bold;font-size:15px;letter-spacing:0.05em;">
        ${escapeHtml(mail.heading)}
      </div>
      <div style="background:#ffffff;padding:20px 20px 6px;">
        ${mail.paragraphs.map(p).join("")}
        ${details ? `<table style="width:100%;border-collapse:collapse;margin:6px 0 18px;">${details}</table>` : ""}
        ${button}
        ${mail.closing.map(p).join("")}
        ${p(BRAND)}
      </div>
    </div>`;

  return { text, html };
}

async function deliver(label: string, send: Promise<{ sent: boolean }>): Promise<EmailResult> {
  try {
    const result = await Promise.race([
      send,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`timed out after ${SEND_TIMEOUT_MS}ms`)), SEND_TIMEOUT_MS),
      ),
    ]);
    if (!result.sent) console.warn(`[interviews] ${label} email skipped: SMTP not configured`);
    return { sent: result.sent };
  } catch (error) {
    console.error(`[interviews] ${label} email failed`, error);
    return { sent: false };
  }
}

async function sendApplicantMail(label: string, mail: ApplicantMail): Promise<EmailResult> {
  const { text, html } = renderApplicantMail(mail);
  return deliver(label, sendMail({ to: mail.to, subject: mail.subject, text, html }));
}

// --- applicant ---------------------------------------------------------------

export function sendInvitationEmail(params: { to: string; name: string; bookingUrl: string; expiresAt: Date }) {
  return sendApplicantMail("invitation", {
    to: params.to,
    subject: `${BRAND} – Please choose your guide interview time`,
    heading: "Guide Interview",
    paragraphs: [
      `Dear ${params.name},`,
      "Thank you for applying to become a guide with Connectrip Japan.",
      "We would like to invite you to a 30-minute online interview. Please choose a time that suits you from the link below.",
    ],
    button: { label: "Choose your interview time", href: params.bookingUrl },
    closing: [
      `This link is personal to you and is valid until ${formatInterviewDate(params.expiresAt)}.`,
      "Your interview is confirmed once we approve your request. We will then send you the Google Meet link.",
    ],
  });
}

export function sendConfirmationEmail(params: { to: string; name: string; start: Date; end: Date; meetUrl: string }) {
  return sendApplicantMail("confirmation", {
    to: params.to,
    subject: `${BRAND} – Your interview has been confirmed`,
    heading: "Guide Interview – Confirmed",
    paragraphs: [`Dear ${params.name},`, "Your interview has been confirmed."],
    details: [
      { label: "Date", value: formatInterviewDate(params.start) },
      { label: "Time", value: formatInterviewTime(params.start, params.end) },
      { label: "Google Meet", value: params.meetUrl, href: params.meetUrl },
    ],
    closing: ["Please join from the Google Meet link at the time above.", "We look forward to speaking with you."],
  });
}

export function sendRejectionEmail(params: { to: string; name: string; start: Date; end: Date }) {
  return sendApplicantMail("rejection", {
    to: params.to,
    subject: `${BRAND} – About your interview request`,
    heading: "Guide Interview",
    paragraphs: [
      `Dear ${params.name},`,
      `Thank you for your interview request for ${formatInterviewDate(params.start)}, ${formatInterviewTime(params.start, params.end)}.`,
      "Unfortunately, we are unable to hold the interview at this time. We will contact you separately.",
    ],
    closing: ["Thank you for your understanding."],
  });
}

// --- admin -------------------------------------------------------------------

/** Notify Connectrip (CONTACT_TO_EMAIL) that an applicant requested a time. */
export function sendRequestNoticeToAdmin(params: { name: string; start: Date; end: Date; adminUrl: string }) {
  const when = new Intl.DateTimeFormat("ja-JP", {
    timeZone: INTERVIEW_TIME_ZONE,
    dateStyle: "full",
    timeStyle: "short",
  }).format(params.start);
  const { text, html } = buildFormEmail("面談申請（承認待ち）", [
    { label: "応募者名", value: params.name },
    { label: "希望日時", value: `${when}〜（30分）` },
  ]);
  const linkText = "管理画面で承認・却下する";
  return deliver(
    "admin notice",
    sendMail({
      subject: "【Connectrip】面談申請がありました（承認待ち）",
      text: `${text}\n\n${linkText}\n${params.adminUrl}`,
      html: `${html}<p style="font-family:sans-serif;margin:20px 0;"><a href="${escapeHtml(params.adminUrl)}" style="color:#162e4c;font-weight:bold;">${linkText} →</a></p>`,
    }),
  );
}
