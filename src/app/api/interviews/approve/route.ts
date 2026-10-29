import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { approveInterview } from "@/lib/interviews";
import { ADMIN_FAILURE_MESSAGES } from "@/features/guide-interviews/admin-messages";
import { adminError } from "../respond";

/**
 * Admin only. Approve a requested interview: re-check the calendar and other
 * interviews, create the Google Calendar event with Meet, save CONFIRMED and
 * email the applicant.
 *
 * POST { id } → 200 { success, emailSent } · 401 · 404 · 409 slot taken or
 * not pending · 502/503 Google trouble (nothing is left half-done).
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string") return adminError("NOT_FOUND", ADMIN_FAILURE_MESSAGES.NOT_FOUND);

  const result = await approveInterview(body.id);
  if (!result.ok) return adminError(result.code, ADMIN_FAILURE_MESSAGES[result.code]);
  return NextResponse.json({ success: true, emailSent: result.emailSent });
}
