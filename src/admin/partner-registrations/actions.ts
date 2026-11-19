"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { updatePartnerRegistrationAdminFields } from "@/lib/data/partner-registrations";
import { ADMIN_LIMITS, isPartnerPriority, isPartnerStatus } from "@/features/partner-registration/admin";

export type SaveAdminFieldsState = { ok: boolean; message: string } | null;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function savePartnerRegistrationAdminFields(
  id: string,
  _previous: SaveAdminFieldsState,
  formData: FormData,
): Promise<SaveAdminFieldsState> {
  // Server Actions are public endpoints: re-check the session, not just the layout.
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");
  const nextAction = String(formData.get("next_action") ?? "").trim();
  const nextActionAt = String(formData.get("next_action_at") ?? "").trim();
  const internalNotes = String(formData.get("internal_notes") ?? "");

  if (!isPartnerStatus(status)) return { ok: false, message: "不明なステータスです。" };
  if (priority && !isPartnerPriority(priority)) return { ok: false, message: "不明な優先度です。" };
  if (nextActionAt && (!DATE_PATTERN.test(nextActionAt) || Number.isNaN(Date.parse(nextActionAt)))) {
    return { ok: false, message: "次回対応日の形式が正しくありません。" };
  }
  if (nextAction.length > ADMIN_LIMITS.nextAction) {
    return { ok: false, message: `次回アクションは${ADMIN_LIMITS.nextAction}文字以内で入力してください。` };
  }
  if (internalNotes.length > ADMIN_LIMITS.internalNotes) {
    return { ok: false, message: `内部メモは${ADMIN_LIMITS.internalNotes}文字以内で入力してください。` };
  }

  const found = await updatePartnerRegistrationAdminFields(id, {
    status,
    priority: priority || null,
    internal_notes: internalNotes,
    next_action: nextAction || null,
    next_action_at: nextActionAt || null,
  });
  if (!found) return { ok: false, message: "この回答が見つかりません。" };

  revalidatePath("/admin/partner-registrations");
  revalidatePath(`/admin/partner-registrations/${id}`);
  return { ok: true, message: "保存しました。" };
}
