import type { TravelGuideArticleRecord } from "@/contracts";
import { demoImage } from "../demo";

/**
 * DEMO / PLACEHOLDER / NOT FOR PRODUCTION. An evergreen `itinerary` record to
 * review the template. The publish gate must reject it (W1-D10 K-5).
 */
export const demoLocalItinerary: TravelGuideArticleRecord = {
  id: "demo-local-itinerary",
  slug: "demo-local-itinerary",
  area: "osaka",
  locale: "en",
  articleType: "itinerary",
  topics: ["itineraries"],
  editorialState: "draft",
  demo: true,

  title: "[DEMO] Local itinerary (placeholder)",
  quickAnswer: "[DEMO] Placeholder quick answer: how to spend a few days. Not a real itinerary.",
  summary: "[DEMO] Placeholder day-by-day itinerary for Osaka. NOT FOR PRODUCTION.",
  hero: demoImage("osaka-dojima-river-night.jpg", "Dojima River and the Nakanoshima skyline at night", 1920, 1276),
  author: { kind: "organization", name: "Connectrip Japan" },

  body: [
    { type: "heading", level: 2, text: "[DEMO] Day 1", anchorId: "day-1" },
    { type: "paragraph", text: "[DEMO] Placeholder plan for day one." },
    { type: "heading", level: 2, text: "[DEMO] Day 2", anchorId: "day-2" },
    { type: "paragraph", text: "[DEMO] Placeholder plan for day two." },
  ],
  sources: [],
  conversion: {
    relatedExperiences: [],
    privateGuide: { intensity: "standard", angle: "[DEMO] Placeholder line: turn this itinerary into your own day?" },
    relatedArticleIds: ["demo-seasonal-update", "demo-local-guide"],
  },
};
