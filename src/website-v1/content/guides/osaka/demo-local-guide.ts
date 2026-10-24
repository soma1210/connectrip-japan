import type { TravelGuideArticleRecord } from "@/contracts";
import { demoImage } from "../demo";

/**
 * DEMO / PLACEHOLDER / NOT FOR PRODUCTION. An evergreen `guide` record (e.g.
 * a future food / family / hidden gems guide) to review the template. No real
 * content. Evergreen: no period, reviewed every 90 days once published.
 */
export const demoLocalGuide: TravelGuideArticleRecord = {
  id: "demo-local-guide",
  slug: "demo-local-guide",
  area: "osaka",
  locale: "en",
  articleType: "guide",
  topics: ["family"],
  editorialState: "draft",
  demo: true,

  title: "[DEMO] Local guide (placeholder)",
  quickAnswer: "[DEMO] Placeholder quick answer for a long-term planning question. Not real information.",
  summary: "[DEMO] Placeholder evergreen guide for planning a trip to Osaka. NOT FOR PRODUCTION.",
  hero: demoImage("osaka-daruma.jpg", "Rows of red daruma dolls", 2400, 1600),
  author: { kind: "organization", name: "Connectrip Japan" },

  body: [
    { type: "heading", level: 2, text: "[DEMO] Section one", anchorId: "section-one" },
    { type: "paragraph", text: "[DEMO] Placeholder paragraph for an evergreen guide." },
    { type: "heading", level: 2, text: "[DEMO] Section two", anchorId: "section-two" },
    { type: "list", ordered: false, items: ["[DEMO] Placeholder point one", "[DEMO] Placeholder point two"] },
  ],
  sources: [],
  conversion: {
    relatedExperiences: [],
    privateGuide: { intensity: "standard", angle: "[DEMO] Placeholder line: want a local to plan this with you?" },
    // Hand-picked evergreen → fresh link (demo records).
    relatedArticleIds: ["osaka-events-this-month"],
  },
};
