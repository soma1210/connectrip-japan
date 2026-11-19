"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { createGalleryItem, deleteGalleryItem, getGalleryItems } from "@/lib/data/gallery";
import { requireAdmin } from "@/lib/admin-auth";

export async function addGalleryItem(formData: FormData) {
  // Server Actions are public endpoints: check the session here, not only in the layout.
  await requireAdmin();

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
  // Server Actions are public endpoints: check the session here, not only in the layout.
  await requireAdmin();

  await deleteGalleryItem(id);
  revalidatePath("/admin/gallery");
  revalidatePath("/");
  revalidatePath("/en");
}
