import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { rejectInterviewRequest } from "@/lib/interviews";
import { ADMIN_FAILURE_MESSAGES } from "@/features/guide-interviews/admin-messages";
import { adminError } from "../respond";

/**
 * Admin only. Reject a requested interview (frees the slot).
 *
 * POST { id, reason?, notify? } — notify: true emails the applicant.
 * → 200 { success, emailSent } · 401 · 404 · 409 not pending.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (typeof body?.id !== "string") return adminError("NOT_FOUND", ADMIN_FAILURE_MESSAGES.NOT_FOUND);
  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.slice(0, 2000) : null;

  const result = await rejectInterviewRequest(body.id, reason, body.notify === true);
  if (!result.ok) return adminError(result.code, ADMIN_FAILURE_MESSAGES[result.code]);
  return NextResponse.json({ success: true, emailSent: result.emailSent });
}
