"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { createGalleryItem, deleteGalleryItem, getGalleryItems } from "@/lib/data/gallery";

export async function addGalleryItem(formData: FormData) {
  const altJa = String(formData.get("altJa") ?? "").trim();
  const altEn = String(formData.get("altEn") ?? "").trim();
  const file = formData.get("image") as File | null;

  if (!file || file.size === 0) {
    throw new Error("画像を選択してください。");
  }

  const blob = await put(`gallery/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  const existing = await getGalleryItems();
  const nextSortOrder = existing.length
    ? Math.max(...existing.map((item) => item.sortOrder)) + 1
    : 0;

  await createGalleryItem({
    imageUrl: blob.url,
    altJa,
    altEn,
    sortOrder: nextSortOrder,
  });

  revalidatePath("/admin/gallery");
  revalidatePath("/");
  revalidatePath("/en");
}

export async function removeGalleryItem(id: number) {
  await deleteGalleryItem(id);
  revalidatePath("/admin/gallery");
  revalidatePath("/");
  revalidatePath("/en");
}
