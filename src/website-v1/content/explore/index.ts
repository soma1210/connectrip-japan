import { V1_CONTENT } from "../../config";
import { jstToday } from "../guides/freshness";
import { photoRights, spotById, type PhotoRights } from "../spots";
import { areaName } from "./areas";
import { articleSpotIds, assertPublishGate, isIndexable as indexable, isLive, publishProblems as problems, reviewOverdue, updateCurrency } from "./rules";
import { SELECT_ARTICLES } from "./select";
import type { EditorialStatus, ExploreArea, ExploreArticle, SelectArticle, UpdateArticle, UpdateCategory } from "./types";
import { UPDATE_ARTICLES } from "./updates";

/**
 * Explore Kansai (2026-11-14): Connectrip Japan's one travel media, with two
 * series — Connectrip Japan Select (long-lived guides + the Osaka map) and
 * Kansai Travel Updates (time-sensitive news).
 *
 * Responsibilities:
 * - types.ts    record shapes (CMS-ready, no React / routing)
 * - select.ts   Select article data      - updates.ts  Update data
 * - rules.ts    publish gate, review deadline, validity
 * - links.ts    URLs                     - ../spots    shared spot master
 * - this file   copy + queries used by pages, Home, sitemap and SEO
 * - exploreSeo.ts (metadata, JSON-LD), views/ExploreViews.tsx (screens)
 *
 * Visibility:
 * - EXPLORE_VISIBLE: the preview shows every record with its status.
 * - EXPLORE_PUBLIC: Explore approved for search. false: the pages are still
 *   served (V1_SHOW_ALL, owner decision 2026-11-19, routes.ts isServedPath),
 *   but every Explore page is noindex, no article is indexable and the
 *   sitemap lists nothing. Turning it on is a human decision.
 */
export const EXPLORE_VISIBLE = V1_CONTENT;
export const EXPLORE_PUBLIC = false;

export * from "./types";
export { articleHref, selectSpotSectionHref } from "./links";
export { OPEN_RECHECK_MAX_DAYS, articleSpotIds, updateCurrency, type UpdateCurrency } from "./rules";
export { AREA_INFO, areaName } from "./areas";

export const EXPLORE_COPY = {
  title: "Explore Kansai",
  intro: "Travel ideas and checked updates for Osaka, Kyoto, Kobe and Nara, from the local team at Connectrip Japan.",
  select: {
    label: "Connectrip Japan Select",
    description: "Our long-term guides and map: places, day plans, local food and neighbourhoods, reviewed regularly and updated when something important changes.",
  },
  updates: {
    label: "Kansai Travel Updates",
    description: "News that affects your trip: events, transport, seasonal highlights, attractions and travel advisories, published after we check official sources.",
    empty: "No travel updates at the moment. We post an update only when there is news that affects travellers and we have checked it against an official source.",
    pastLabel: "Past updates",
    pastNotice: "This information is no longer current. It is kept for reference only; please check the official source for the latest information.",
    recheckNotice: "We are re-checking this information. Please confirm the latest details with the official source before you travel.",
  },
  map: {
    label: "Osaka Map",
    description: "Every place from Connectrip Japan Select on one map of Osaka, linked to our guides.",
  },
  cta: {
    label: "Explore Osaka With a Local Guide",
    supporting: "Tell us what you'd like to see, and a Connectrip Japan guide will show you around at your own pace. Guide service only.",
  },
  /** Fixed tour CTA (articles whose places are on the Osaka Like a Local route). */
  tourCta: {
    eyebrow: "3-hour private walking tour",
    label: "See the Osaka Like a Local Tour",
    supporting: "Explore Osaka Tenmangu Shrine and Tenjinbashisuji Shopping Street with a friendly local guide, on a private walking tour for your group.",
    spotNote: "Visit with a local guide on our Osaka Like a Local walking tour.",
  },
  author: {
    name: "Connectrip Japan Editorial Team",
    bio: "Written and checked by the local team behind Connectrip Japan's guided tours in Kansai. We check facts against official sources and review every guide regularly.",
    policyLabel: "How we research and update our guides",
  },
} as const;

/** Spots on the Osaka Like a Local route (content/featuredTour.ts schedule, final 2026-11-13). */
export const FEATURED_TOUR_SPOTS: readonly string[] = ["osaka-tenmangu", "tenjinbashisuji"];

export const STATUS_LABEL: Record<EditorialStatus, string> = { draft: "Draft", in_review: "In review", published: "Published", archived: "Archived" };

const today = () => jstToday(new Date());

assertPublishGate([...SELECT_ARTICLES, ...UPDATE_ARTICLES], today());

/** Preview: every record. Elsewhere: live records only (and only once Explore is public). */
function visible<T extends ExploreArticle>(records: T[]): T[] {
  if (EXPLORE_VISIBLE) return records;
  if (!EXPLORE_PUBLIC) return [];
  return records.filter((r) => isLive(r, today()));
}

const newestFirst = (a: ExploreArticle, b: ExploreArticle) => (b.publishedAt ?? b.updatedAt ?? "").localeCompare(a.publishedAt ?? a.updatedAt ?? "");

export function getSelectArticles(): SelectArticle[] {
  return visible(SELECT_ARTICLES);
}

export function getSelectArticle(slug: string): SelectArticle | undefined {
  return getSelectArticles().find((a) => a.slug === slug);
}

/** Every visible update, current or past (article pages, sitemap). */
export function getUpdateArticles(): UpdateArticle[] {
  return visible(UPDATE_ARTICLES).sort(newestFirst);
}

/** Current updates (latest list) and past ones (archive), split by validity. */
export function getUpdateLists(): { current: UpdateArticle[]; past: UpdateArticle[] } {
  const all = getUpdateArticles();
  const d = today();
  return { current: all.filter((a) => updateCurrency(a, d) === "current"), past: all.filter((a) => updateCurrency(a, d) !== "current") };
}

export function getUpdateArticle(slug: string): UpdateArticle | undefined {
  return getUpdateArticles().find((a) => a.slug === slug);
}

/** Newest Select articles and current updates together (Home section, hub). */
export function getLatestArticles(): ExploreArticle[] {
  return [...getSelectArticles(), ...getUpdateLists().current].sort(newestFirst);
}

const RELATED_MAX = 3;

/**
 * The article's own picks first, then other guides from the same area (current updates only).
 * Drafts are filled in only on other drafts, so finished articles never point to unfinished ones.
 */
export function relatedArticles(a: ExploreArticle): ExploreArticle[] {
  const current = [...getSelectArticles(), ...getUpdateLists().current].filter((r) => a.status === "draft" || r.status !== "draft");
  const all = [...current, ...getUpdateArticles()];
  const picked = a.related.map((slug) => all.find((r) => r.slug === slug)).filter((r): r is ExploreArticle => Boolean(r));
  const sameArea = current.filter((r) => r.area === a.area || r.area === "kansai");
  const out: ExploreArticle[] = [];
  for (const r of [...picked, ...sameArea]) if (r.slug !== a.slug && !out.some((o) => o.slug === r.slug)) out.push(r);
  return out.slice(0, RELATED_MAX);
}

// --- Areas and filters ----------------------------------------------------------

/** Region-wide updates ("kansai") appear in every area. */
const inArea = (a: ExploreArticle, area: ExploreArea) => a.area === area || a.area === "kansai";

export function getAreaArticles(area: ExploreArea): { select: SelectArticle[]; updates: UpdateArticle[] } {
  return { select: getSelectArticles().filter((a) => inArea(a, area)), updates: getUpdateLists().current.filter((a) => inArea(a, area)) };
}

/** Areas with at least one visible article (public area pages exist only for these). */
export function areasWithArticles(): ExploreArea[] {
  return (["osaka", "kyoto", "nara", "kobe"] as const).filter((area) => {
    const { select, updates } = getAreaArticles(area);
    return select.length + updates.length > 0;
  });
}

/** Select topics in use, for the category filter. */
export function selectTopics(): string[] {
  return [...new Set(getSelectArticles().map((a) => a.topic))];
}

export function filterSelect(articles: SelectArticle[], f: { area?: ExploreArea; topic?: string }): SelectArticle[] {
  return articles.filter((a) => (!f.area || inArea(a, f.area)) && (!f.topic || a.topic === f.topic));
}

export function filterUpdates(articles: UpdateArticle[], f: { area?: ExploreArea; category?: UpdateCategory }): UpdateArticle[] {
  return articles.filter((a) => (!f.area || inArea(a, f.area)) && (!f.category || a.category === f.category));
}

/** Category label of any article (cards, editorial list). */
export function categoryOf(a: ExploreArticle): string {
  return a.kind === "select" ? a.topic : a.category;
}

// --- Editorial list (preview only) ----------------------------------------------

export type EditorialRow = {
  article: ExploreArticle;
  area: string;
  series: string;
  category: string;
  status: EditorialStatus;
  /** Most recent fact check: the article's verified date, else its last review. */
  lastChecked?: string;
  nextReviewDue?: string;
  reviewOverdue: boolean;
  photos: Record<PhotoRights, string[]>;
  problems: string[];
  publishable: boolean;
};

export function getEditorialRows(): EditorialRow[] {
  const d = today();
  return [...SELECT_ARTICLES, ...UPDATE_ARTICLES].map((a) => {
    const photos: Record<PhotoRights, string[]> = { confirmed: [], unverified: [], missing: [] };
    if (a.kind === "select") for (const id of new Set(articleSpotIds(a))) photos[photoRights(spotById(id))].push(spotById(id).name);
    const p = problems(a, d);
    return {
      article: a,
      area: areaName(a.area),
      series: a.kind === "select" ? EXPLORE_COPY.select.label : EXPLORE_COPY.updates.label,
      category: categoryOf(a),
      status: a.status,
      lastChecked: a.verifiedAt ?? (a.kind === "select" ? a.lastReviewedAt : undefined),
      nextReviewDue: a.kind === "select" ? a.nextReviewDue : a.validity?.type === "open" ? a.validity.recheckBy : a.validity?.validUntil,
      reviewOverdue: a.kind === "select" && reviewOverdue(a, d),
      photos,
      problems: p,
      publishable: p.length === 0,
    };
  });
}

export function publishProblems(a: ExploreArticle): string[] {
  return problems(a, today());
}

export function isIndexable(a: ExploreArticle): boolean {
  return EXPLORE_PUBLIC && indexable(a, today());
}

export function isReviewOverdue(a: SelectArticle): boolean {
  return reviewOverdue(a, today());
}

export function currencyOf(a: UpdateArticle) {
  return updateCurrency(a, today());
}


/** Visible guides and current updates per area (area navigation). */
export function getAreaCounts(): Record<ExploreArea, number> {
  const counts = {} as Record<ExploreArea, number>;
  for (const area of ["osaka", "kyoto", "nara", "kobe"] as const) {
    const { select, updates } = getAreaArticles(area);
    counts[area] = select.length + updates.length;
  }
  return counts;
}
