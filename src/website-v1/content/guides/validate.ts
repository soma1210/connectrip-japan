import type { ImageAsset, TravelGuideArticleRecord, VerificationRecord } from "@/contracts";
import { RESERVED_GUIDE_SLUGS } from "../../routes";
import { FRESHNESS_CLASS, isIsoDate } from "./freshness";

/**
 * Publish Gate (Travel Guide Content Platform §5.2, W1-D10). `errors` block
 * publishing; `warnings` are for editors. Published records with errors stop
 * the build (see `index.ts`); `bun run check:v1-guides` lists everything,
 * drafts included.
 */
export type GateIssue = { level: "error" | "warning"; code: string; path: string; message: string };

export type GateContext = {
  today: string;
  allRecords: TravelGuideArticleRecord[];
  /** Experience ids that may be linked from published articles (approved products only). */
  isPublishableExperience: (experienceId: string) => boolean;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Markers that must never reach a published page. */
const PLACEHOLDER_MARKERS = /\[(?:DEMO|FIXTURE)\]|\bDEMO\b|\bPLACEHOLDER\b|NOT FOR PRODUCTION|\bTBD\b|example\.(?:com|org|net)/i;

export function validateArticle(record: TravelGuideArticleRecord, ctx: GateContext): GateIssue[] {
  const issues: GateIssue[] = [];
  const error = (code: string, path: string, message: string) => issues.push({ level: "error", code, path, message });
  const warn = (code: string, path: string, message: string) => issues.push({ level: "warning", code, path, message });

  // Identity
  if (record.demo) error("DEMO_CONTENT", "demo", "DEMO / PLACEHOLDER / NOT FOR PRODUCTION content can never be published");
  if (!SLUG.test(record.slug)) error("SLUG_FORMAT", "slug", "Slug must be lowercase words separated by hyphens");
  if ((RESERVED_GUIDE_SLUGS as readonly string[]).includes(record.slug)) error("SLUG_RESERVED", "slug", "Slug is reserved for a topic hub");
  for (const other of ctx.allRecords) {
    if (other === record) continue;
    if (other.id === record.id) error("DUPLICATE_ID", "id", `Id also used by ${other.slug}`);
    if (other.area === record.area && other.slug === record.slug) error("DUPLICATE_SLUG", "slug", `Slug also used by ${other.id}`);
  }
  if (record.topics.length === 0) error("NO_TOPIC", "topics", "At least one topic (primary category) is required");

  // Copy
  for (const [path, value] of [
    ["title", record.title],
    ["quickAnswer", record.quickAnswer],
    ["summary", record.summary],
  ] as const) {
    if (!value.trim()) error("REQUIRED", path, `${path} is required`);
  }
  for (const [path, text] of collectText(record)) {
    if (PLACEHOLDER_MARKERS.test(text)) error("PLACEHOLDER_TEXT", path, `Placeholder marker in "${truncate(text)}"`);
  }

  // Dates (never build times: they must be set by a person)
  const dates: [string, string | undefined][] = [
    ["publishedAt", record.publishedAt],
    ["updatedAt", record.updatedAt],
    ["lastVerifiedAt", record.lastVerifiedAt],
    ["coversFrom", record.coversFrom],
    ["coversTo", record.coversTo],
  ];
  for (const [path, value] of dates) {
    if (value !== undefined && !isIsoDate(value)) error("DATE_FORMAT", path, "Use YYYY-MM-DD");
  }
  if (!record.publishedAt) error("REQUIRED", "publishedAt", "publishedAt is required to publish");
  if (!record.updatedAt) error("REQUIRED", "updatedAt", "updatedAt is required to publish (equal to publishedAt for a first version)");
  if (record.publishedAt && record.publishedAt > ctx.today) error("DATE_IN_FUTURE", "publishedAt", "publishedAt is in the future");
  if (record.updatedAt && record.updatedAt > ctx.today) error("DATE_IN_FUTURE", "updatedAt", "updatedAt is in the future");
  if (record.publishedAt && record.updatedAt && record.updatedAt < record.publishedAt) {
    error("DATE_ORDER", "updatedAt", "updatedAt is before publishedAt");
  }

  // Every article has a review clock: fresh and evergreen alike.
  if (!record.lastVerifiedAt) error("REQUIRED", "lastVerifiedAt", "lastVerifiedAt is required (starts the review clock)");
  else if (record.lastVerifiedAt > ctx.today) error("DATE_IN_FUTURE", "lastVerifiedAt", "lastVerifiedAt is in the future");

  // Fresh content
  if (FRESHNESS_CLASS[record.articleType] === "fresh") {
    if (!record.coversFrom || !record.coversTo) error("REQUIRED", "coversFrom", "Fresh articles need coversFrom and coversTo");
    else if (record.coversTo < record.coversFrom) error("DATE_ORDER", "coversTo", "coversTo is before coversFrom");
    if (record.sources.length === 0) error("NO_SOURCES", "sources", "Fresh articles need at least one source");
  } else if (record.coversFrom || record.coversTo) {
    warn("EVERGREEN_PERIOD", "coversFrom", "Evergreen articles normally have no period");
  }
  const events = record.body.flatMap((b, i) => (b.type === "event" ? [[i, b.event] as const] : []));
  if (record.articleType === "roundup" && events.length === 0) error("NO_EVENTS", "body", "A roundup needs at least one event");
  for (const [i, event] of events) {
    const path = `body[${i}].event(${event.id})`;
    if (!isIsoDate(event.startDate) || !isIsoDate(event.endDate)) error("DATE_FORMAT", path, "Event dates must be YYYY-MM-DD");
    else if (event.endDate < event.startDate) error("DATE_ORDER", path, "Event ends before it starts");
    if (!event.officialUrl) warn("NO_OFFICIAL_URL", path, "Event has no official link");
    if (event.verification.verificationMethod === "unverified") warn("UNVERIFIED_FACT", path, "Event is not verified (no check label will show)");
  }

  // Sources and verification records
  const sourceIds = new Set(record.sources.map((s) => s.id));
  record.sources.forEach((source, i) => {
    const path = `sources[${i}](${source.id})`;
    if (!/^https:\/\//.test(source.url)) error("SOURCE_URL", path, "Source URL must be https");
    if (!isIsoDate(source.accessedAt)) error("DATE_FORMAT", path, "accessedAt must be YYYY-MM-DD");
  });
  record.body.forEach((block, i) => {
    if (block.type === "event") checkVerification(block.event.verification, `body[${i}].event`);
    if (block.type === "spot") {
      checkVerification(block.spot.verification, `body[${i}].spot`);
      if (block.spot.crowd) checkVerification(block.spot.crowd.verification, `body[${i}].spot.crowd`);
    }
    if (block.type === "localInsight") checkVerification(block.insight.verification, `body[${i}].localInsight`);
  });
  function checkVerification(v: VerificationRecord, path: string) {
    if (v.verificationMethod === "unverified") return;
    if (!v.verifiedBy.id.trim()) error("VERIFICATION_RECORD", path, "verifiedBy is required");
    if (!isIsoDate(v.verifiedAt)) error("VERIFICATION_RECORD", path, "verifiedAt must be YYYY-MM-DD");
    else if (v.verifiedAt > ctx.today) error("VERIFICATION_RECORD", path, "verifiedAt is in the future");
    if (v.verificationMethod === "official_source" && !sourceIds.has(v.sourceId)) {
      error("VERIFICATION_RECORD", path, `Source ${v.sourceId} is not in sources`);
    }
  }

  // Assets (W1-D10 K-5)
  const images: [string, ImageAsset][] = [["hero", record.hero]];
  if (record.seo?.ogImage) images.push(["seo.ogImage", record.seo.ogImage]);
  record.body.forEach((b, i) => {
    if (b.type === "image") images.push([`body[${i}].image`, b.image]);
  });
  for (const [path, image] of images) {
    const r = image.assetRights;
    if (!image.alt.trim()) error("ASSET_ALT", path, "Alt text is required");
    if (!r) {
      error("ASSET_RIGHTS", path, "No assetRights record");
      continue;
    }
    if (r.source === "development_placeholder") error("ASSET_RIGHTS", path, "Development / placeholder asset");
    if (r.watermarked) error("ASSET_WATERMARK", path, "Watermarked preview asset");
    if (!r.rightsVerified || !r.rightsVerifiedAt) error("ASSET_RIGHTS", path, "Rights not verified (rightsVerified + rightsVerifiedAt)");
    if (image.rights !== "CONFIRMED_BY_HUMAN") error("ASSET_RIGHTS", path, "rights is not CONFIRMED_BY_HUMAN");
    if (image.consent === "NOT_VERIFIED") error("ASSET_CONSENT", path, "Consent of people in the image is not verified");
  }

  // Conversion
  record.conversion.relatedExperiences.forEach((rel, i) => {
    const path = `conversion.relatedExperiences[${i}]`;
    if (!rel.reason.trim()) error("RELATED_REASON", path, "A related experience needs a reason");
    if (!ctx.isPublishableExperience(rel.experienceId)) {
      error("RELATED_EXPERIENCE", path, `${rel.experienceId} is not an approved Experience`);
    }
  });
  for (const id of record.conversion.relatedArticleIds) {
    const target = ctx.allRecords.find((r) => r.id === id);
    if (!target) error("RELATED_ARTICLE", "conversion.relatedArticleIds", `Unknown article ${id}`);
    else if (target.id === record.id) error("RELATED_ARTICLE", "conversion.relatedArticleIds", "An article cannot link to itself");
    else if (target.demo || target.editorialState !== "published") {
      // Allowed in drafts; a published article may only link to published ones.
      error("RELATED_ARTICLE", "conversion.relatedArticleIds", `${id} is not a published article`);
    }
  }
  const pillars = new Set(
    record.conversion.relatedArticleIds
      .map((id) => ctx.allRecords.find((r) => r.id === id))
      .filter((r): r is TravelGuideArticleRecord => Boolean(r))
      .map((r) => FRESHNESS_CLASS[r.articleType]),
  );
  const other = FRESHNESS_CLASS[record.articleType] === "fresh" ? "evergreen" : "fresh";
  if (!pillars.has(other)) {
    warn("NO_CROSS_LINK", "conversion.relatedArticleIds", `No hand-picked ${other} article (fresh ⇄ evergreen link)`);
  }

  // SEO (warnings)
  const title = record.seo?.title ?? record.title;
  const description = record.seo?.description ?? record.summary;
  if (title.length > 60) warn("SEO_TITLE_LENGTH", "seo.title", `Title is ${title.length} characters (aim for 60 or fewer)`);
  if (description.length < 50 || description.length > 160) {
    warn("SEO_DESCRIPTION_LENGTH", "seo.description", `Description is ${description.length} characters (aim for 50–160)`);
  }

  return issues;
}

export function blockingIssues(issues: GateIssue[]): GateIssue[] {
  return issues.filter((i) => i.level === "error");
}

function truncate(text: string): string {
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

/** Every human-facing string of a record, with its path. */
function collectText(record: TravelGuideArticleRecord): [string, string][] {
  const out: [string, string][] = [
    ["title", record.title],
    ["quickAnswer", record.quickAnswer],
    ["summary", record.summary],
    ["hero.alt", record.hero.alt],
  ];
  if (record.seo?.title) out.push(["seo.title", record.seo.title]);
  if (record.seo?.description) out.push(["seo.description", record.seo.description]);
  if (record.conversion.privateGuide.angle) out.push(["conversion.privateGuide.angle", record.conversion.privateGuide.angle]);
  record.body.forEach((b, i) => {
    const p = `body[${i}]`;
    switch (b.type) {
      case "heading":
      case "paragraph":
      case "callout":
        out.push([p, b.text]);
        break;
      case "list":
        b.items.forEach((item, j) => out.push([`${p}.items[${j}]`, item]));
        break;
      case "image":
        out.push([`${p}.alt`, b.image.alt]);
        if (b.caption) out.push([`${p}.caption`, b.caption]);
        break;
      case "event":
        for (const v of [b.event.name, b.event.venue, b.event.summary, b.event.price, b.event.access, b.event.officialUrl]) {
          if (v) out.push([`${p}.event`, v]);
        }
        break;
      case "spot":
        for (const v of [b.spot.name, b.spot.area, b.spot.hours, b.spot.price, b.spot.access, b.spot.officialUrl]) {
          if (v) out.push([`${p}.spot`, v]);
        }
        break;
      case "localInsight":
        out.push([`${p}.localInsight`, b.insight.text]);
        break;
    }
  });
  record.faq?.forEach((f, i) => out.push([`faq[${i}]`, `${f.question} ${f.answer}`]));
  record.sources.forEach((s, i) => out.push([`sources[${i}]`, `${s.title} ${s.publisher} ${s.url}`]));
  return out;
}
