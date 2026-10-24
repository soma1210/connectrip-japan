import type { HowItWorksFlows, HowItWorksViewModel } from "../howItWorks";
import { tbd } from "../status";
import { fixtureCta, fixtureHrefs, fixtureText } from "./shared";

/** Step keys follow the Website v1 baseline; all copy is fixture. */
export const howItWorksFlowsFixture: HowItWorksFlows = {
  readyMade: {
    key: "ready_made",
    title: fixtureText("Ready-made experiences"),
    steps: [
      { key: "choose", title: fixtureText("Choose") },
      { key: "date_guests", title: fixtureText("Date / Guests") },
      { key: "pay", title: fixtureText("Pay") },
      { key: "confirmed", title: fixtureText("Confirmed") },
      { key: "enjoy", title: fixtureText("Enjoy") },
    ],
    cta: fixtureCta("experiences", fixtureHrefs.experiences, "section", "primary", "Browse experiences"),
  },
  privateGuide: {
    key: "private_guide",
    title: fixtureText("Private Guide"),
    steps: [
      { key: "inquiry", title: fixtureText("Inquiry") },
      { key: "plan_together", title: fixtureText("Plan together") },
      { key: "confirm", title: fixtureText("Confirm") },
      { key: "pay", title: fixtureText("Pay") },
      { key: "enjoy", title: fixtureText("Enjoy") },
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
