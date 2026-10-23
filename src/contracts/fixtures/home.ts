import type { HomeViewModel } from "../pages";
import { proposed, tbd } from "../status";
import { experienceSummariesFixture } from "./experiences";
import { peopleFixture } from "./people";
import { FIXTURE_SOURCE, fixtureCta, fixtureHrefs, fixtureText } from "./shared";

const core: HomeViewModel["content"]["orientation"]["core"] = [
  { key: "osaka", label: fixtureText("Osaka") },
  { key: "local_guide", label: fixtureText("Local guide") },
  { key: "families", label: fixtureText("Families") },
  { key: "english", label: fixtureText("English") },
  { key: "guide_only", label: fixtureText("Guide-only") },
];

/** Drafted state: every MUST / SHOULD slot has placeholder copy. */
export const homeFixture: HomeViewModel = {
  route: "home",
  seo: {
    title: fixtureText("Home SEO title"),
    description: fixtureText("Home meta description"),
    canonicalPath: fixtureHrefs.home,
    noindex: true,
  },
  content: {
    orientation: {
      headline: fixtureText("Headline"),
      supporting: fixtureText("Supporting line"),
      core,
      positioning: fixtureText("Positioning line"),
    },
    primaryCta: fixtureCta("experiences", fixtureHrefs.experiences, "hero", "primary", "Primary CTA"),
    secondaryCta: fixtureCta("about", fixtureHrefs.about, "hero", "secondary", "Secondary CTA"),
    people: peopleFixture,
    guideOnly: {
      statement: fixtureText("Guide-only statement"),
      learnMore: fixtureCta("howItWorks", fixtureHrefs.howItWorks, "section", "secondary", "Learn more"),
    },
    howItWorksPreview: {
      steps: proposed(
        [
          { title: fixtureText("Step 1"), description: fixtureText("Step description") },
          { title: fixtureText("Step 2"), description: fixtureText("Step description") },
          { title: fixtureText("Step 3"), description: fixtureText("Step description") },
        ],
        FIXTURE_SOURCE,
      ),
      inquiryIsNotBooking: fixtureText("Inquiry is not a booking note"),
      link: fixtureCta("howItWorks", fixtureHrefs.howItWorks, "section", "secondary", "How it works link"),
    },
    aboutPreview: {
      link: fixtureCta("about", fixtureHrefs.about, "section", "secondary", "About link"),
    },
    experiencesTeaser: { items: experienceSummariesFixture },
    imagery: tbd("Real Osaka photos needed (TRUST ASSET NEEDED)"),
    social: tbd("SNS accounts NOT_VERIFIED"),
  },
};

/** Worst case: only the decided structure exists. Use to design TBD states. */
export const homeFixtureTbd: HomeViewModel = {
  ...homeFixture,
  content: {
    ...homeFixture.content,
    orientation: {
      headline: tbd(),
      supporting: tbd(),
      core: core.map((item) => ({ ...item, label: tbd() })),
      positioning: tbd(),
    },
    people: [{ id: "fixture-person-tbd", name: tbd(), role: tbd(), photo: tbd() }],
    guideOnly: { ...homeFixture.content.guideOnly, statement: tbd() },
    howItWorksPreview: {
      ...homeFixture.content.howItWorksPreview,
      steps: tbd(),
      inquiryIsNotBooking: tbd(),
    },
    experiencesTeaser: undefined,
  },
};
