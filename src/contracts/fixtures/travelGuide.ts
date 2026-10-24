import { proposed, tbd } from "../status";
import type {
  TravelGuideArticleRecord,
  TravelGuideArticleSummary,
  TravelGuideArticleViewModel,
  TravelGuideListViewModel,
} from "../travelGuide";
import { experienceSummariesFixture } from "./experiences";
import {
  FIXTURE_SOURCE,
  fixtureArticleHref,
  fixtureCta,
  fixtureHrefs,
  fixtureImage,
  fixtureText,
} from "./shared";

/**
 * Travel Guide placeholders. No real article content, categories, keywords
 * or schema (all TBD, AIO/SEO Requirements).
 */
function article(slug: string, filled: boolean): TravelGuideArticleSummary {
  const href = fixtureArticleHref(slug);
  return {
    id: `fixture-article-${slug}`,
    status: "PROPOSED",
    href,
    title: fixtureText(`Article title ${slug}`),
    excerpt: filled ? fixtureText("One or two sentence excerpt.") : tbd(),
    image: filled ? proposed(fixtureImage(1200, 800, "Article image placeholder"), FIXTURE_SOURCE) : tbd(),
    category: tbd("Travel Guide categories not decided"),
    publishedAt: filled ? proposed("2099-01-01", FIXTURE_SOURCE) : tbd(),
    readingMinutes: filled ? proposed(5, FIXTURE_SOURCE) : tbd(),
    cta: { ...fixtureCta("guideArticle", href, "card", "secondary", "Read article"), id: `fixture_article_${slug}` },
  };
}

/** One drafted card and one mostly-TBD card. */
export const travelGuideArticleSummariesFixture: TravelGuideArticleSummary[] = [
  article("fixture-a", true),
  article("fixture-b", false),
];

const privateGuideCta = fixtureCta("privateGuide", fixtureHrefs.privateGuide, "inline", "primary", "Private Guide CTA");

export const travelGuideListFixture: TravelGuideListViewModel = {
  route: "travelGuide",
  seo: {
    title: fixtureText("Travel Guide SEO title"),
    description: tbd(),
    canonicalPath: fixtureHrefs.travelGuide,
    noindex: true,
  },
  content: {
    intro: { headline: fixtureText("Headline"), supporting: fixtureText("Supporting line") },
    articles: travelGuideArticleSummariesFixture,
    categories: tbd("Travel Guide categories not decided"),
    experiencesCta: fixtureCta("experiences", fixtureHrefs.experiences, "section", "secondary", "Browse experiences"),
    privateGuideCta: { ...privateGuideCta, position: "section" },
  },
};

const { cta: articleCta, ...articleBase } = travelGuideArticleSummariesFixture[0];

/** Article detail with every block type, to design the article template. */
export const travelGuideArticleFixture: TravelGuideArticleViewModel = {
  route: "guideArticle",
  seo: {
    title: fixtureText("Article SEO title"),
    description: tbd(),
    canonicalPath: articleCta.href,
    noindex: true,
    breadcrumb: [
      { name: fixtureText("Home"), href: fixtureHrefs.home },
      { name: fixtureText("Osaka Travel Guide"), href: fixtureHrefs.travelGuide },
      { name: fixtureText("Article title fixture-a"), href: articleCta.href },
    ],
  },
  content: {
    ...articleBase,
    author: tbd("Author must be a real person"),
    body: proposed(
      [
        { type: "paragraph", text: "[FIXTURE] Intro paragraph." },
        { type: "heading", level: 2, text: "[FIXTURE] Section heading", anchorId: "section-1" },
        { type: "paragraph", text: "[FIXTURE] Paragraph." },
        { type: "list", ordered: false, items: ["[FIXTURE] Item 1", "[FIXTURE] Item 2"] },
        { type: "image", image: fixtureImage(1200, 800, "Inline image placeholder"), caption: "[FIXTURE] Caption" },
        { type: "heading", level: 3, text: "[FIXTURE] Sub heading" },
        { type: "callout", text: "[FIXTURE] Tip." },
        { type: "experience", experience: experienceSummariesFixture[0] },
        { type: "privateGuide", cta: privateGuideCta },
      ],
      FIXTURE_SOURCE,
    ),
    relatedExperiences: experienceSummariesFixture,
    privateGuideCta: { ...privateGuideCta, position: "section" },
    relatedArticles: [travelGuideArticleSummariesFixture[1]],
  },
};

/**
 * Phase 1 record (W1-D10): the stored shape of an article. `demo: true`, so it
 * can never pass the publish gate.
 */
export const travelGuideArticleRecordFixture: TravelGuideArticleRecord = {
  id: "fixture-record",
  slug: "fixture-record",
  area: "osaka",
  locale: "en",
  articleType: "roundup",
  topics: ["events"],
  editorialState: "draft",
  demo: true,
  title: "[FIXTURE] Record title",
  quickAnswer: "[FIXTURE] Quick answer.",
  summary: "[FIXTURE] Summary.",
  hero: fixtureImage(1200, 800, "Article image placeholder"),
  author: { kind: "organization", name: "Connectrip Japan" },
  coversFrom: "2099-01-01",
  coversTo: "2099-01-31",
  body: [
    {
      type: "event",
      event: {
        id: "fixture-event",
        name: "[FIXTURE] Event",
        venue: "[FIXTURE] Venue",
        startDate: "2099-01-10",
        endDate: "2099-01-12",
        verification: { verificationMethod: "unverified" },
      },
    },
    {
      type: "localInsight",
      insight: {
        id: "fixture-insight",
        kind: "tip",
        text: "[FIXTURE] Tip.",
        verification: { verificationMethod: "on_site", verifiedBy: { id: "fixture-staff" }, verifiedAt: "2099-01-05" },
      },
    },
  ],
  sources: [],
  conversion: { relatedExperiences: [], privateGuide: { intensity: "soft" }, relatedArticleIds: [] },
};
