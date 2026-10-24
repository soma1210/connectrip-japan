/**
 * Website v1 Travel Guide check (W1-D10, Phase 1).
 *
 *   bun run check:v1-guides
 *
 * 1. Self-tests of the freshness / verification / publish-gate logic with
 *    fixed dates (no dependence on today).
 * 2. Publish-gate report for every record, drafts included, plus the
 *    computed state for today (Japan date).
 *
 * Exits 1 when a self-test fails or a *published* record fails the gate.
 * Drafts with blocking issues are reported but do not fail the check.
 */
import type { TravelGuideArticleRecord } from "../src/contracts";
import { GUIDE_RECORDS, assertPublishable, gateContext } from "../src/website-v1/content/guides";
import {
  getArticleViewModel,
  getHomeTravelGuideGroups,
  getTravelGuideListViewModel,
} from "../src/website-v1/content/travelGuide";
import {
  FRESHNESS_CLASS,
  articleFreshness,
  eventState,
  jstToday,
  periodState,
  verificationBadge,
} from "../src/website-v1/content/guides/freshness";
import { blockingIssues, validateArticle } from "../src/website-v1/content/guides/validate";

let failures = 0;
function expect(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`}`);
}

console.log("Self-tests");

// Japan date: 2026-11-30 15:30 UTC is already 1 Dec in Tokyo.
expect("jstToday uses Asia/Tokyo", jstToday(new Date("2026-11-30T15:30:00Z")), "2026-12-01");
expect("jstToday before JST midnight", jstToday(new Date("2026-11-30T14:59:00Z")), "2026-11-30");

const ev = { startDate: "2026-11-10", endDate: "2026-11-12" };
expect("event upcoming", eventState(ev, "2026-11-09"), "upcoming");
expect("event live (first day)", eventState(ev, "2026-11-10"), "live");
expect("event live (last day)", eventState(ev, "2026-11-12"), "live");
expect("event ended", eventState(ev, "2026-11-13"), "ended");

const month = { coversFrom: "2026-11-01", coversTo: "2026-11-30" };
expect("period upcoming", periodState(month, "2026-10-31"), "upcoming");
expect("period current", periodState(month, "2026-11-15"), "current");
expect("period out_of_period", periodState(month, "2026-12-01"), "out_of_period");
expect("period not_applicable", periodState({}, "2026-11-15"), "not_applicable");

const published: TravelGuideArticleRecord = {
  ...GUIDE_RECORDS[0],
  demo: undefined,
  editorialState: "published",
  articleType: "roundup",
  ...month,
  publishedAt: "2026-11-01",
  updatedAt: "2026-11-01",
  lastVerifiedAt: "2026-11-01",
  reviewIntervalDays: 30,
};
expect("needs review: within interval", articleFreshness(published, "2026-11-20").needsReview, false);
expect("needs review: period over", articleFreshness(published, "2026-12-01").needsReview, true);
expect("needs review: interval passed", articleFreshness({ ...published, coversTo: "2027-01-31" }, "2026-12-02").needsReview, true);
expect("period label", articleFreshness(published, "2026-11-20").periodLabel, "November 2026");
expect("draft has no review clock", articleFreshness({ ...published, editorialState: "draft", publishedAt: undefined, updatedAt: undefined, lastVerifiedAt: undefined, coversTo: "2099-12-31" }, "2026-11-20").needsReview, false);

expect("unverified → no badge", verificationBadge({ verificationMethod: "unverified" }), undefined);
expect(
  "on_site → Checked on site, no personal name by default",
  verificationBadge({ verificationMethod: "on_site", verifiedBy: { id: "s1" }, verifiedAt: "2026-11-03" })?.label,
  "Checked on site · 3 Nov 2026",
);
expect(
  "contacted → never 'Checked on site'",
  verificationBadge({ verificationMethod: "contacted", verifiedBy: { id: "s1" }, verifiedAt: "2026-11-03" })?.label.includes("on site"),
  false,
);

// The demo record can never be published.
const demo = GUIDE_RECORDS.find((r) => r.demo);
if (demo) {
  const forced = { ...demo, editorialState: "published" as const, publishedAt: "2026-11-01", updatedAt: "2026-11-01" };
  const codes = blockingIssues(validateArticle(forced, gateContext("2026-11-20"))).map((i) => i.code);
  expect("demo record blocked: DEMO_CONTENT", codes.includes("DEMO_CONTENT"), true);
  expect("demo record blocked: placeholder text", codes.includes("PLACEHOLDER_TEXT"), true);
  expect("demo record blocked: asset rights", codes.includes("ASSET_RIGHTS"), true);
  let threw = false;
  try {
    assertPublishable(forced, "2026-11-20");
  } catch {
    threw = true;
  }
  expect("published demo stops the build", threw, true);
}

// Asset rules (K-5).
const watermarked = {
  ...published,
  hero: {
    ...published.hero,
    rights: "CONFIRMED_BY_HUMAN" as const,
    consent: "NOT_APPLICABLE" as const,
    assetRights: { source: "other_licensed" as const, rightsType: "x", rightsVerified: true, rightsVerifiedAt: "2026-11-01", watermarked: true },
  },
};
expect(
  "watermarked asset blocked",
  validateArticle(watermarked, gateContext("2026-11-20")).some((i) => i.code === "ASSET_WATERMARK"),
  true,
);

// Fresh + Evergreen pillars.
expect("pillars: roundup/seasonal fresh, guide/itinerary evergreen", Object.values(FRESHNESS_CLASS), ["fresh", "fresh", "evergreen", "evergreen"]);
const evergreen: TravelGuideArticleRecord = {
  ...published,
  articleType: "guide",
  coversFrom: undefined,
  coversTo: undefined,
  lastVerifiedAt: "2026-11-01",
  reviewIntervalDays: undefined,
};
expect("evergreen: no period", articleFreshness(evergreen, "2027-06-01").period, "not_applicable");
expect("evergreen: review due after 90 days", articleFreshness(evergreen, "2027-01-29").reviewDueAt, "2027-01-30");
expect("evergreen: not yet due", articleFreshness(evergreen, "2027-01-30").needsReview, false);
expect("evergreen: needs review once due", articleFreshness(evergreen, "2027-01-31").needsReview, true);
expect(
  "evergreen without lastVerifiedAt is blocked",
  validateArticle({ ...evergreen, lastVerifiedAt: undefined }, gateContext("2026-11-20")).some((i) => i.path === "lastVerifiedAt" && i.level === "error"),
  true,
);
expect(
  "published article may not link to a demo / draft",
  validateArticle({ ...evergreen, conversion: { ...evergreen.conversion, relatedArticleIds: ["demo-local-guide"] } }, gateContext("2026-11-20")).some(
    (i) => i.code === "RELATED_ARTICLE",
  ),
  true,
);

// Views (preview mode): both pillars, cross-pillar related, empty groups.
const now = new Date();
const hub = getTravelGuideListViewModel(now).content.groups ?? [];
expect("hub groups", hub.map((g) => `${g.key}:${g.articles.length}`).slice(0, 2), ["latest:2", "explore:2"]);
const home = getHomeTravelGuideGroups(now);
expect("home groups (max 3 each)", home.map((g) => `${g.key}:${g.articles.length}`), ["latest:2", "explore:2"]);
const freshArticle = getArticleViewModel("osaka-events-this-month", now)?.content.guide;
expect("fresh article: related shows Explore Osaka first", freshArticle?.relatedGroups.map((g) => g.key), ["explore", "latest"]);
const evergreenArticle = getArticleViewModel("demo-local-guide", now)?.content;
expect("evergreen article: related shows Latest in Osaka first", evergreenArticle?.guide?.relatedGroups.map((g) => g.key)[0], "latest");
expect("evergreen article: hand-picked fresh link first", evergreenArticle?.relatedArticles?.[0]?.id, "osaka-events-this-month");
// A year later every demo fresh period is over: Latest is empty, Explore stays, Hub keeps both groups.
const later = new Date(now.getTime() + 400 * 86_400_000);
expect("later: home Latest empty, Explore kept", getHomeTravelGuideGroups(later).map((g) => g.articles.length > 0), [false, true]);
const laterHub = getTravelGuideListViewModel(later).content.groups ?? [];
expect("later: hub Latest empty (with empty note)", [laterHub[0]?.articles.length, laterHub[0]?.emptyNote?.status], [0, "PROPOSED"]);
expect("later: out-of-period fresh moves to preview-only", laterHub.find((g) => g.key === "previewOnly")?.articles.length, 2);

// Report.
const today = jstToday();
console.log(`\nPublish gate report (today in Japan: ${today})`);
let publishedFailures = 0;
for (const record of GUIDE_RECORDS) {
  const issues = validateArticle(record, gateContext(today));
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const f = articleFreshness(record, today);
  const isPublished = record.editorialState === "published";
  if (isPublished && errors.length > 0) publishedFailures++;

  console.log(`\n■ ${record.id}  (/travel-guide/${record.area}/${record.slug})`);
  console.log(`  state: ${record.editorialState}${record.demo ? " · DEMO / NOT FOR PRODUCTION" : ""} · type: ${record.articleType}`);
  console.log(`  period: ${f.period}${f.periodLabel ? ` (${f.periodLabel})` : ""} · needs review: ${f.needsReview ? "yes" : "no"}${f.reviewDueAt ? ` (due ${f.reviewDueAt})` : ""}`);
  console.log(`  publish gate: ${errors.length === 0 ? "PASS" : `BLOCKED (${errors.length} errors)`} · warnings: ${warnings.length}`);
  for (const i of errors) console.log(`    ✗ [${i.code}] ${i.path}: ${i.message}`);
  for (const i of warnings) console.log(`    ! [${i.code}] ${i.path}: ${i.message}`);
}

console.log(
  `\nSelf-tests: ${failures === 0 ? "all passed" : `${failures} failed`} · published records failing the gate: ${publishedFailures}`,
);
process.exit(failures > 0 || publishedFailures > 0 ? 1 : 0);
