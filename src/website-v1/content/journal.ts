import type { IsoDate } from "@/contracts";
import { V1_CONTENT, V1_PREVIEW } from "../config";
import { experienceHref, journalArticleHref, journalPageHref } from "../routes";
import { FEATURED_TOUR_SLUG, getFeaturedTour } from "./featuredTour";
import { addDays, jstToday } from "./guides/freshness";

/**
 * Kansai Travel Journal (Human instruction 2026-11-13): English Kansai travel
 * news on Home and at `/kansai-travel-journal` (page 1),
 * `/kansai-travel-journal/page/{n}` and `/kansai-travel-journal/{slug}`.
 *
 * Data and views are separate: records below → selectors → views. A later
 * daily pipeline (collect → English draft → check official info → approve →
 * publish) only has to produce `JournalRecord`s; no view changes.
 *
 * Rules:
 * - Public mode lists `status: "published"` records that are not `demo` only.
 * - Preview also lists draft / review records and DEMO samples, labelled.
 * - Newest first (publishedAt, then updatedAt); 4 per page.
 * - Archived records never appear.
 */

export type JournalArea = "osaka" | "kyoto" | "kobe" | "nara" | "kansai";
export type JournalCategory = "events" | "seasonal" | "travel_updates" | "local_discoveries";
export type JournalStatus = "draft" | "review" | "published" | "archived";

export type JournalRecord = {
  /** Stable ID, e.g. "ktj-2026-11-13-osaka-illuminations". */
  id: string;
  /** Unique, lowercase-hyphenated. Not "page" (reserved for list pages). */
  slug: string;
  status: JournalStatus;
  /** DEMO sample for layout review: preview only, never public. */
  demo?: boolean;
  category: JournalCategory;
  area: JournalArea;
  title: string;
  /** Used as list summary AND meta description: keep them identical. Max ~160 chars. */
  summary: string;
  /** One string per paragraph. */
  body: string[];
  publishedAt?: IsoDate;
  updatedAt?: IsoDate;
  eventStart?: IsoDate;
  eventEnd?: IsoDate;
  /** Official information the article is based on. Required before publishing. */
  sources: { label: string; url: string }[];
  /** Internal links to Connectrip tours (Experience slugs). */
  relatedExperiences?: string[];
};

export const JOURNAL_PER_PAGE = 4;

export const JOURNAL_COPY = {
  brand: "CONNECTRIP JAPAN",
  title: "Kansai Travel Journal",
  subtitle: "Local News, Events & Travel Updates",
  tagline: "Explore Osaka, Kyoto, Kobe, Nara & Beyond.",
} as const;

export const AREA_NAMES: Record<JournalArea, string> = { osaka: "Osaka", kyoto: "Kyoto", kobe: "Kobe", nara: "Nara", kansai: "Kansai" };

export const CATEGORY_NAMES: Record<JournalCategory, string> = {
  events: "Events",
  seasonal: "Seasonal",
  travel_updates: "Travel Updates",
  local_discoveries: "Local Discoveries",
};

/**
 * Background photo: Kiyomizu-dera, Kyoto (human-provided PDF, 2026-11-13).
 * Commercial-use rights NOT verified: preview only. Public mode shows the
 * section on plain navy.
 */
export const JOURNAL_PHOTO = {
  small: "/images/v1/journal/kiyomizu-dera-1000.webp",
  large: "/images/v1/journal/kiyomizu-dera-2000.webp",
  alt: "Kiyomizu-dera pagoda in Kyoto under a blue evening sky",
  rightsVerified: false,
};
export const showJournalPhoto = V1_CONTENT || JOURNAL_PHOTO.rightsVerified;

// ---------------------------------------------------------------------------
// DEMO samples (layout and pagination review only). Generic wording, no real
// dates, venues, prices or claims; `demo: true` keeps them out of public mode.

const today = jstToday();
const DEMO_SOURCE = [{ label: "Official source (demo placeholder)", url: "https://example.com/" }];
const DEMO_BODY = [
  "This is a DEMO article for layout review. It does not describe a real event or announcement.",
  "A published Kansai Travel Journal article will summarise official information in plain English, give dates and practical tips, and link to the official source below.",
];

const demo = (
  n: number,
  category: JournalCategory,
  area: JournalArea,
  title: string,
  summary: string,
  extra: Partial<JournalRecord> = {},
): JournalRecord => ({
  id: `ktj-demo-${n}`,
  slug: `demo-${n}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  status: "draft",
  demo: true,
  category,
  area,
  title,
  summary,
  body: DEMO_BODY,
  publishedAt: addDays(today, -n),
  sources: DEMO_SOURCE,
  ...extra,
});

export const JOURNAL_RECORDS: JournalRecord[] = [
  demo(0, "events", "osaka", "Winter Light-ups in Osaka: Where to See Them", "A guide to the city's seasonal illuminations and how to enjoy them on an evening walk.", {
    relatedExperiences: [FEATURED_TOUR_SLUG],
  }),
  demo(1, "seasonal", "kyoto", "Kyoto Autumn Leaves: Planning Around the Crowds", "Where to look for autumn colours in Kyoto and when to go for a calmer visit."),
  demo(2, "travel_updates", "kansai", "Getting Around Kansai: Rail Pass Basics", "How regional rail passes work for visitors exploring Osaka, Kyoto, Kobe and Nara."),
  demo(3, "local_discoveries", "nara", "Nara Beyond the Deer Park: Quiet Streets", "Old merchant streets and small shops for a slower afternoon in Nara."),
  demo(4, "events", "kobe", "Kobe Harbour Evenings: Seasonal Events", "What to expect from evening events along Kobe's waterfront this season.", {
    eventStart: addDays(today, 14),
    eventEnd: addDays(today, 45),
  }),
  demo(5, "local_discoveries", "osaka", "Tenma's Shopping Street: A Local Morning", "A look at one of Osaka's long covered shopping streets and its neighbourhood shops.", {
    relatedExperiences: [FEATURED_TOUR_SLUG],
  }),
  demo(6, "seasonal", "nara", "Winter Temple Visits in Nara", "Tips for visiting Nara's temples on a cold, clear winter day."),
  demo(7, "travel_updates", "kyoto", "Kyoto Buses and Trains: Practical Tips", "Simple ways to move between Kyoto's main sights without long waits."),
  demo(8, "events", "kansai", "Kansai New Year Traditions for Visitors", "How shrines and temples across Kansai welcome the new year, and how to join respectfully."),
  demo(9, "local_discoveries", "kobe", "Kobe's Hillside Neighbourhoods", "Walking routes through Kobe's historic hillside streets and viewpoints."),
];

// ---------------------------------------------------------------------------
// Selectors (the only thing views use)

function isListed(r: JournalRecord): boolean {
  if (r.status === "archived") return false;
  return V1_PREVIEW || ((V1_CONTENT || r.status === "published") && !r.demo);
}

function byNewest(a: JournalRecord, b: JournalRecord): number {
  return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
}

/** "Nov 13, 2026" (Japan date, shown as written). */
export function formatJournalDate(date: IsoDate): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00Z`));
}

export type JournalListItem = {
  id: string;
  href: string;
  title: string;
  summary: string;
  category: string;
  area: string;
  published?: string;
  /** Preview-only labels: DEMO / DRAFT / REVIEW. */
  flags: string[];
};

function flagsOf(r: JournalRecord): string[] {
  if (!V1_PREVIEW) return [];
  return [...(r.demo ? ["DEMO"] : []), ...(r.status !== "published" ? [r.status.toUpperCase()] : [])];
}

function toListItem(r: JournalRecord): JournalListItem {
  return {
    id: r.id,
    href: journalArticleHref(r.slug),
    title: r.title,
    summary: r.summary,
    category: CATEGORY_NAMES[r.category],
    area: AREA_NAMES[r.area],
    published: r.publishedAt ? formatJournalDate(r.publishedAt) : undefined,
    flags: flagsOf(r),
  };
}

const listed = () => JOURNAL_RECORDS.filter(isListed).sort(byNewest);

export type JournalPage = {
  page: number;
  totalPages: number;
  items: JournalListItem[];
  /** href of each page, index 0 = page 1. */
  pageHrefs: string[];
};

/** Page `page` (1-based), or undefined when it does not exist. Page 1 always exists (may be empty). */
export function getJournalPage(page: number): JournalPage | undefined {
  const all = listed();
  const totalPages = Math.max(1, Math.ceil(all.length / JOURNAL_PER_PAGE));
  if (!Number.isInteger(page) || page < 1 || page > totalPages) return undefined;
  return {
    page,
    totalPages,
    items: all.slice((page - 1) * JOURNAL_PER_PAGE, page * JOURNAL_PER_PAGE).map(toListItem),
    pageHrefs: Array.from({ length: totalPages }, (_, i) => journalPageHref(i + 1)),
  };
}

export function getJournalPageCount(): number {
  return Math.max(1, Math.ceil(listed().length / JOURNAL_PER_PAGE));
}

export function getJournalSlugs(): string[] {
  return listed().map((r) => r.slug);
}

export type JournalArticle = JournalListItem & {
  record: JournalRecord;
  body: string[];
  updated?: string;
  period?: string;
  sources: JournalRecord["sources"];
  related: { title: string; href: string }[];
  /** Index only real, published articles. */
  noindex: boolean;
};

export function getJournalArticle(slug: string): JournalArticle | undefined {
  const r = listed().find((x) => x.slug === slug);
  if (!r) return undefined;
  const tour = getFeaturedTour();
  return {
    ...toListItem(r),
    record: r,
    body: r.body,
    updated: r.updatedAt && r.updatedAt > (r.publishedAt ?? "") ? formatJournalDate(r.updatedAt) : undefined,
    period: r.eventStart
      ? r.eventEnd && r.eventEnd !== r.eventStart
        ? `${formatJournalDate(r.eventStart)} – ${formatJournalDate(r.eventEnd)}`
        : formatJournalDate(r.eventStart)
      : undefined,
    sources: r.sources,
    // Only tours that have a page today.
    related: (r.relatedExperiences ?? []).filter((s) => s === FEATURED_TOUR_SLUG).map((s) => ({ title: tour.title, href: experienceHref(s) })),
    noindex: r.demo === true || r.status !== "published",
  };
}
