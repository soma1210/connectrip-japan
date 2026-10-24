import type { PrivateGuideActivity } from "../inquiry";
import type { PrivateGuideViewModel } from "../privateGuide";
import { proposed, tbd } from "../status";
import { howItWorksFlowsFixture } from "./howItWorks";
import { peopleFixture } from "./people";
import { FIXTURE_SOURCE, fixtureCta, fixtureHrefs, fixtureImage, fixtureText } from "./shared";

const activityKeys: PrivateGuideActivity[] = [
  "food",
  "local_neighborhoods",
  "culture",
  "famous_sights",
  "shopping",
  "family_activities",
  "hidden_gems",
  "other",
];

export const privateGuideFixture: PrivateGuideViewModel = {
  route: "privateGuide",
  seo: {
    title: fixtureText("Private Guide SEO title"),
    description: tbd(),
    canonicalPath: fixtureHrefs.privateGuide,
    noindex: true,
  },
  content: {
    intro: {
      headline: fixtureText("Headline"),
      supporting: fixtureText("Supporting line"),
      image: proposed(fixtureImage(1600, 900, "Private Guide image placeholder"), FIXTURE_SOURCE),
    },
    activities: activityKeys.map((key, i) => ({
      key,
      label: fixtureText(`Activity ${key}`),
      description: i === 0 ? fixtureText("Activity description") : tbd(),
    })),
    areas: (["osaka", "kyoto", "kobe", "nara", "other"] as const).map((key) => ({
      key,
      label: fixtureText(`Area ${key}`),
    })),
    exampleDays: proposed(
      [
        {
          title: fixtureText("Example day"),
          itinerary: {
            isExample: true,
            steps: [{ title: fixtureText("Morning") }, { title: fixtureText("Afternoon") }],
          },
        },
      ],
      FIXTURE_SOURCE,
    ),
    flow: howItWorksFlowsFixture.privateGuide,
    pricingNote: tbd("Private Guide pricing not decided"),
    guides: peopleFixture,
    faq: tbd(),
    inquiryCta: fixtureCta("inquiry", fixtureHrefs.inquiry, "section", "primary", "Plan your Osaka day"),
    experiencesCta: fixtureCta("experiences", fixtureHrefs.experiences, "section", "secondary", "See experiences"),
  },
};
