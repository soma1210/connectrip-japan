import nodemailer from "nodemailer";

/**
 * Staff notification email for the Website v1 forms (booking requests and
 * inquiries), 2026-11-16.
 *
 * - Sent through SMTP (the existing nodemailer setup; Resend's SMTP relay or
 *   any provider whose sending domain is authenticated for connectripjapan.com).
 * - Server-only settings: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD;
 *   optional NOTIFY_FROM (default SMTP_FROM, then SMTP_USER) and NOTIFY_TO
 *   (default CONTACT_TO_EMAIL, then contact@connectripjapan.com).
 * - The customer's address is never the sender: it goes in Reply-To only.
 * - Results are reported as "sent" (the provider accepted the message),
 *   "not_configured" or "failed". "sent" is not proof of delivery to the inbox.
 * - Nothing about the message (names, addresses, text) is ever logged here.
 */

export const DEFAULT_NOTIFY_TO = "contact@connectripjapan.com";
const SEND_TIMEOUT_MS = 10_000;
const EMAIL = /^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[^\s@<>()",;:\\[\]]{2,}$/;

export type NotificationEmail = {
  subject: string;
  text: string;
  html: string;
  /** The customer's address, when it passed validation. */
  replyTo?: string;
};

export type NotifyResult = { status: "sent"; messageId?: string } | { status: "not_configured" } | { status: "failed" };

/** What actually hands a message to the provider (nodemailer in production, a fake in tests). */
export type MailTransport = (message: NotificationEmail & { from: string; to: string }) => Promise<{ messageId?: string }>;

export type Notifier = { send(email: NotificationEmail): Promise<NotifyResult> };

/** One line, no control characters: header values can never start a new header. */
export function headerSafe(value: string, max = 200): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function isSafeEmail(value: string | null | undefined): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL.test(value);
}

export function createNotifier({ from, to, transport, timeoutMs = SEND_TIMEOUT_MS }: { from: string; to: string; transport: MailTransport; timeoutMs?: number }): Notifier {
  return {
    async send(email) {
      const message = {
        subject: headerSafe(email.subject, 250),
        text: email.text,
        html: email.html,
        replyTo: isSafeEmail(email.replyTo) ? email.replyTo : undefined,
        from,
        to,
      };
      try {
        const info = await withTimeout(transport(message), timeoutMs);
        return { status: "sent", messageId: info.messageId };
      } catch {
        return { status: "failed" };
      }
    },
  };
}

/** Null when SMTP is not configured: callers report "not_configured" and keep the saved record. */
export function notifierFromEnv(env: Record<string, string | undefined> = process.env): Notifier | null {
  const host = env.SMTP_HOST?.trim();
  const port = Number(env.SMTP_PORT);
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASSWORD;
  if (!host || !Number.isInteger(port) || port <= 0 || !user || !pass) return null;
  const from = headerSafe(env.NOTIFY_FROM || env.SMTP_FROM || user);
  const to = headerSafe(env.NOTIFY_TO || env.CONTACT_TO_EMAIL || DEFAULT_NOTIFY_TO);
  const smtp = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: SEND_TIMEOUT_MS,
    greetingTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS,
  });
  return createNotifier({ from, to, transport: async (m) => smtp.sendMail(m) });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// --- Message bodies -------------------------------------------------------------

export type EmailRow = { label: string; value: string | number | null | undefined };

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** "2026-11-16 14:03 JST (2026-11-16T05:03:00.000Z)" */
export function receivedAtLabel(at: Date): string {
  const jst = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(at);
  return `${jst} JST (${at.toISOString()})`;
}

/** Plain text and HTML with the same rows; every value is escaped in the HTML. Empty values are left out. */
export function buildEmailBody(title: string, intro: string[], rows: EmailRow[], footer: string[]): { text: string; html: string } {
  const visible = rows
    .map((r) => ({ label: r.label, value: r.value == null ? "" : String(r.value).trim() }))
    .filter((r) => r.value !== "");
  const text = [title, "", ...intro, "", ...visible.map((r) => `${r.label}: ${r.value}`), "", ...footer].join("\n");
  const tr = visible
    .map(
      (r) =>
        `<tr><td style="padding:8px 14px;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #eee;">${escapeHtml(r.label)}</td><td style="padding:8px 14px;color:#111827;font-size:14px;vertical-align:top;border-bottom:1px solid #eee;">${escapeHtml(r.value).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  const p = (lines: string[], style: string) => lines.map((l) => `<p style="${style}">${escapeHtml(l)}</p>`).join("");
  const html = `<div style="font-family:Arial,'Hiragino Kaku Gothic ProN',Meiryo,sans-serif;max-width:680px;margin:0 auto;">
<div style="background:#162e4c;color:#c9a45c;padding:14px 20px;font-weight:bold;font-size:15px;">${escapeHtml(title)}</div>
<div style="padding:12px 20px;background:#fff;">${p(intro, "margin:6px 0;color:#111827;font-size:14px;")}</div>
<table style="width:100%;border-collapse:collapse;background:#fff;">${tr}</table>
<div style="padding:12px 20px;background:#fff;">${p(footer, "margin:6px 0;color:#6b7280;font-size:12px;")}</div>
</div>`;
  return { text, html };
}
