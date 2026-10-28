import type { AreaKey, HomeSectionKey, HomeViewModel, PrivateGuideActivity, SnsAccountPlatform, WhyItem } from "@/contracts";
import { routeHref } from "../routes";
import { getExperienceSummaries } from "./experiences";
import { getHowItWorksFlows } from "./howItWorks";
import { ACTIVITY_LABELS, AREA_LABELS } from "./privateGuide";
import { getHomeArticleSummaries, getHomeTravelGuideGroups } from "./travelGuide";
import { getConnectripSelectOsakaViewModel } from "./select/osaka";
import { HERO_IMAGES, HERO_PLACEHOLDER_SOURCE } from "../assets/heroImages";
import { valueCardImages } from "@/data/images";
import { socialLinks } from "@/data/social-links";
import currentSiteJa from "../../../messages/ja.json";
import { cta, pageName, pageSeo, proposed, tbd } from "./shared";

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
  "connectripSelect",
  "featuredExperiences",
  "privateGuide",
  "whyConnectrip",
  "howItWorks",
  "travelGuide",
  "sns",
  "finalCta",
];

/**
 * Final CTA background: Fushimi Inari torii gates, Kyoto (Human instruction
 * 2026-10-24, replaces Osaka Castle). Provided by the human; licence not
 * verified yet, preview only.
 */
const FINAL_CTA_IMAGE_SOURCE = "Human-provided photo (2026-10-24). Licence NOT_VERIFIED, preview only";
const FINAL_CTA_IMAGE = {
  src: "/images/v1/sections/kyoto-fushimi-inari-torii.jpg",
  alt: "Vermilion torii gates at Fushimi Inari Taisha, Kyoto",
  width: 2400,
  height: 1611,
  rights: "NOT_VERIFIED" as const,
  consent: "NOT_APPLICABLE" as const,
};

/**
 * OUR VALUE: the current site's section (W1-D07, images from
 * `valueCardImages`) with English copy for Website v1 (Human instruction
 * 2026-10-24). The current site keeps its Japanese copy in messages/ja.json.
 * Supersedes the T-05 "Why Connectrip" pillars (Local Knowledge / Flexible
 * Experiences / Beyond the Tourist Spots), kept in Obsidian as history.
 */
/**
 * SNS, reused as-is from the current site (messages/ja.json `sns`, links from
 * `socialLinks`). WORKING_BASELINE (W1-D08). Displayed handles are kept
 * verbatim even where they differ from the link URLs (reported as TBD).
 */
const SNS_SOURCE = "Current site SNS section (messages/ja.json sns, data/social-links). WORKING_BASELINE (W1-D08)";
/** English heading / description for Website v1 (Human instruction 2026-10-25); messages/ja.json stays for the current site. */
const SNS_COPY_SOURCE = "SNS English copy (Human instruction 2026-10-25). WORKING_BASELINE (W1-D08)";
const SNS_HEADING = "Stay Connected";
const SNS_SUPPORTING = "Follow us for the latest Kansai travel tips, local discoveries, and inspiration for your trip to Japan.";

const OUR_VALUE_SOURCE = "OUR VALUE English copy (Human instruction 2026-10-24). WORKING_BASELINE (W1-D07)";
const ourValue = {
  heading: "OUR VALUE",
  subheading: "Six reasons to explore Kansai with Connectrip Japan.",
  cards: [
    {
      title: "Real Local Insight",
      description: "Go beyond tourist rankings with recommendations from locals who actually know the area.",
    },
    {
      title: "Kansai Expertise",
      description: "Based in Kansai, we bring you up-to-date local knowledge across Osaka, Kyoto, Nara, Kobe, and beyond.",
    },
    {
      title: "Beyond the Tourist Spots",
      description: "Discover local neighborhoods, food, culture, and everyday Japan beyond the famous sights.",
    },
    {
      title: "Your Day, Your Way",
      description: "Rather than following a fixed itinerary, shape your day around the places and experiences that interest you.",
    },
    {
      title: "Support Before Your Trip",
      description: "Have questions before you arrive? We’re here to help you prepare and make the most of your time in Kansai.",
    },
    {
      title: "A Local Friend in Japan",
      description: "Explore with someone who feels less like a tour company and more like a local friend by your side.",
    },
  ],
};
const VALUE_IMAGE_SIZES: [number, number][] = [
  [960, 720], [960, 720], [960, 720], [960, 720], [960, 720], [1213, 910],
];
const OUR_VALUE_ITEMS: WhyItem[] = ourValue.cards.map((card, i) => ({
  title: proposed(card.title, OUR_VALUE_SOURCE),
  description: proposed(card.description, OUR_VALUE_SOURCE),
  image: proposed(
    {
      src: valueCardImages[i],
      alt: card.title,
      width: VALUE_IMAGE_SIZES[i][0],
      height: VALUE_IMAGE_SIZES[i][1],
      rights: "NOT_VERIFIED" as const,
      consent: "NOT_VERIFIED" as const,
    },
    OUR_VALUE_SOURCE,
  ),
}));

export function getHomeViewModel(): HomeViewModel {
  return {
    route: "home",
    seo: pageSeo("Home", routeHref("home")),
    content: {
      sectionOrder: proposed(HOME_SECTION_BASELINE, T05),
      // Own section after the Hero (Human instruction 2026-10-24).
      connectripSelect: getConnectripSelectOsakaViewModel().content,
      hero: {
        headline: t05("Experience Kansai Like a Local."),
        supporting: t05("Discover Osaka through local experiences, or create your own day with a private guide."),
        core: [],
        images: proposed(HERO_IMAGES.map((h) => h.image), HERO_PLACEHOLDER_SOURCE),
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
        heading: proposed(ourValue.heading, OUR_VALUE_SOURCE),
        supporting: proposed(ourValue.subheading, OUR_VALUE_SOURCE),
        items: proposed(OUR_VALUE_ITEMS, OUR_VALUE_SOURCE),
      },
      howItWorks: {
        heading: pageName("How It Works"),
        flows: getHowItWorksFlows(),
        link: cta("v1_home_how", "howItWorks", routeHref("howItWorks"), "section", "secondary", pageName("How It Works")),
      },
      travelGuide: {
        heading: t05("Explore Osaka Like a Local."),
        // Ended / out-of-period articles never appear (W1-D10).
        articles: getHomeArticleSummaries(),
        // Latest in Osaka (fresh) + Explore Osaka (evergreen), up to three each.
        groups: getHomeTravelGuideGroups(),
        viewAll: cta("v1_home_travel_guide", "travelGuide", routeHref("travelGuide"), "section", "secondary", t05("Explore Osaka Travel Guide")),
      },
      sns: {
        heading: proposed(SNS_HEADING, SNS_COPY_SOURCE),
        supporting: proposed(SNS_SUPPORTING, SNS_COPY_SOURCE),
        followLabel: proposed(currentSiteJa.sns.follow, SNS_SOURCE),
        accounts: currentSiteJa.sns.items.map((item) => {
          const platform = item.platform as SnsAccountPlatform;
          return {
            platform,
            label: proposed(item.label, SNS_SOURCE),
            handle: proposed(item.handle, SNS_SOURCE),
            href: socialLinks[platform],
          };
        }),
      },
      finalCta: {
        heading: t05("Ready to Experience Kansai Your Way?"),
        image: proposed(FINAL_CTA_IMAGE, FINAL_CTA_IMAGE_SOURCE),
        browseExperiences: cta("v1_home_final_experiences", "experiences", routeHref("experiences"), "section", "primary", t05("Explore Experiences")),
        planPrivateDay: cta("v1_home_final_private", "privateGuide", routeHref("privateGuide"), "section", "secondary", t05("Plan a Private Day")),
      },
    },
  };
}
