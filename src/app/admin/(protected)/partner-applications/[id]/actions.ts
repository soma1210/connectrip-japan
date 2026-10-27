"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getPartnerPipelineStatuses,
  updatePartnerApplicationAdminFields,
} from "@/lib/data/partner-applications";
import {
  INTERNAL_RATING_MAX,
  INTERNAL_RATING_MIN,
} from "@/features/partner-survey/config/pipeline";

export async function savePartnerAdminFields(id: string, formData: FormData) {
  // Server Actions are public endpoints — re-check the session, not just the layout.
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const pipelineStatus = String(formData.get("pipeline_status") ?? "");
  const ratingRaw = String(formData.get("internal_rating") ?? "").trim();
  const internalNotes = String(formData.get("internal_notes") ?? "").slice(0, 20000);

  const statuses = await getPartnerPipelineStatuses();
  if (!statuses.includes(pipelineStatus)) {
    throw new Error("不明なステータスです。");
  }

  let internalRating: number | null = null;
  if (ratingRaw) {
    internalRating = Number(ratingRaw);
    if (
      !Number.isInteger(internalRating) ||
      internalRating < INTERNAL_RATING_MIN ||
      internalRating > INTERNAL_RATING_MAX
    ) {
      throw new Error(`評価は${INTERNAL_RATING_MIN}〜${INTERNAL_RATING_MAX}で入力してください。`);
    }
  }

  await updatePartnerApplicationAdminFields(id, {
    pipeline_status: pipelineStatus,
    internal_rating: internalRating,
    internal_notes: internalNotes,
  });

  revalidatePath("/admin/partner-applications");
  revalidatePath(`/admin/partner-applications/${id}`);
  redirect(`/admin/partner-applications/${id}?saved=1`);
}
