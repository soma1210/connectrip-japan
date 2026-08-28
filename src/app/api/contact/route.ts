import { NextResponse } from "next/server";
import { buildFormEmail, sendMail } from "@/lib/mailer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json(
      { success: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  const { text, html } = buildFormEmail("お問い合わせフォーム", [
    { label: "お名前", value: name },
    { label: "メールアドレス", value: email },
    { label: "メッセージ", value: message },
  ]);

  await sendMail({
    subject: `[お問い合わせ] ${name} 様より`,
    text,
    html,
    replyTo: email,
  });

  return NextResponse.json({ success: true });
}
