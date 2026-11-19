import type { TravelGuideArticleRecord } from "@/contracts";
import { DEMO_STAFF, demoImage, demoToday as today } from "../demo";
import { addDays } from "../freshness";

/**
 * Osaka Events This Month (W1-D10 K-4): the first Travel Guide article. One
 * URL, updated every month.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ DEMO / PLACEHOLDER / NOT FOR PRODUCTION                               │
 * │ Every event, venue, source, insight and staff record below is         │
 * │ invented to exercise the article template. None of it is real.        │
 * │ `demo: true` makes the publish gate reject this record. Replace the   │
 * │ whole body with events checked against current official information  │
 * │ (next step after the Phase 1 localhost review).                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Demo dates are relative to today (Japan time) so the upcoming / live /
 * ended states can always be reviewed. Real articles use fixed dates.
 */
const monthStart = `${today.slice(0, 8)}01`;
const monthEnd = addDays(`${addDays(monthStart, 32).slice(0, 8)}01`, -1);

/** Current site photos, rights NOT_VERIFIED: blocked by the gate. */
const demoHero = demoImage("osaka-castle.jpg", "Osaka Castle", 1706, 960);
const demoInlineImage = demoImage("osaka-daruma.jpg", "Rows of red daruma dolls", 2400, 1600);

export const osakaEventsThisMonth: TravelGuideArticleRecord = {
  id: "osaka-events-this-month",
  slug: "osaka-events-this-month",
  area: "osaka",
  locale: "en",
  articleType: "roundup",
  topics: ["events"],
  editorialState: "draft",
  demo: true,
  featured: true,

  title: "[DEMO] Osaka Events This Month",
  quickAnswer:
    "[DEMO] Placeholder quick answer: two or three sentences that directly answer what is on in Osaka this month. Not real information.",
  summary: "[DEMO] Placeholder summary of this month's events in Osaka. NOT FOR PRODUCTION.",
  hero: demoHero,
  author: { kind: "organization", name: "Connectrip Japan" },
  internalAuthor: DEMO_STAFF,

  // Not published: no publishedAt / updatedAt. Never filled with build times.
  coversFrom: monthStart,
  coversTo: monthEnd,
  edition: { label: "[DEMO] Monthly edition" },

  body: [
    { type: "heading", level: 2, text: "[DEMO] This month at a glance", anchorId: "at-a-glance" },
    {
      type: "paragraph",
      text: "[DEMO] Placeholder paragraph. The real article summarises the month in a few sentences, using only information checked against official sources.",
    },
    {
      type: "list",
      ordered: false,
      items: ["[DEMO] Placeholder highlight one", "[DEMO] Placeholder highlight two", "[DEMO] Placeholder highlight three"],
    },
    { type: "heading", level: 2, text: "[DEMO] Events", anchorId: "events" },
    {
      type: "event",
      event: {
        id: "demo-event-live",
        name: "DEMO Event A (not a real event)",
        venue: "Example Venue A (not real)",
        area: "Placeholder area",
        startDate: addDays(today, -2),
        endDate: addDays(today, 5),
        timeNote: "[DEMO] 10:00–18:00 (placeholder)",
        summary: "[DEMO] Placeholder description of a live event. Shows an on-site verification record.",
        price: "[DEMO] Placeholder price",
        access: "[DEMO] Placeholder access line",
        officialUrl: "https://example.com/demo-event-a",
        mapUrl: "https://example.com/demo-map-a",
        bestFor: ["[DEMO] Families", "[DEMO] First-time visitors"],
        familyFriendly: true,
        verification: { verificationMethod: "on_site", verifiedBy: DEMO_STAFF, verifiedAt: addDays(today, -1) },
      },
    },
    {
      type: "event",
      event: {
        id: "demo-event-upcoming",
        name: "DEMO Event B (not a real event)",
        venue: "Example Venue B (not real)",
        startDate: addDays(today, 7),
        endDate: addDays(today, 9),
        summary: "[DEMO] Placeholder description of an upcoming event. Verified with an official source record.",
        price: "[DEMO] Placeholder price",
        officialUrl: "https://example.com/demo-event-b",
        verification: {
          verificationMethod: "official_source",
          sourceId: "demo-source-1",
          verifiedBy: DEMO_STAFF,
          verifiedAt: addDays(today, -3),
        },
      },
    },
    {
      type: "event",
      event: {
        id: "demo-event-unverified",
        name: "DEMO Event C (not a real event)",
        venue: "Example Venue C (not real)",
        startDate: addDays(today, 12),
        endDate: addDays(today, 12),
        summary: "[DEMO] Placeholder upcoming event with no verification record: no check label is shown.",
        verification: { verificationMethod: "unverified" },
      },
    },
    {
      type: "event",
      event: {
        id: "demo-event-ended",
        name: "DEMO Event D (not a real event)",
        venue: "Example Venue D (not real)",
        startDate: addDays(today, -10),
        endDate: addDays(today, -3),
        summary: "[DEMO] Placeholder event that has ended: moved to Recently ended automatically.",
        officialUrl: "https://example.com/demo-event-d",
        verification: { verificationMethod: "contacted", verifiedBy: DEMO_STAFF, verifiedAt: addDays(today, -12) },
      },
    },
    { type: "heading", level: 2, text: "[DEMO] Connectrip Local Insight", anchorId: "local-insight" },
    {
      type: "localInsight",
      insight: {
        id: "demo-insight-1",
        kind: "tip",
        text: "[DEMO] Placeholder local tip. Real tips appear only with an on-site record (who checked, when).",
        verification: { verificationMethod: "on_site", verifiedBy: DEMO_STAFF, verifiedAt: addDays(today, -1) },
      },
    },
    { type: "image", image: demoInlineImage, caption: "[DEMO] Placeholder caption" },
    { type: "heading", level: 2, text: "[DEMO] Planning tips", anchorId: "planning-tips" },
    {
      type: "callout",
      text: "[DEMO] Placeholder tip. Check each official site before you go: dates and times can change.",
    },
  ],
  faq: [
    {
      question: "[DEMO] Placeholder question?",
      answer: "[DEMO] Placeholder answer. FAQ appears only when there are real, frequently asked questions.",
    },
  ],
  sources: [
    {
      id: "demo-source-1",
      title: "[DEMO] Placeholder official event page",
      publisher: "Example Publisher (not real)",
      url: "https://example.com/demo-source",
      kind: "official",
      accessedAt: addDays(today, -3),
    },
  ],
  conversion: {
    relatedExperiences: [],
    privateGuide: {
      intensity: "soft",
      angle: "[DEMO] Placeholder line: want a local to plan a day around this month's events?",
    },
    // Hand-picked fresh → evergreen links (demo records).
    relatedArticleIds: ["demo-local-guide", "demo-local-itinerary"],
  },
};
