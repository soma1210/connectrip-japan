import { NextResponse } from "next/server";
import { buildFormEmail, sendMail } from "@/lib/mailer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const company = typeof body?.company === "string" ? body.company.trim() : "";
  const contactName = typeof body?.contactName === "string" ? body.contactName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const type = typeof body?.type === "string" ? body.type.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!company || !contactName || !email || !type || !message) {
    return NextResponse.json(
      { success: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  const { text, html } = buildFormEmail("法人お問い合わせフォーム", [
    { label: "会社名", value: company },
    { label: "ご担当者名", value: contactName },
    { label: "メールアドレス", value: email },
    { label: "お問い合わせ種別", value: type },
    { label: "お問い合わせ内容", value: message },
  ]);

  await sendMail({
    subject: `[法人お問い合わせ] ${company} 様より`,
    text,
    html,
    replyTo: email,
  });

  return NextResponse.json({ success: true });
}
