import type {
  ArticleBlock,
  ArticlePreviewFlag,
  ExperienceSummary,
  GuideArea,
  GuideArticleDetails,
  GuideArticleGroup,
  GuideFreshnessClass,
  GuideTopicKey,
  Tbd,
  TravelGuideArticleRecord,
  TravelGuideArticleSummary,
  TravelGuideArticleViewModel,
  TravelGuideListViewModel,
} from "@/contracts";
import { V1_PREVIEW } from "../config";
import { articleHref, routeHref, travelGuideHref } from "../routes";
import { getExperienceSummaries } from "./experiences";
import { findRecord, visibleRecords } from "./guides";
import {
  FRESHNESS_CLASS,
  articleFreshness,
  eventState,
  formatDate,
  isCurrent,
  jstToday,
  lastCheckedAt,
  verificationBadge,
} from "./guides/freshness";
import { cta, pageName, pageSeo, proposed, tbd } from "./shared";

/**
 * Travel Guide view models (Phase 1, W1-D10). Records come from
 * `content/guides`; freshness and verification labels are computed here for
 * `now` (Japan date). Pages revalidate daily, so states change without a
 * deploy.
 */
const TOPIC_SOURCE = "Travel Guide Content Platform §2.3 (PROPOSED category names)";
const TOPIC_LABELS: Record<GuideTopicKey, string> = {
  events: "Events",
  seasonal: "Seasonal",
  food: "Food",
  family: "Family Travel",
  hidden_gems: "Hidden Gems",
  itineraries: "Itineraries",
  things_to_do: "Things to Do",
};

const TOC_MIN_ENTRIES = 4;
const RELATED_MAX = 3;
/** Home shows at most this many cards per pillar (mobile shows two). */
const HOME_PER_GROUP = 3;

/** Two pillars (WORKING_BASELINE, 2026-10-24). Traveller-facing names, never "fresh" / "evergreen". */
const PILLAR_SOURCE = "Human instruction 2026-10-24 (Fresh + Evergreen pillars)";
const PILLAR_HEADINGS: Record<GuideFreshnessClass, string> = {
  fresh: "Latest in Osaka",
  evergreen: "Explore Osaka",
};
const EMPTY_SOURCE = "Claude UI text for empty groups. PROPOSED";
const PILLAR_EMPTY: Record<GuideFreshnessClass, string> = {
  fresh: "No current updates right now.",
  evergreen: "Guides are on the way.",
};
const groupKey = (c: GuideFreshnessClass): GuideArticleGroup["key"] => (c === "fresh" ? "latest" : "explore");

/** Published records are human-approved; everything else is a draft value. */
function recordValue<T>(record: TravelGuideArticleRecord, value: T): Tbd<T> {
  if (record.editorialState === "published") {
    return { status: "APPROVED", value, source: `Published Travel Guide article ${record.id}` };
  }
  return proposed(value, record.demo ? "DEMO / PLACEHOLDER / NOT FOR PRODUCTION" : "Travel Guide draft, not published");
}

function previewFlags(record: TravelGuideArticleRecord, today: string): ArticlePreviewFlag[] {
  const flags: ArticlePreviewFlag[] = [];
  if (record.demo) flags.push("demo");
  if (record.editorialState !== "published") flags.push("draft");
  const freshness = articleFreshness(record, today);
  if (freshness.period === "out_of_period") flags.push("out_of_period");
  else if (freshness.needsReview) flags.push("needs_review");
  return flags;
}

function readingMinutes(record: TravelGuideArticleRecord): number {
  const text = record.body
    .map((b) => ("text" in b ? b.text : b.type === "event" ? `${b.event.name} ${b.event.summary ?? ""}` : ""))
    .join(" ");
  const words = `${record.quickAnswer} ${text}`.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function summary(record: TravelGuideArticleRecord, today: string): TravelGuideArticleSummary {
  const href = articleHref(record.slug, record.area);
  const topic = record.topics[0];
  const flags = previewFlags(record, today);
  return {
    id: record.id,
    status: record.editorialState === "published" ? "APPROVED" : "PROPOSED",
    href,
    title: recordValue(record, record.title),
    excerpt: recordValue(record, record.summary),
    image: recordValue(record, record.hero),
    category: topic ? proposed({ key: topic, label: proposed(TOPIC_LABELS[topic], TOPIC_SOURCE) }, TOPIC_SOURCE) : undefined,
    publishedAt: record.publishedAt ? recordValue(record, record.publishedAt) : tbd("Not published"),
    updatedAt: record.updatedAt ? recordValue(record, record.updatedAt) : undefined,
    readingMinutes: recordValue(record, readingMinutes(record)),
    freshnessClass: FRESHNESS_CLASS[record.articleType],
    previewFlags: flags.length > 0 ? flags : undefined,
    cta: cta(`v1_article_${record.id}_card`, "guideArticle", href, "card", "secondary", pageName("Guide Article")),
  };
}

/** Featured first, then the most recently updated / covered. */
function byPriority(a: TravelGuideArticleRecord, b: TravelGuideArticleRecord): number {
  if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
  const ka = a.updatedAt ?? a.coversFrom ?? "";
  const kb = b.updatedAt ?? b.coversFrom ?? "";
  return kb.localeCompare(ka);
}

/**
 * May appear in Latest / Explore lists, Home and related articles.
 * Production: published, inside its period, not demo (the gate already ran).
 * Preview: drafts and demos too (labelled), never out-of-period articles.
 */
function onList(record: TravelGuideArticleRecord, today: string): boolean {
  if (V1_PREVIEW) return articleFreshness(record, today).period !== "out_of_period";
  return isCurrent(record, today) && !record.demo;
}

function pillarGroup(
  pillar: GuideFreshnessClass,
  records: TravelGuideArticleRecord[],
  today: string,
  max?: number,
): GuideArticleGroup {
  const articles = records.filter((r) => FRESHNESS_CLASS[r.articleType] === pillar).sort(byPriority);
  return {
    key: groupKey(pillar),
    heading: proposed(PILLAR_HEADINGS[pillar], PILLAR_SOURCE),
    articles: (max ? articles.slice(0, max) : articles).map((r) => summary(r, today)),
    emptyNote: proposed(PILLAR_EMPTY[pillar], EMPTY_SOURCE),
  };
}

/**
 * Home's "Explore Osaka Like a Local." section: Latest in Osaka (fresh) and
 * Explore Osaka (evergreen), up to three each. Ended / out-of-period articles
 * never appear.
 */
export function getHomeTravelGuideGroups(now: Date = new Date()): GuideArticleGroup[] {
  const today = jstToday(now);
  const records = visibleRecords(today, "osaka").filter((r) => onList(r, today));
  return [pillarGroup("fresh", records, today, HOME_PER_GROUP), pillarGroup("evergreen", records, today, HOME_PER_GROUP)];
}

/** Every card the Home section shows (both groups). */
export function getHomeArticleSummaries(now: Date = new Date()): TravelGuideArticleSummary[] {
  return getHomeTravelGuideGroups(now).flatMap((g) => g.articles);
}

export function getArticleSlugs(area: GuideArea = "osaka"): string[] {
  return visibleRecords(jstToday(), area).map((r) => r.slug);
}

const privateGuideCta = (id: string, emphasis: "primary" | "secondary") =>
  cta(`v1_article_${id}_private_guide`, "privateGuide", routeHref("privateGuide"), "section", emphasis, pageName("Private Guide"));

const experiencesCta = (id: string) =>
  cta(`v1_article_${id}_experiences`, "experiences", routeHref("experiences"), "section", "secondary", pageName("Experiences"));

export function getTravelGuideListViewModel(now: Date = new Date()): TravelGuideListViewModel {
  const today = jstToday(now);
  const records = visibleRecords(today, "osaka");
  const listed = records.filter((r) => onList(r, today));
  const latest = pillarGroup("fresh", listed, today);
  const explore = pillarGroup("evergreen", listed, today);
  // Production: published articles past their period keep their URL but leave the hub.
  const unlisted = V1_PREVIEW ? records.filter((r) => !onList(r, today)).sort(byPriority).map((r) => summary(r, today)) : [];
  const groups: GuideArticleGroup[] = [latest, explore];
  if (unlisted.length > 0) {
    groups.push({
      key: "previewOnly",
      heading: proposed("Preview only", "Website v1 preview label"),
      supporting: proposed("Articles past their period. Never listed in production.", "Website v1 preview label"),
      articles: unlisted,
    });
  }

  return {
    route: "travelGuide",
    seo: {
      ...pageSeo("Osaka Travel Guide", travelGuideHref("osaka")),
      breadcrumb: [
        { name: pageName("Home"), href: routeHref("home") },
        { name: pageName("Osaka Travel Guide"), href: travelGuideHref("osaka") },
      ],
    },
    content: {
      intro: { headline: pageName("Osaka Travel Guide"), supporting: tbd("Travel Guide intro copy TBD") },
      articles: [...latest.articles, ...explore.articles, ...unlisted],
      latest: latest.articles,
      guides: explore.articles,
      previewOnly: unlisted,
      groups,
      experiencesCta: experiencesCta("hub"),
      privateGuideCta: privateGuideCta("hub", "primary"),
    },
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Related articles: the ones a person chose first (fresh ⇄ evergreen links),
 * then filled automatically from the other pillar, then the same pillar.
 */
function relatedArticles(record: TravelGuideArticleRecord, today: string): TravelGuideArticleRecord[] {
  const candidates = visibleRecords(today, record.area).filter((r) => r.id !== record.id);
  const chosen = record.conversion.relatedArticleIds
    .map((id) => candidates.find((r) => r.id === id))
    .filter((r): r is TravelGuideArticleRecord => Boolean(r) && onList(r as TravelGuideArticleRecord, today));
  const own = FRESHNESS_CLASS[record.articleType];
  const rest = candidates.filter((r) => !chosen.includes(r) && onList(r, today)).sort(byPriority);
  const fill = [...rest.filter((r) => FRESHNESS_CLASS[r.articleType] !== own), ...rest.filter((r) => FRESHNESS_CLASS[r.articleType] === own)];
  return [...chosen, ...fill].slice(0, RELATED_MAX);
}

/** Related articles grouped by pillar, the other pillar first (fresh → Explore Osaka, evergreen → Latest in Osaka). */
function relatedGroups(record: TravelGuideArticleRecord, related: TravelGuideArticleRecord[], today: string): GuideArticleGroup[] {
  const own = FRESHNESS_CLASS[record.articleType];
  const order: GuideFreshnessClass[] = own === "fresh" ? ["evergreen", "fresh"] : ["fresh", "evergreen"];
  return order
    .map((pillar) => ({
      key: groupKey(pillar),
      heading: proposed(PILLAR_HEADINGS[pillar], PILLAR_SOURCE),
      articles: related.filter((r) => FRESHNESS_CLASS[r.articleType] === pillar).map((r) => summary(r, today)),
    }))
    .filter((g) => g.articles.length > 0);
}

export function getArticleViewModel(
  slug: string,
  now: Date = new Date(),
  area: GuideArea = "osaka",
): TravelGuideArticleViewModel | undefined {
  const today = jstToday(now);
  const record = findRecord(area, slug, today);
  if (!record) return undefined;

  const demo = Boolean(record.demo);
  const badgeOptions = { demo, sourcePublisher: (id: string) => record.sources.find((s) => s.id === id)?.publisher };

  const body: ArticleBlock[] = [];
  const endedEvents: GuideArticleDetails["endedEvents"] = [];
  for (const block of record.body) {
    switch (block.type) {
      case "heading":
        body.push({ ...block, anchorId: block.anchorId ?? slugify(block.text) });
        break;
      case "event": {
        const item = {
          type: "event" as const,
          event: block.event,
          state: eventState(block.event, today),
          badge: verificationBadge(block.event.verification, badgeOptions),
        };
        if (item.state === "ended") endedEvents.push(item);
        else body.push(item);
        break;
      }
      case "spot": {
        const crowd = block.spot.crowd;
        body.push({
          type: "spot",
          spot: block.spot,
          badge: verificationBadge(block.spot.verification, badgeOptions),
          crowdLabel: crowd ? `Crowds: ${crowd.level} (seen ${formatDate(crowd.verification.verifiedAt)})` : undefined,
        });
        break;
      }
      case "localInsight": {
        // The record type requires an on-site check, so a badge always exists.
        const badge = verificationBadge(block.insight.verification, badgeOptions);
        if (badge) body.push({ type: "localInsight", insight: block.insight, badge });
        break;
      }
      default:
        body.push(block);
    }
  }

  const toc = [
    ...body.flatMap((b) => (b.type === "heading" && b.level === 2 && b.anchorId ? [{ id: b.anchorId, text: b.text }] : [])),
    ...(endedEvents.length > 0 ? [{ id: "recently-ended", text: "Recently ended" }] : []),
    ...(record.faq && record.faq.length > 0 ? [{ id: "faq", text: "FAQ" }] : []),
    ...(record.sources.length > 0 ? [{ id: "sources", text: "Sources" }] : []),
  ];

  const relatedExperiences = record.conversion.relatedExperiences
    .map((rel) => getExperienceSummaries().find((e) => e.id === rel.experienceId))
    .filter((e): e is ExperienceSummary => Boolean(e));

  const href = articleHref(record.slug, record.area);
  const base = summary(record, today);
  const related = relatedArticles(record, today);
  const published = record.editorialState === "published";
  // "Updated" only when the content changed after publishing.
  const updatedAt = record.updatedAt && record.publishedAt && record.updatedAt > record.publishedAt ? record.updatedAt : undefined;

  return {
    route: "guideArticle",
    seo: {
      title: recordValue(record, record.seo?.title ?? record.title),
      description: recordValue(record, record.seo?.description ?? record.summary),
      canonicalPath: href,
      ogImage: recordValue(record, record.seo?.ogImage ?? record.hero),
      // Index control: preview, drafts, demos and explicit noindex are never indexed.
      noindex: V1_PREVIEW || !published || demo || Boolean(record.seo?.noindex),
      breadcrumb: [
        { name: pageName("Home"), href: routeHref("home") },
        { name: pageName("Osaka Travel Guide"), href: travelGuideHref(record.area) },
        { name: recordValue(record, record.title), href },
      ],
      ogType: "article",
      publishedTime: published ? record.publishedAt : undefined,
      modifiedTime: published ? (record.updatedAt ?? record.publishedAt) : undefined,
    },
    content: {
      id: base.id,
      status: base.status,
      href,
      title: base.title,
      excerpt: base.excerpt,
      image: base.image,
      category: base.category,
      publishedAt: base.publishedAt,
      updatedAt: base.updatedAt,
      readingMinutes: base.readingMinutes,
      freshnessClass: base.freshnessClass,
      previewFlags: base.previewFlags,
      body: recordValue(record, body),
      relatedExperiences,
      privateGuideCta: privateGuideCta(record.id, record.conversion.privateGuide.intensity === "standard" ? "primary" : "secondary"),
      experiencesCta: relatedExperiences.length > 0 ? experiencesCta(record.id) : undefined,
      relatedArticles: related.map((r) => summary(r, today)),
      guide: {
        articleType: record.articleType,
        freshnessClass: FRESHNESS_CLASS[record.articleType],
        area: record.area,
        editorialState: record.editorialState,
        demo,
        quickAnswer: record.quickAnswer,
        byline: { author: record.author, publishedAt: record.publishedAt, updatedAt, lastCheckedAt: lastCheckedAt(record) },
        freshness: articleFreshness(record, today),
        heroCredit: record.hero.assetRights?.credit,
        toc: toc.length >= TOC_MIN_ENTRIES ? toc : [],
        endedEvents,
        faq: record.faq && record.faq.length > 0 ? record.faq : undefined,
        sources: record.sources,
        privateGuide: record.conversion.privateGuide,
        relatedGroups: relatedGroups(record, related, today),
      },
    },
  };
}

