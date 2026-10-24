import type { GuideArea, TravelGuideArticleRecord } from "@/contracts";
import { V1_PREVIEW } from "../../config";
import { getExperienceSummaries } from "../experiences";
import { blockingIssues, validateArticle, type GateContext } from "./validate";
import { demoLocalGuide } from "./osaka/demo-local-guide";
import { demoLocalItinerary } from "./osaka/demo-local-itinerary";
import { demoSeasonalUpdate } from "./osaka/demo-seasonal-update";
import { osakaEventsThisMonth } from "./osaka/osaka-events-this-month";

/**
 * Travel Guide content source, Phase 1: typed records in the repo (Content
 * Platform §8). A CMS can replace this module later; views only see view
 * models. Add new articles to `GUIDE_RECORDS`.
 */
export const GUIDE_RECORDS: TravelGuideArticleRecord[] = [
  // Fresh
  osakaEventsThisMonth,
  demoSeasonalUpdate,
  // Evergreen
  demoLocalGuide,
  demoLocalItinerary,
];

export function gateContext(today: string, records: TravelGuideArticleRecord[] = GUIDE_RECORDS): GateContext {
  return {
    today,
    allRecords: records,
    // Products are TBD until T-06: no Experience is approved, so none can be linked.
    isPublishableExperience: (id) => getExperienceSummaries().some((e) => e.id === id && e.status === "APPROVED"),
  };
}

/**
 * Publish gate at render / build time: a published record with blocking
 * issues stops the build instead of reaching a page.
 */
export function assertPublishable(record: TravelGuideArticleRecord, today: string): void {
  if (record.editorialState !== "published") return;
  const errors = blockingIssues(validateArticle(record, gateContext(today)));
  if (errors.length > 0) {
    const list = errors.map((e) => `  - [${e.code}] ${e.path}: ${e.message}`).join("\n");
    throw new Error(`Travel Guide article "${record.id}" is published but fails the publish gate:\n${list}`);
  }
}

/**
 * Records that have a page. Production: published only (gate enforced).
 * Preview: drafts and in-review records too, labelled in the UI.
 */
export function visibleRecords(today: string, area?: GuideArea): TravelGuideArticleRecord[] {
  return GUIDE_RECORDS.filter((record) => {
    if (area && record.area !== area) return false;
    if (record.editorialState === "archived") return false;
    if (record.editorialState === "published") {
      assertPublishable(record, today);
      return true;
    }
    return V1_PREVIEW;
  });
}

export function findRecord(area: GuideArea, slug: string, today: string): TravelGuideArticleRecord | undefined {
  return visibleRecords(today, area).find((r) => r.slug === slug);
}
