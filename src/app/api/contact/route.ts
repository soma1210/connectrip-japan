import { NextResponse } from "next/server";

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

  // TODO: wire this up to a real destination (email provider, Supabase, CRM, etc.)
  // once that infrastructure exists. For now we just acknowledge receipt.
  console.log("Contact form submission:", { name, email, message });

  return NextResponse.json({ success: true });
}
