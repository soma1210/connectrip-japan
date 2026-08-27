import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

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

  const text = [
    `Company: ${company}`,
    `Contact person: ${contactName}`,
    `Email: ${email}`,
    `Inquiry type: ${type}`,
    `Message:\n${message}`,
  ].join("\n");

  await sendMail({
    subject: `[Connectrip Japan] New business inquiry from ${company}`,
    text,
    replyTo: email,
  });

  return NextResponse.json({ success: true });
}
