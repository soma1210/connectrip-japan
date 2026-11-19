import type {
  ArticleFreshness,
  ArticlePeriodState,
  EventState,
  GuideArticleType,
  GuideEventItem,
  GuideFreshnessClass,
  IsoDate,
  TravelGuideArticleRecord,
  VerificationBadge,
  VerificationRecord,
} from "@/contracts";

/**
 * Freshness and verification, computed from dates and records — never stored
 * as flags (Travel Guide Content Platform §5, W1-D10). All functions take
 * `today` explicitly so they can be tested with any date. Dates are Japan
 * (Asia/Tokyo) calendar dates.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Today's date in Japan. */
export function jstToday(now: Date = new Date()): IsoDate {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ISO dates compare correctly as strings. */
function maxDate(dates: (IsoDate | undefined)[]): IsoDate | undefined {
  return dates.filter((d): d is IsoDate => Boolean(d)).sort().at(-1);
}

/** "3 Nov 2026". */
export function formatDate(date: IsoDate): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** "November 2026", or "1 Nov – 15 Nov 2026" for other ranges. */
export function formatPeriod(from: IsoDate, to: IsoDate): string {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const lastOfMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  if (from.slice(8) === "01" && to === lastOfMonth) {
    return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" }).format(start);
  }
  const short = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
  return `${short.format(start)} – ${short.format(end)} ${end.getUTCFullYear()}`;
}

export function eventState(event: Pick<GuideEventItem, "startDate" | "endDate">, today: IsoDate): EventState {
  if (today < event.startDate) return "upcoming";
  if (today > event.endDate) return "ended";
  return "live";
}

export function periodState(record: Pick<TravelGuideArticleRecord, "coversFrom" | "coversTo">, today: IsoDate): ArticlePeriodState {
  if (!record.coversFrom || !record.coversTo) return "not_applicable";
  if (today < record.coversFrom) return "upcoming";
  if (today > record.coversTo) return "out_of_period";
  return "current";
}

/** Fresh = roundup / seasonal, Evergreen = guide / itinerary (two pillars, WORKING_BASELINE). */
export const FRESHNESS_CLASS: Record<GuideArticleType, GuideFreshnessClass> = {
  roundup: "fresh",
  seasonal: "fresh",
  guide: "evergreen",
  itinerary: "evergreen",
};

/**
 * Default review intervals (PROPOSED, Content Platform §3). Evergreen
 * articles are reviewed too: after the interval they need review.
 */
export const REVIEW_INTERVAL_DAYS: Record<GuideArticleType, number> = {
  roundup: 30,
  seasonal: 7,
  guide: 90,
  itinerary: 90,
};

/** Latest date someone checked the content: article-level or any fact-level record. */
export function lastCheckedAt(record: TravelGuideArticleRecord): IsoDate | undefined {
  const factDates = record.body.flatMap((block) => {
    if (block.type === "event") return [verifiedAt(block.event.verification)];
    if (block.type === "spot") return [verifiedAt(block.spot.verification)];
    if (block.type === "localInsight") return [block.insight.verification.verifiedAt];
    return [];
  });
  return maxDate([record.lastVerifiedAt, ...factDates]);
}

export function articleFreshness(record: TravelGuideArticleRecord, today: IsoDate): ArticleFreshness {
  const period = periodState(record, today);
  const base = maxDate([record.lastVerifiedAt, record.updatedAt, record.publishedAt]);
  const interval = record.reviewIntervalDays ?? REVIEW_INTERVAL_DAYS[record.articleType];
  const reviewDueAt = base ? addDays(base, interval) : undefined;
  return {
    period,
    periodLabel: record.coversFrom && record.coversTo ? formatPeriod(record.coversFrom, record.coversTo) : undefined,
    // Drafts have no review clock; a period that has passed always needs review.
    needsReview: period === "out_of_period" || (reviewDueAt !== undefined && today > reviewDueAt),
    reviewDueAt,
  };
}

/** Listed as current content: published and not past its period. */
export function isCurrent(record: TravelGuideArticleRecord, today: IsoDate): boolean {
  return record.editorialState === "published" && periodState(record, today) !== "out_of_period";
}

export function verifiedAt(record: VerificationRecord): IsoDate | undefined {
  return record.verificationMethod === "unverified" ? undefined : record.verifiedAt;
}

/**
 * The only way to get a "checked" label: from a record with who / how / when
 * (W1-D10 K-3). Personal names appear only when `displayName` is set.
 * `sourcePublisher` resolves `official_source` records.
 */
export function verificationBadge(
  record: VerificationRecord,
  options: { sourcePublisher?: (sourceId: string) => string | undefined; demo?: boolean } = {},
): VerificationBadge | undefined {
  const prefix = options.demo ? "DEMO record · " : "";
  switch (record.verificationMethod) {
    case "unverified":
      return undefined;
    case "on_site": {
      const by = record.verifiedBy.displayName ? ` by ${record.verifiedBy.displayName}` : "";
      return { method: "on_site", label: `${prefix}Checked on site${by} · ${formatDate(record.verifiedAt)}` };
    }
    case "contacted":
      return { method: "contacted", label: `${prefix}Confirmed with the venue · ${formatDate(record.verifiedAt)}` };
    case "official_source": {
      const publisher = options.sourcePublisher?.(record.sourceId);
      const from = publisher ? `Source: ${publisher}` : "Official source";
      return { method: "official_source", label: `${prefix}${from} · checked ${formatDate(record.verifiedAt)}` };
    }
  }
}
