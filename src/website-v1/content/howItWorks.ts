import type { HowItWorksFlows, HowItWorksViewModel } from "@/contracts";
import { routeHref } from "../routes";
import { cta, pageName, pageSeo, proposed, tbd } from "./shared";

const T05 = "T-05 Home WORKING_BASELINE (W1-D05). Not final copy";
const t05 = (text: string) => proposed(text, T05);

/** Two flows, four steps each (T-05 Home Working Baseline). Descriptions are TBD. */
export function getHowItWorksFlows(position: "section" = "section"): HowItWorksFlows {
  return {
    readyMade: {
      key: "ready_made",
      title: t05("Ready-made Experience"),
      steps: [
        { key: "find", title: t05("Find an Experience"), description: tbd() },
        { key: "choose_date", title: t05("Choose Your Date"), description: tbd() },
        { key: "book", title: t05("Book"), description: tbd() },
        { key: "explore", title: t05("Explore Osaka"), description: tbd() },
      ],
      cta: cta("v1_flow_ready_made", "experiences", routeHref("experiences"), position, "primary", t05("Explore Experiences")),
    },
    privateGuide: {
      key: "private_guide",
      title: pageName("Private Guide"),
      steps: [
        { key: "tell_us", title: t05("Tell Us What You Want"), description: tbd() },
        { key: "plan_together", title: t05("We Plan Together"), description: tbd() },
        { key: "confirm", title: t05("Confirm Your Day"), description: tbd() },
        { key: "explore", title: t05("Explore Kansai"), description: tbd() },
      ],
      note: tbd("'An inquiry is not a booking' note: copy TBD"),
      cta: cta("v1_flow_private", "privateGuide", routeHref("privateGuide"), position, "secondary", t05("Plan a Private Day")),
    },
  };
}

export function getHowItWorksViewModel(): HowItWorksViewModel {
  return {
    route: "howItWorks",
    seo: pageSeo("How It Works", routeHref("howItWorks")),
    content: {
      intro: { headline: pageName("How It Works"), supporting: tbd("How It Works intro copy TBD") },
      flows: getHowItWorksFlows(),
      faq: tbd("FAQ TBD (placement TBD)"),
    },
  };
}
