import type { AreaKey, HomeSectionKey, HomeViewModel, PrivateGuideActivity, WhyItem } from "@/contracts";
import { routeHref } from "../routes";
import { getExperienceSummaries } from "./experiences";
import { getHowItWorksFlows } from "./howItWorks";
import { ACTIVITY_LABELS, AREA_LABELS } from "./privateGuide";
import { getArticleSummaries } from "./travelGuide";
import { PHOTO_SOURCE, cta, pageName, pageSeo, photos, proposed, tbd } from "./shared";

/** T-05 Home Working Baseline (W1-D05). Wording is not final copy. */
const T05 = "T-05 Home WORKING_BASELINE (W1-D05). Not final copy";
const t05 = (text: string) => proposed(text, T05);

/**
 * T-05 order. Meet Our Guides and Social Proof are on hold (not deleted):
 * add "guides" / "socialProof" back here, with their content, once a real
 * guide network / real reviews exist.
 */
export const HOME_SECTION_BASELINE: HomeSectionKey[] = [
  "hero",
  "featuredExperiences",
  "privateGuide",
  "whyConnectrip",
  "howItWorks",
  "travelGuide",
  "finalCta",
];

/** Pillar titles are Working Baseline; English descriptions are TBD. */
const WHY_ITEMS: WhyItem[] = ["Local Knowledge", "Flexible Experiences", "Beyond the Tourist Spots"].map((title) => ({
  title: t05(title),
  description: tbd(`${title}: English description TBD`),
}));

export function getHomeViewModel(): HomeViewModel {
  return {
    route: "home",
    seo: pageSeo("Home", routeHref("home")),
    content: {
      sectionOrder: proposed(HOME_SECTION_BASELINE, T05),
      hero: {
        headline: t05("Experience Kansai Like a Local."),
        supporting: t05("Discover Osaka through local experiences, or create your own day with a private guide."),
        core: [],
        images: proposed([photos.osakaCastle, photos.dotonbori], PHOTO_SOURCE),
        primaryCta: cta("v1_home_hero_experiences", "experiences", routeHref("experiences"), "hero", "primary", t05("Explore Experiences")),
        secondaryCta: cta("v1_home_hero_private", "privateGuide", routeHref("privateGuide"), "hero", "secondary", t05("Plan a Private Day")),
      },
      featuredExperiences: {
        heading: t05("Featured Experiences"),
        // Three Osaka slots. Product names and details are designed in T-06.
        items: getExperienceSummaries(),
        viewAll: cta("v1_home_experiences_all", "experiences", routeHref("experiences"), "section", "secondary", t05("Explore All Experiences")),
      },
      privateGuide: {
        heading: t05("Your Kansai. Your Way."),
        supporting: tbd("English copy TBD (direction: we plan a day around each traveler's wishes)"),
        image: tbd("Private Guide photo TBD"),
        areas: (Object.keys(AREA_LABELS) as AreaKey[]).map((key) => ({ key, label: AREA_LABELS[key] })),
        interests: (Object.keys(ACTIVITY_LABELS) as PrivateGuideActivity[]).map((key) => ({ key, label: ACTIVITY_LABELS[key] })),
        cta: cta("v1_home_private", "privateGuide", routeHref("privateGuide"), "section", "primary", t05("Plan a Private Day")),
      },
      whyConnectrip: {
        heading: t05("Why Connectrip"),
        items: proposed(WHY_ITEMS, T05),
      },
      howItWorks: {
        heading: pageName("How It Works"),
        flows: getHowItWorksFlows(),
        link: cta("v1_home_how", "howItWorks", routeHref("howItWorks"), "section", "secondary", pageName("How It Works")),
      },
      travelGuide: {
        heading: t05("Explore Osaka Before You Arrive."),
        // Up to three latest / featured articles. Titles and content are TBD.
        articles: getArticleSummaries(),
        viewAll: cta("v1_home_travel_guide", "travelGuide", routeHref("travelGuide"), "section", "secondary", t05("Explore Osaka Travel Guide")),
      },
      finalCta: {
        heading: t05("Ready to Experience Kansai Your Way?"),
        image: proposed(photos.osakaCastle, PHOTO_SOURCE),
        browseExperiences: cta("v1_home_final_experiences", "experiences", routeHref("experiences"), "section", "primary", t05("Explore Experiences")),
        planPrivateDay: cta("v1_home_final_private", "privateGuide", routeHref("privateGuide"), "section", "secondary", t05("Plan a Private Day")),
      },
    },
  };
}
