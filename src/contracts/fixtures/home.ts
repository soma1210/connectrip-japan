import type { HomeSectionKey, HomeViewModel } from "../pages";
import { proposed, tbd } from "../status";
import { experienceSummariesFixture } from "./experiences";
import { howItWorksFlowsFixture } from "./howItWorks";
import { peopleFixture } from "./people";
import { FIXTURE_SOURCE, fixtureCta, fixtureHrefs, fixtureImage, fixtureText } from "./shared";
import { socialProofFixture } from "./socialProof";
import { travelGuideArticleSummariesFixture } from "./travelGuide";

const core: HomeViewModel["content"]["hero"]["core"] = [
  { key: "osaka", label: fixtureText("Osaka") },
  { key: "local_guide", label: fixtureText("Local guide") },
  { key: "families", label: fixtureText("Families") },
  { key: "english", label: fixtureText("English") },
  { key: "guide_only", label: fixtureText("Guide-only") },
];

/** Website v1 §6 Working Baseline order. Astra / Human review may change it. */
const baselineOrder: HomeSectionKey[] = [
  "hero",
  "featuredExperiences",
  "privateGuide",
  "whyConnectrip",
  "guides",
  "howItWorks",
  "travelGuide",
  "socialProof",
  "finalCta",
];

/** Drafted state: every slot has placeholder copy (reviews stay TBD). */
export const homeFixture: HomeViewModel = {
  route: "home",
  seo: {
    title: fixtureText("Home SEO title"),
    description: fixtureText("Home meta description"),
    canonicalPath: fixtureHrefs.home,
    noindex: true,
  },
  content: {
    sectionOrder: proposed(baselineOrder, "Website v1 Business Decision §6 (WORKING_BASELINE)"),
    hero: {
      headline: fixtureText("Headline"),
      supporting: fixtureText("Supporting line"),
      core,
      positioning: fixtureText("Positioning line"),
      images: proposed([fixtureImage(1920, 1080, "Hero image placeholder")], FIXTURE_SOURCE),
      primaryCta: fixtureCta("experiences", fixtureHrefs.experiences, "hero", "primary", "Primary CTA"),
      secondaryCta: fixtureCta("privateGuide", fixtureHrefs.privateGuide, "hero", "secondary", "Secondary CTA"),
    },
    featuredExperiences: {
      heading: fixtureText("Featured experiences heading"),
      supporting: fixtureText("Supporting line"),
      items: experienceSummariesFixture,
      viewAll: fixtureCta("experiences", fixtureHrefs.experiences, "section", "secondary", "View all experiences"),
    },
    privateGuide: {
      heading: fixtureText("Private Guide heading"),
      supporting: fixtureText("Supporting line"),
      points: proposed(["[FIXTURE] Point 1", "[FIXTURE] Point 2", "[FIXTURE] Point 3"], FIXTURE_SOURCE),
      image: proposed(fixtureImage(1200, 900, "Private Guide image placeholder"), FIXTURE_SOURCE),
      cta: fixtureCta("inquiry", fixtureHrefs.inquiry, "section", "primary", "Plan your Osaka day"),
      learnMore: fixtureCta("privateGuide", fixtureHrefs.privateGuide, "section", "secondary", "Learn more"),
    },
    whyConnectrip: {
      heading: fixtureText("Why Connectrip heading"),
      items: proposed(
        [1, 2, 3].map((n) => ({ title: fixtureText(`Reason ${n}`), description: fixtureText("Reason description") })),
        FIXTURE_SOURCE,
      ),
    },
    guides: {
      heading: fixtureText("Meet our guides heading"),
      people: peopleFixture,
      aboutLink: fixtureCta("about", fixtureHrefs.about, "section", "secondary", "About link"),
    },
    howItWorks: {
      heading: fixtureText("How it works heading"),
      flows: howItWorksFlowsFixture,
      link: fixtureCta("howItWorks", fixtureHrefs.howItWorks, "section", "secondary", "How it works link"),
    },
    travelGuide: {
      heading: fixtureText("Osaka Travel Guide heading"),
      supporting: fixtureText("Supporting line"),
      articles: travelGuideArticleSummariesFixture,
      viewAll: fixtureCta("travelGuide", fixtureHrefs.travelGuide, "section", "secondary", "View all articles"),
    },
    socialProof: socialProofFixture,
    finalCta: {
      heading: fixtureText("Final CTA heading"),
      supporting: fixtureText("Supporting line"),
      image: tbd(),
      browseExperiences: fixtureCta("experiences", fixtureHrefs.experiences, "section", "primary", "Browse experiences"),
      planPrivateDay: fixtureCta("privateGuide", fixtureHrefs.privateGuide, "section", "secondary", "Plan a private day"),
    },
  },
};

/** Worst case: only the decided structure exists. Use to design TBD / empty states. */
export const homeFixtureTbd: HomeViewModel = {
  ...homeFixture,
  content: {
    ...homeFixture.content,
    sectionOrder: tbd(),
    hero: {
      ...homeFixture.content.hero,
      headline: tbd(),
      supporting: tbd(),
      core: core.map((item) => ({ ...item, label: tbd() })),
      positioning: tbd(),
      images: tbd(),
      secondaryCta: undefined,
    },
    featuredExperiences: { ...homeFixture.content.featuredExperiences, heading: tbd(), supporting: tbd(), items: [] },
    privateGuide: {
      ...homeFixture.content.privateGuide,
      heading: tbd(),
      supporting: tbd(),
      points: tbd(),
      image: tbd(),
    },
    whyConnectrip: { heading: tbd(), items: tbd() },
    guides: { heading: tbd(), people: [{ id: "fixture-person-tbd", name: tbd(), role: tbd(), photo: tbd() }] },
    howItWorks: { ...homeFixture.content.howItWorks, heading: tbd() },
    travelGuide: { ...homeFixture.content.travelGuide, heading: tbd(), supporting: tbd(), articles: [] },
    socialProof: { ...socialProofFixture, heading: tbd() },
    finalCta: { ...homeFixture.content.finalCta, heading: tbd(), supporting: tbd() },
  },
};
