import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const name = asString(body?.name);
  const email = asString(body?.email);
  const country = asString(body?.country);
  const startDate = asString(body?.startDate);
  const endDate = asString(body?.endDate);
  const adults = asString(body?.adults);
  const children = asString(body?.children);
  const message = asString(body?.message);
  const areas = asStringArray(body?.areas);
  const services = asStringArray(body?.services);
  const interests = asStringArray(body?.interests);
  const budget = asStringArray(body?.budget);

  if (!name || !email || !country || !startDate || !endDate || !adults) {
    return NextResponse.json(
      { success: false, message: "Missing required fields." },
      { status: 400 },
    );
  }

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Country / Region: ${country}`,
    `Travel dates: ${startDate} - ${endDate}`,
    `Travelers: ${adults} adult(s)${children ? `, ${children} child(ren)` : ""}`,
    areas.length ? `Areas: ${areas.join(", ")}` : null,
    services.length ? `Requested services: ${services.join(", ")}` : null,
    interests.length ? `Interests: ${interests.join(", ")}` : null,
    budget.length ? `Budget: ${budget.join(", ")}` : null,
    message ? `Message:\n${message}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  await sendMail({
    subject: `[Connectrip Japan] New reservation request from ${name}`,
    text,
    replyTo: email,
  });

  return NextResponse.json({ success: true });
}
