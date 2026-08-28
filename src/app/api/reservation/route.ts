import { NextResponse } from "next/server";
import { buildFormEmail, sendMail } from "@/lib/mailer";

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

  const { text, html } = buildFormEmail("予約フォーム", [
    { label: "お名前", value: name },
    { label: "メールアドレス", value: email },
    { label: "お住まいの国・地域", value: country },
    { label: "旅行期間", value: `${startDate} 〜 ${endDate}` },
    {
      label: "旅行人数",
      value: `大人 ${adults}名${children ? `、子供 ${children}名` : ""}`,
    },
    { label: "行きたいエリア", value: areas.join("、") },
    { label: "ご希望のサービス", value: services.join("、") },
    { label: "興味のある体験", value: interests.join("、") },
    { label: "ご予算", value: budget.join("、") },
    { label: "ご要望・メッセージ", value: message },
  ]);

  await sendMail({
    subject: `[予約リクエスト] ${name} 様より`,
    text,
    html,
    replyTo: email,
  });

  return NextResponse.json({ success: true });
}
