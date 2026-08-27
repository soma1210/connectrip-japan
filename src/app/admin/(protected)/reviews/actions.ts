"use server";

import { revalidatePath } from "next/cache";
import { createReview, deleteReview, getReviews } from "@/lib/data/reviews";

export async function addReview(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const countryCode = String(formData.get("countryCode") ?? "")
    .trim()
    .toUpperCase();
  const rating = Number(formData.get("rating") ?? 5);
  const tag = String(formData.get("tag") ?? "").trim();
  const reviewDate = String(formData.get("reviewDate") ?? "").trim();
  const quoteJa = String(formData.get("quoteJa") ?? "").trim();
  const quoteEn = String(formData.get("quoteEn") ?? "").trim();

  if (!name || !quoteJa) {
    throw new Error("お名前とレビュー内容（日本語）は必須です。");
  }

  const existing = await getReviews();
  const nextSortOrder = existing.length
    ? Math.max(...existing.map((item) => item.sortOrder)) + 1
    : 0;

  await createReview({
    name,
    country,
    countryCode,
    rating: Math.min(5, Math.max(1, rating)),
    tag,
    reviewDate,
    quoteJa,
    quoteEn,
    sortOrder: nextSortOrder,
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath("/en");
}

export async function removeReview(id: number) {
  await deleteReview(id);
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath("/en");
}
