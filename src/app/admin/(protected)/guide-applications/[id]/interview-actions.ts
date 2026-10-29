"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { completeInterview, InterviewStateError } from "@/lib/data/guide-interviews";
import {
  approveInterview,
  cancelInterviewByAdmin,
  issueInvitation,
  rejectInterviewRequest,
  requestAnotherTime,
  resendConfirmation,
  type AdminResult,
} from "@/lib/interviews";
import { ADMIN_FAILURE_MESSAGES } from "@/features/guide-interviews/admin-messages";

/** What the interview panel shows after an action. `link` is a fresh booking link to copy. */
export interface InterviewActionState {
  ok: boolean;
  message: string;
  link?: string;
}

async function requireAdmin() {
  // Server Actions are public endpoints — re-check the session, not just the layout.
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function done(applicationId: string, state: InterviewActionState): InterviewActionState {
  revalidatePath(`/admin/guide-applications/${applicationId}`);
  revalidatePath("/admin/guide-applications");
  return state;
}

function failed(result: AdminResult & { ok: false }): InterviewActionState {
  return { ok: false, message: ADMIN_FAILURE_MESSAGES[result.code] };
}

const mailNote = (sent: boolean, what: string) =>
  sent ? `${what}をメールで送信しました。` : `${what}メールは送信されていません（SMTP 未設定または送信失敗）。下の情報をコピーして応募者へ送ってください。`;

export async function sendInvitationAction(applicationId: string): Promise<InterviewActionState> {
  await requireAdmin();
  const result = await issueInvitation(applicationId, await requestOrigin());
  if (!result.ok) return failed(result);
  return done(applicationId, { ok: true, message: mailNote(result.emailSent, "予約リンク"), link: result.link });
}

export async function approveAction(applicationId: string, interviewId: string): Promise<InterviewActionState> {
  await requireAdmin();
  const result = await approveInterview(interviewId);
  if (!result.ok) {
    // Still pending: refresh so the panel shows the current state with the error.
    return done(applicationId, failed(result));
  }
  return done(applicationId, {
    ok: true,
    message: `面談を確定しました（Google Calendar 登録・Meet 発行済み）。${mailNote(result.emailSent, "確定通知")}`,
  });
}

export async function rejectAction(
  applicationId: string,
  interviewId: string,
  reason: string,
  notifyApplicant: boolean,
): Promise<InterviewActionState> {
  await requireAdmin();
  const result = await rejectInterviewRequest(interviewId, reason.trim().slice(0, 2000) || null, notifyApplicant);
  if (!result.ok) return failed(result);
  const note = notifyApplicant ? (result.emailSent ? "応募者へ通知しました。" : "通知メールは送信されていません。") : "";
  return done(applicationId, { ok: true, message: `却下しました。${note}` });
}

export async function requestAnotherTimeAction(applicationId: string, interviewId: string): Promise<InterviewActionState> {
  await requireAdmin();
  const result = await requestAnotherTime(interviewId, await requestOrigin());
  if (!result.ok) return failed(result);
  return done(applicationId, {
    ok: true,
    message: `この申請を取り消し、新しい予約リンクを発行しました。${mailNote(result.emailSent, "予約リンク")}`,
    link: result.link,
  });
}

export async function cancelAction(applicationId: string, interviewId: string): Promise<InterviewActionState> {
  await requireAdmin();
  const result = await cancelInterviewByAdmin(interviewId, "管理画面でキャンセル");
  if (!result.ok) return failed(result);
  return done(applicationId, {
    ok: true,
    message: result.calendarEventLeft
      ? "キャンセルしました。Google Calendar の予定を削除できなかったため、手動で削除してください。応募者への連絡は別途行ってください。"
      : "キャンセルしました。応募者への連絡は別途行ってください。",
  });
}

export async function resendConfirmationAction(applicationId: string, interviewId: string): Promise<InterviewActionState> {
  await requireAdmin();
  const result = await resendConfirmation(interviewId);
  if (!result.ok) return failed(result);
  return done(applicationId, { ok: result.emailSent, message: mailNote(result.emailSent, "確定通知") });
}

export async function completeAction(applicationId: string, interviewId: string): Promise<InterviewActionState> {
  await requireAdmin();
  try {
    await completeInterview(interviewId);
  } catch (error) {
    if (error instanceof InterviewStateError) {
      return { ok: false, message: "面談終了後に「面談済み」にできます。" };
    }
    throw error;
  }
  return done(applicationId, { ok: true, message: "面談済みにしました。" });
}
