"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/lib/admin-auth";
import { addNote, changeStatus, resendStaffEmail } from "@/lib/inquiries/admin";
import { notifierFromEnv } from "@/lib/notify/email";
import { dbFromEnv } from "@/lib/pg";

/**
 * Inquiry admin Server Actions (Phase 2, 2026-11-16). Server Actions are
 * public POST endpoints: each one checks the admin session itself
 * (`requireAdminActor`), validates its input on the server and records who
 * acted. CSRF: Next.js only runs a Server Action whose Origin matches the
 * host, and the admin cookie is SameSite=Strict.
 */

export type InquiryActionState = { ok: boolean; message: string } | null;

const NO_DB: InquiryActionState = { ok: false, message: "データベースに接続できません。設定を確認してください。" };
const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : null);

function refresh(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
}

const STATUS_MESSAGES = {
  not_found: "この問い合わせは見つかりません。",
  conflict: "他の操作で内容が更新されています。画面を再読み込みしてから、もう一度変更してください。",
  invalid_status: "不明なステータスです。",
  not_allowed: "現在のステータスからは、その変更はできません。",
  confirmation_required: "予約を確定するには、確認欄に受付番号を正しく入力してください。",
  note_too_long: "メモが長すぎます（5,000文字まで）。",
  unavailable: "保存できませんでした。時間をおいて再度お試しください。",
} as const;

export async function changeInquiryStatusAction(id: string, _prev: InquiryActionState, formData: FormData): Promise<InquiryActionState> {
  const actor = await requireAdminActor();
  const db = dbFromEnv();
  if (!db) return NO_DB;
  const result = await changeStatus(db, {
    id,
    to: text(formData.get("status")),
    expectedVersion: Number(text(formData.get("version"))),
    actor,
    note: text(formData.get("note")),
    confirmRef: text(formData.get("confirm_ref")),
  });
  if (!result.ok) return { ok: false, message: STATUS_MESSAGES[result.reason] };
  refresh(id);
  return { ok: true, message: "ステータスを更新しました。" };
}

const NOTE_MESSAGES = {
  not_found: "この問い合わせは見つかりません。",
  empty: "メモを入力してください。",
  note_too_long: "メモが長すぎます（5,000文字まで）。",
  unavailable: "保存できませんでした。時間をおいて再度お試しください。",
} as const;

export async function addInquiryNoteAction(id: string, _prev: InquiryActionState, formData: FormData): Promise<InquiryActionState> {
  const actor = await requireAdminActor();
  const db = dbFromEnv();
  if (!db) return NO_DB;
  const result = await addNote(db, { id, note: text(formData.get("note")), actor });
  if (!result.ok) return { ok: false, message: NOTE_MESSAGES[result.reason] };
  refresh(id);
  return { ok: true, message: "メモを追加しました。" };
}

const RESEND_MESSAGES = {
  not_found: "通知メールの記録が見つかりません。",
  already_sent: "通知メールは送信済みです（二重送信はしません）。",
  in_progress: "現在ほかの処理が送信中です。少し待ってから画面を再読み込みしてください。",
  not_configured: "メール送信の設定（SMTP）が未設定のため送信できません。キューに保持されています。",
  unavailable: "再送できませんでした。時間をおいて再度お試しください。",
} as const;

export async function resendInquiryEmailAction(id: string): Promise<InquiryActionState> {
  const actor = await requireAdminActor();
  const db = dbFromEnv();
  if (!db) return NO_DB;
  const result = await resendStaffEmail(db, notifierFromEnv(), { id, actor });
  refresh(id);
  if (!result.ok) return { ok: false, message: RESEND_MESSAGES[result.reason] };
  return result.report.sent > 0
    ? { ok: true, message: "通知メールを再送しました。" }
    : { ok: false, message: "再送に失敗しました。送信結果は対応履歴に記録されています。" };
}
