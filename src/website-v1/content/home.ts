import type { AreaKey, HomeSectionKey, HomeViewModel, PrivateGuideActivity, SnsAccountPlatform, WhyItem } from "@/contracts";
import { routeHref } from "../routes";
import { getExperienceSummaries } from "./experiences";
import { getHowItWorksFlows } from "./howItWorks";
import { ACTIVITY_LABELS, AREA_LABELS } from "./privateGuide";
import { getHomeArticleSummaries, getHomeTravelGuideGroups } from "./travelGuide";
import { HERO_IMAGES, HERO_PLACEHOLDER_SOURCE } from "../assets/heroImages";
import { valueCardImages } from "@/data/images";
import { socialLinks } from "@/data/social-links";
import { SNS_COPY_EN, SNS_COPY_JA } from "./data/sns";
import { V1_CONTENT, V1_PREVIEW } from "../config";
import { cta, pageName, pageSeo, proposed, tbd } from "./shared";

/** T-05 Home Working Baseline (W1-D05). Wording is not final copy. */

const PRIVATE_DAY_SOURCE = "Private Day planner copy (Human instruction 2026-11-13)";
const JOURNAL_SOURCE = "Kansai Travel Journal copy (Human instruction 2026-11-13)";

/** "Your Kansai. Your Way." photo: night street, provided by the human. Location and licence not verified. */
const YOUR_KANSAI_IMAGE_SOURCE = "Human-provided photo (2026-11-13). Licence NOT_VERIFIED, preview only";
const YOUR_KANSAI_IMAGE = {
  src: "/images/v1/sections/your-kansai-night-street.webp",
  alt: "A quiet city street at night, lit by street lamps and shop signs, with people walking",
  width: 2048,
  height: 1362,
  rights: "NOT_VERIFIED" as const,
  consent: "NOT_VERIFIED" as const,
};

/**
 * Short line under "Explore beyond the guidebooks." in the Home Private Guide
 * section. Website-local: `HomeContent.privateGuide` has no description slot.
 */
export const PRIVATE_DAY_DESCRIPTION = "Choose where to go, what to explore, and how to spend your day in Kansai.";
const T05 = "T-05 Home WORKING_BASELINE (W1-D05). Not final copy";
const t05 = (text: string) => proposed(text, T05);

/**
 * T-05 order. Social Proof is on hold (not deleted): add "socialProof" back
 * here, with its content, once real reviews exist. Meet Our Guides and the
 * Connectrip Select map section were removed from Home (Human instruction
 * 2026-11-09).
 */
export const HOME_SECTION_BASELINE: HomeSectionKey[] = [
  "hero",
  "featuredExperiences",
  "privateGuide",
  "howItWorks",
  "travelGuide",
  // OUR VALUE right before SNS (Human instruction 2026-11-15).
  "whyConnectrip",
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
 * 2026-11-09).
 * Supersedes the T-05 "Why Connectrip" pillars (Local Knowledge / Flexible
 * Experiences / Beyond the Tourist Spots), kept in Obsidian as history.
 */
/**
 * SNS, wording from content/data/sns.ts (links from
 * `socialLinks`). WORKING_BASELINE (W1-D08). Displayed handles are kept
 * verbatim even where they differ from the link URLs (reported as TBD).
 */
const SNS_SOURCE = "SNS section (content/data/sns.ts, data/social-links). WORKING_BASELINE (W1-D08)";
/** Public mode uses the English version of the same section (2026-11-11). */
const SNS_COPY = V1_PREVIEW ? SNS_COPY_JA : SNS_COPY_EN;

const OUR_VALUE_SOURCE = "OUR VALUE English copy (Human instruction 2026-11-15, final card copy). WORKING_BASELINE (W1-D07)";
const ourValue = {
  heading: "OUR VALUE",
  subheading: "Discover six reasons to explore Japan with Connectrip Japan.",
  // Order matches valueCardImages (card i ↔ value-card-{i + 1}.jpg); do not reorder one without the other.
  cards: [
    { title: "Authentic Local Experiences", description: "Discover Japan beyond the ordinary." },
    { title: "Kansai Local Experts", description: "Explore with people who know Kansai." },
    { title: "Beyond the Tourist Trail", description: "Find hidden gems and local favorites." },
    { title: "Travel Your Way", description: "Personalized around your interests." },
    { title: "Support Before You Arrive", description: "Get guidance before your journey." },
    { title: "More Than a Guide", description: "Feel welcomed, not just guided." },
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
      hero: {
        headline: t05("Experience Kansai Like a Local."),
        supporting: t05("Discover Osaka through local experiences, or create your own day with a private guide."),
        core: [],
        images: proposed(HERO_IMAGES.map((h) => h.image), HERO_PLACEHOLDER_SOURCE),
        // Red CTA: same rule as the header CTA (content/pages.ts, Human instruction 2026-11-11).
        primaryCta: cta("v1_home_hero_experiences", "experiences", routeHref("experiences"), "hero", "primary", proposed("Explore Our Tours", "Hero CTA (Human instruction 2026-11-11)")),
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
        supporting: proposed("Explore beyond the guidebooks.", PRIVATE_DAY_SOURCE),
        // Human-provided photo (2026-11-13). Licence NOT_VERIFIED: preview only; public mode keeps no photo.
        image: V1_CONTENT ? proposed(YOUR_KANSAI_IMAGE, YOUR_KANSAI_IMAGE_SOURCE) : tbd("Private Guide photo: licence not verified"),
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
      },
      travelGuide: {
        // Rendered by the Kansai Travel Journal section (content/journal.ts holds its copy and articles).
        heading: proposed("Kansai Travel Journal", JOURNAL_SOURCE),
        supporting: proposed("Local News, Events & Travel Updates", JOURNAL_SOURCE),
        // Ended / out-of-period articles never appear (W1-D10).
        articles: getHomeArticleSummaries(),
        // Not rendered on Home since 2026-11-13 (the Journal uses content/journal.ts); kept for the contract.
        groups: getHomeTravelGuideGroups(),
        viewAll: cta("v1_home_travel_guide", "travelGuide", routeHref("travelGuide"), "section", "secondary", t05("Explore Osaka Travel Guide")),
      },
      sns: {
        heading: proposed(SNS_COPY.heading, SNS_SOURCE),
        supporting: proposed(SNS_COPY.subheading, SNS_SOURCE),
        followLabel: proposed(SNS_COPY.follow, SNS_SOURCE),
        accounts: SNS_COPY.items.map((item) => {
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
