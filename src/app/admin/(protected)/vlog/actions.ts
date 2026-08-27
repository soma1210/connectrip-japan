"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { createVlogPost, deleteVlogPost, getVlogPosts } from "@/lib/data/vlog";

export async function addVlogPost(formData: FormData) {
  const titleJa = String(formData.get("titleJa") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  const descriptionJa = String(formData.get("descriptionJa") ?? "").trim();
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const altJa = String(formData.get("altJa") ?? "").trim();
  const altEn = String(formData.get("altEn") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const file = formData.get("image") as File | null;

  if (!file || file.size === 0) {
    throw new Error("画像を選択してください。");
  }

  const blob = await put(`vlog/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  const existing = await getVlogPosts();
  const nextSortOrder = existing.length
    ? Math.max(...existing.map((item) => item.sortOrder)) + 1
    : 0;

  await createVlogPost({
    imageUrl: blob.url,
    titleJa,
    titleEn,
    descriptionJa,
    descriptionEn,
    altJa,
    altEn,
    linkUrl,
    sortOrder: nextSortOrder,
  });

  revalidatePath("/admin/vlog");
  revalidatePath("/");
  revalidatePath("/en");
}

export async function removeVlogPost(id: number) {
  await deleteVlogPost(id);
  revalidatePath("/admin/vlog");
  revalidatePath("/");
  revalidatePath("/en");
}
