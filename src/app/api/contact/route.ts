import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

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

  const text = [`Name: ${name}`, `Email: ${email}`, `Message:\n${message}`].join("\n");

  await sendMail({
    subject: `[Connectrip Japan] New contact message from ${name}`,
    text,
    replyTo: email,
  });

  return NextResponse.json({ success: true });
}
