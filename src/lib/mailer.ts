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

export async function sendMail({
  subject,
  text,
  replyTo,
}: {
  subject: string;
  text: string;
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
  });
}
