"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getPipelineStatuses,
  updateGuideApplicationAdminFields,
} from "@/lib/data/guide-applications";
import {
  INTERNAL_RATING_MAX,
  INTERNAL_RATING_MIN,
} from "@/features/guide-community/config/pipeline";

export async function saveAdminFields(id: string, formData: FormData) {
  // Server Actions are public endpoints — re-check the session, not just the layout.
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const pipelineStatus = String(formData.get("pipeline_status") ?? "");
  const ratingRaw = String(formData.get("internal_rating") ?? "").trim();
  const internalNotes = String(formData.get("internal_notes") ?? "").slice(0, 20000);

  const statuses = await getPipelineStatuses();
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

  await updateGuideApplicationAdminFields(id, {
    pipeline_status: pipelineStatus,
    internal_rating: internalRating,
    internal_notes: internalNotes,
  });

  revalidatePath("/admin/guide-applications");
  revalidatePath(`/admin/guide-applications/${id}`);
  redirect(`/admin/guide-applications/${id}?saved=1`);
}
