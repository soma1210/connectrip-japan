import { sql, isDbConfigured } from "@/lib/db";

export type GalleryItem = {
  id: number;
  imageUrl: string;
  altJa: string;
  altEn: string;
  sortOrder: number;
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT id, image_url, alt_ja, alt_en, sort_order
    FROM gallery_items
    ORDER BY sort_order ASC, id ASC
  `;
  return rows.map((row) => ({
    id: row.id,
    imageUrl: row.image_url,
    altJa: row.alt_ja,
    altEn: row.alt_en,
    sortOrder: row.sort_order,
  }));
}

export async function createGalleryItem(data: {
  imageUrl: string;
  altJa: string;
  altEn: string;
  sortOrder: number;
}) {
  await sql`
    INSERT INTO gallery_items (image_url, alt_ja, alt_en, sort_order)
    VALUES (${data.imageUrl}, ${data.altJa}, ${data.altEn}, ${data.sortOrder})
  `;
}

export async function deleteGalleryItem(id: number) {
  await sql`DELETE FROM gallery_items WHERE id = ${id}`;
}
