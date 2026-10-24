import type { HowItWorksFlows, HowItWorksViewModel } from "../howItWorks";
import { tbd } from "../status";
import { fixtureCta, fixtureHrefs, fixtureText } from "./shared";

/** Step keys follow the Website v1 baseline; all copy is fixture. */
export const howItWorksFlowsFixture: HowItWorksFlows = {
  readyMade: {
    key: "ready_made",
    title: fixtureText("Ready-made experiences"),
    steps: [
      { key: "find", title: fixtureText("Find an Experience") },
      { key: "choose_date", title: fixtureText("Choose Your Date") },
      { key: "book", title: fixtureText("Book") },
      { key: "explore", title: fixtureText("Explore Osaka") },
    ],
    cta: fixtureCta("experiences", fixtureHrefs.experiences, "section", "primary", "Browse experiences"),
  },
  privateGuide: {
    key: "private_guide",
    title: fixtureText("Private Guide"),
    steps: [
      { key: "tell_us", title: fixtureText("Tell Us What You Want") },
      { key: "plan_together", title: fixtureText("We Plan Together") },
      { key: "confirm", title: fixtureText("Confirm Your Day") },
      { key: "explore", title: fixtureText("Explore Kansai") },
    ],
    note: fixtureText("An inquiry is not a booking"),
    cta: fixtureCta("privateGuide", fixtureHrefs.privateGuide, "section", "secondary", "Plan a private day"),
  },
};

export const howItWorksFixture: HowItWorksViewModel = {
  route: "howItWorks",
  seo: {
    title: fixtureText("How It Works SEO title"),
    description: tbd(),
    canonicalPath: fixtureHrefs.howItWorks,
    noindex: true,
  },
  content: {
    intro: { headline: fixtureText("Headline"), supporting: fixtureText("Supporting line") },
    flows: howItWorksFlowsFixture,
    faq: tbd(),
  },
};
