import { photoRights, spotById } from "../spots";
import type { ExploreArticle, IsoDate, SelectArticle, UpdateArticle } from "./types";

/**
 * Explore Kansai editorial rules (2026-11-14). Pure functions of a record and
 * "today" (Japan date), so they work the same in the build, the preview and
 * a future CMS. Adapted from the Travel Guide publish gate and freshness
 * rules (content/guides/validate.ts, freshness.ts).
 */

/** An open-ended update (no fixed end) must be re-checked within this many days. */
export const OPEN_RECHECK_MAX_DAYS = 30;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
const days = (from: IsoDate, to: IsoDate) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);

/**
 * What still blocks publication (empty = may be published). Content checks
 * only: an update that later expires is still a valid published record (see
 * `updateCurrency`).
 */
export function publishProblems(a: ExploreArticle, today: IsoDate): string[] {
  const p: string[] = [];
  if (!a.approval?.by || !a.approval.at) p.push("Editor approval missing");
  if (!a.publishedAt || !ISO.test(a.publishedAt)) p.push("Published date missing");
  else if (a.publishedAt > today) p.push("Published date is in the future");
  if (!a.updatedAt || !ISO.test(a.updatedAt)) p.push("Last updated date missing");
  if (!a.verifiedAt || !ISO.test(a.verifiedAt)) p.push("Information verified date missing");
  if (!a.quickAnswer.trim()) p.push("Quick answer missing");
  for (const f of a.faq ?? []) if (!f.question.trim() || !f.answer.trim()) p.push("FAQ item without a question or an answer");
  return [...p, ...(a.kind === "update" ? updateProblems(a) : selectProblems(a))];
}

function updateProblems(a: UpdateArticle): string[] {
  const p: string[] = [];
  if (!a.source?.name) p.push("Official source name missing");
  if (!a.source?.url || !/^https:\/\//.test(a.source.url)) p.push("Official source URL missing (https)");
  if (a.content.whatsChanged.length === 0) p.push("“What's changed” is empty");
  if (a.content.whoIsAffected.length === 0) p.push("“Who is affected” is empty");
  if (a.content.whatTravelersShouldDo.length === 0) p.push("“What travelers should do” is empty");
  const v = a.validity;
  if (!v) p.push("Validity missing (a valid-until date, or an open-ended re-check date)");
  else if (v.type === "until" && !ISO.test(v.validUntil)) p.push("Valid until is not a date");
  else if (v.type === "open") {
    if (!ISO.test(v.recheckBy)) p.push("Re-check date is not a date");
    else if (a.verifiedAt && days(a.verifiedAt, v.recheckBy) > OPEN_RECHECK_MAX_DAYS) p.push(`Re-check date is more than ${OPEN_RECHECK_MAX_DAYS} days after verification`);
  }
  if (v?.validFrom && v.type === "until" && v.validFrom > v.validUntil) p.push("Valid from is after valid until");
  return p;
}

function selectProblems(a: SelectArticle): string[] {
  const p: string[] = [];
  if (!ISO.test(a.nextReviewDue)) p.push("Next review date missing");
  if (a.editorialNotes.length > 0) p.push(`${a.editorialNotes.length} open editorial item(s)`);
  const texts = a.content.type === "spots" ? a.content.spots : [];
  for (const t of texts) if (!t.checkedAt) p.push(`${spotById(t.spotId).name}: facts not checked against official information`);
  for (const id of articleSpotIds(a)) {
    const spot = spotById(id);
    const rights = photoRights(spot);
    if (rights === "missing") p.push(`${spot.name}: no photo`);
    else if (rights === "unverified") p.push(`${spot.name}: photo rights not confirmed`);
  }
  if (a.content.type === "guide") {
    if (!a.content.hero.rightsConfirmed) p.push("Hero photo: rights not confirmed");
    for (const place of a.content.places) {
      if (!place.checkedAt) p.push(`${place.name}: facts not checked against official information`);
      if (!place.image) p.push(`${place.name}: no photo`);
      else if (!place.image.rightsConfirmed) p.push(`${place.name}: photo rights not confirmed`);
    }
  }
  if (a.content.type === "itinerary") {
    a.content.stops.forEach((s, i, all) => {
      if (i < all.length - 1 && !s.nextLeg) p.push(`${s.slot}: route to the next stop not verified`);
    });
  }
  return [...new Set(p)];
}

/** Spots an article features, in page order. */
export function articleSpotIds(a: SelectArticle): string[] {
  if (a.content.type === "spots") return a.content.spots.map((s) => s.spotId);
  if (a.content.type === "itinerary") return a.content.stops.map((s) => s.spotId);
  return []; // "guide": its places are not in the spot master
}

/** Select articles: review deadline (preview warning only; never unpublishes). */
export function reviewOverdue(a: SelectArticle, today: IsoDate): boolean {
  return ISO.test(a.nextReviewDue) && a.nextReviewDue < today;
}

/**
 * Whether an update can be shown as current information.
 * - current: within its validity (upcoming items count as current news)
 * - expired: past `validUntil`
 * - needs_recheck: open-ended and past `recheckBy` (not shown as current until re-verified)
 * - archived: an editor archived it
 */
export type UpdateCurrency = "current" | "expired" | "needs_recheck" | "archived";

export function updateCurrency(a: UpdateArticle, today: IsoDate): UpdateCurrency {
  if (a.status === "archived") return "archived";
  const v = a.validity;
  if (v?.type === "until" && v.validUntil < today) return "expired";
  if (v?.type === "open" && v.recheckBy < today) return "needs_recheck";
  return "current";
}

/** Live on the site (outside the preview): published (or archived) and through the gate. */
export function isLive(a: ExploreArticle, today: IsoDate): boolean {
  return (a.status === "published" || a.status === "archived") && publishProblems(a, today).length === 0;
}

/**
 * Indexable: live, and for updates still current. Past updates stay readable
 * (marked as past) but are noindex, so search results don't surface stale
 * information as current.
 */
export function isIndexable(a: ExploreArticle, today: IsoDate): boolean {
  return isLive(a, today) && (a.kind === "select" || updateCurrency(a, today) === "current");
}

/** A `published` record that fails the gate is a content error: stop the build instead of shipping it. */
export function assertPublishGate(records: ExploreArticle[], today: IsoDate): void {
  for (const r of records) {
    const problems = r.status === "published" || r.status === "archived" ? publishProblems(r, today) : [];
    if (problems.length > 0) throw new Error(`Explore Kansai: "${r.slug}" is ${r.status} but fails the publish gate: ${problems.join("; ")}`);
  }
}
