import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, CONTACT_TO_EMAIL } =
  process.env;

const isConfigured = Boolean(
  SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD && CONTACT_TO_EMAIL,
);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    })
  : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface EmailField {
  label: string;
  /** Falsy values (empty string, undefined, empty array) are omitted from the email. */
  value: string | null | undefined;
}

/**
 * Build a clearly-labeled text + HTML email body for a form submission, so
 * whoever reads it immediately knows which form it came from and can scan
 * every field (including which checkboxes were selected) at a glance.
 */
export function buildFormEmail(formLabel: string, fields: EmailField[]) {
  const visible = fields.filter(
    (f): f is EmailField & { value: string } => Boolean(f.value && f.value.trim()),
  );

  const text = [
    `【${formLabel}】`,
    "",
    ...visible.map((f) => `${f.label}: ${f.value}`),
  ].join("\n");

  const rows = visible
    .map(
      (f) => `
        <tr>
          <td style="padding:10px 16px;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eee;">${escapeHtml(f.label)}</td>
          <td style="padding:10px 16px;color:#111827;font-size:14px;vertical-align:top;border-bottom:1px solid #eee;">${escapeHtml(f.value).replace(/\n/g, "<br/>")}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:'Hiragino Kaku Gothic ProN',Meiryo,sans-serif;max-width:640px;margin:0 auto;">
      <div style="background:#162e4c;color:#c9a45c;padding:14px 20px;font-weight:bold;font-size:15px;letter-spacing:0.05em;">
        ${escapeHtml(formLabel)}
      </div>
      <table style="width:100%;border-collapse:collapse;background:#ffffff;">
        ${rows}
      </table>
    </div>`;

  return { text, html };
}

export async function sendMail({
  subject,
  text,
  html,
  replyTo,
}: {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  if (!transporter) {
    console.log("[mailer] SMTP is not configured (see .env.example). Logging submission instead:");
    console.log({ subject, replyTo, text });
    return;
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: CONTACT_TO_EMAIL,
    replyTo,
    subject,
    text,
    html,
  });
}
