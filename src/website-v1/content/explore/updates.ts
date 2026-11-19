import type { UpdateArticle } from "./types";

/**
 * Kansai Travel Updates. Checked daily; a record is added only for real news
 * that affects travellers and has been checked against an official or
 * primary source. Days with nothing new publish nothing. Never invent an
 * update to fill the page, and never publish one automatically.
 *
 * Template for a new record (status starts at "draft"):
 *
 *   {
 *     kind: "update", slug: "kebab-case-slug", title: "…", summary: "…",
 *     category: "Transportation Updates", area: "osaka", // or "kansai" for the whole region
 *     search: { intent: "…", primaryKeyword: "…", secondaryKeywords: [] },
 *     status: "draft",
 *     source: { name: "Official name", url: "https://…" },
 *     verifiedAt: "YYYY-MM-DD",
 *     validity: { type: "until", validFrom: "YYYY-MM-DD", validUntil: "YYYY-MM-DD" },
 *     //     or { type: "open", recheckBy: "YYYY-MM-DD" } (max 30 days after verifiedAt)
 *     quickAnswer: "What changed and what to do, in one or two sentences.",
 *     content: { whatsChanged: ["…"], whoIsAffected: ["…"], whatTravelersShouldDo: ["…"] },
 *     faq: [],            // optional: real traveller questions only
 *     cta: "privateGuide", // optional
 *     related: ["osaka-best-places"],
 *   }
 *
 * To publish: an editor sets `status: "published"`, `approval`, `publishedAt`
 * and `updatedAt`; the publish gate (rules.ts) must report no problems.
 */
export const UPDATE_ARTICLES: UpdateArticle[] = [];
