import type { TravelGuideArticleRecord } from "@/contracts";
import { DEMO_STAFF, demoImage, demoToday as today } from "../demo";
import { addDays } from "../freshness";

/**
 * DEMO / PLACEHOLDER / NOT FOR PRODUCTION. A fresh `seasonal` record (e.g. a
 * future autumn leaves / cherry blossom update) to review the template: spot
 * card, crowd observation, current-status insight. No real season data.
 */
export const demoSeasonalUpdate: TravelGuideArticleRecord = {
  id: "demo-seasonal-update",
  slug: "demo-seasonal-update",
  area: "osaka",
  locale: "en",
  articleType: "seasonal",
  topics: ["seasonal"],
  editorialState: "draft",
  demo: true,

  title: "[DEMO] Seasonal update (placeholder)",
  quickAnswer: "[DEMO] Placeholder quick answer: current conditions for a seasonal topic. Not real information.",
  summary: "[DEMO] Placeholder seasonal update with current conditions. NOT FOR PRODUCTION.",
  hero: demoImage("osaka-dotonbori.jpg", "Dotonbori canal at night", 1307, 1599),
  author: { kind: "organization", name: "Connectrip Japan" },
  coversFrom: addDays(today, -5),
  coversTo: addDays(today, 20),

  body: [
    { type: "heading", level: 2, text: "[DEMO] Current conditions", anchorId: "current-conditions" },
    {
      type: "localInsight",
      insight: {
        id: "demo-status-1",
        kind: "current_status",
        text: "[DEMO] Placeholder current-status note. Real notes need an on-site record.",
        verification: { verificationMethod: "on_site", verifiedBy: DEMO_STAFF, verifiedAt: addDays(today, -1) },
      },
    },
    { type: "heading", level: 2, text: "[DEMO] Where to go", anchorId: "where-to-go" },
    {
      type: "spot",
      spot: {
        id: "demo-spot-1",
        name: "DEMO Spot A (not a real place)",
        area: "Placeholder area",
        hours: "[DEMO] Placeholder hours",
        price: "[DEMO] Placeholder price",
        access: "[DEMO] Placeholder access line",
        familyFriendly: true,
        crowd: {
          level: "moderate",
          verification: { verificationMethod: "on_site", verifiedBy: DEMO_STAFF, verifiedAt: addDays(today, -1) },
        },
        verification: { verificationMethod: "on_site", verifiedBy: DEMO_STAFF, verifiedAt: addDays(today, -1) },
      },
    },
  ],
  sources: [
    {
      id: "demo-source-seasonal",
      title: "[DEMO] Placeholder official forecast page",
      publisher: "Example Publisher (not real)",
      url: "https://example.com/demo-forecast",
      kind: "official",
      accessedAt: addDays(today, -1),
    },
  ],
  conversion: {
    relatedExperiences: [],
    privateGuide: { intensity: "soft", angle: "[DEMO] Placeholder line: plan a day around the season with a local?" },
    relatedArticleIds: ["demo-local-itinerary"],
  },
};
