import { sql, isDbConfigured } from "@/lib/db";

export type ReviewItem = {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  rating: number;
  tag: string;
  reviewDate: string;
  quoteJa: string;
  quoteEn: string;
  sortOrder: number;
};

export async function getReviews(): Promise<ReviewItem[]> {
  if (!isDbConfigured) return [];
  const { rows } = await sql`
    SELECT id, name, country, country_code, rating, tag, review_date, quote_ja, quote_en, sort_order
    FROM reviews
    ORDER BY sort_order ASC, id ASC
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    country: row.country,
    countryCode: row.country_code,
    rating: row.rating,
    tag: row.tag,
    reviewDate: row.review_date,
    quoteJa: row.quote_ja,
    quoteEn: row.quote_en,
    sortOrder: row.sort_order,
  }));
}

export async function createReview(data: {
  name: string;
  country: string;
  countryCode: string;
  rating: number;
  tag: string;
  reviewDate: string;
  quoteJa: string;
  quoteEn: string;
  sortOrder: number;
}) {
  await sql`
    INSERT INTO reviews
      (name, country, country_code, rating, tag, review_date, quote_ja, quote_en, sort_order)
    VALUES
      (${data.name}, ${data.country}, ${data.countryCode}, ${data.rating}, ${data.tag},
       ${data.reviewDate}, ${data.quoteJa}, ${data.quoteEn}, ${data.sortOrder})
  `;
}

export async function deleteReview(id: number) {
  await sql`DELETE FROM reviews WHERE id = ${id}`;
}
