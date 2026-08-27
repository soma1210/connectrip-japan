import { sql, isDbConfigured } from "@/lib/db";

export type VlogPost = {
  id: number;
  imageUrl: string;
  titleJa: string;
  titleEn: string;
  descriptionJa: string;
  descriptionEn: string;
  altJa: string;
  altEn: string;
  linkUrl: string;
  sortOrder: number;
};

export async function getVlogPosts(): Promise<VlogPost[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT id, image_url, title_ja, title_en, description_ja, description_en,
           alt_ja, alt_en, link_url, sort_order
    FROM vlog_posts
    ORDER BY sort_order ASC, id ASC
  `;
  return rows.map((row) => ({
    id: row.id,
    imageUrl: row.image_url,
    titleJa: row.title_ja,
    titleEn: row.title_en,
    descriptionJa: row.description_ja,
    descriptionEn: row.description_en,
    altJa: row.alt_ja,
    altEn: row.alt_en,
    linkUrl: row.link_url,
    sortOrder: row.sort_order,
  }));
}

export async function createVlogPost(data: {
  imageUrl: string;
  titleJa: string;
  titleEn: string;
  descriptionJa: string;
  descriptionEn: string;
  altJa: string;
  altEn: string;
  linkUrl: string;
  sortOrder: number;
}) {
  await sql`
    INSERT INTO vlog_posts
      (image_url, title_ja, title_en, description_ja, description_en, alt_ja, alt_en, link_url, sort_order)
    VALUES
      (${data.imageUrl}, ${data.titleJa}, ${data.titleEn}, ${data.descriptionJa}, ${data.descriptionEn},
       ${data.altJa}, ${data.altEn}, ${data.linkUrl}, ${data.sortOrder})
  `;
}

export async function deleteVlogPost(id: number) {
  await sql`DELETE FROM vlog_posts WHERE id = ${id}`;
}
