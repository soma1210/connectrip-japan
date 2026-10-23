import type { Experience, ExperienceSummary } from "../experience";
import { proposed, tbd } from "../status";
import {
  FIXTURE_SOURCE,
  fixtureCta,
  fixtureExperienceHref,
  fixtureHrefs,
  fixtureImage,
  fixtureText,
} from "./shared";

/**
 * Placeholder experiences. They do not describe GP-OSA-01〜03; product
 * content stays in the product notes until a human approves it.
 */
function summary(id: Experience["id"], slug: string, filled: boolean): ExperienceSummary {
  const href = fixtureExperienceHref(slug);
  return {
    id,
    status: "PROPOSED",
    href,
    title: fixtureText(`Experience title ${slug}`),
    summary: filled ? fixtureText("One or two sentences about who it fits and why.") : tbd(),
    duration: filled ? proposed({ minMinutes: 180, maxMinutes: 240 }, FIXTURE_SOURCE) : tbd(),
    ageFit: filled ? proposed({ minAge: 0 }, FIXTURE_SOURCE) : tbd(),
    walkingIntensity: filled ? proposed("low_medium", FIXTURE_SOURCE) : tbd(),
    format: tbd("Private / Group not decided"),
    visitExperience: filled ? proposed("first_visit", FIXTURE_SOURCE) : tbd(),
    area: fixtureText("Area"),
    image: filled ? proposed(fixtureImage(1200, 900, "Experience image placeholder"), FIXTURE_SOURCE) : tbd(),
    cta: { ...fixtureCta("experienceDetail", href, "section", "secondary", "Detail CTA"), id: `fixture_detail_${slug}` },
  };
}

/** One fully drafted card and one mostly-TBD card, to design both states. */
export const experienceSummariesFixture: ExperienceSummary[] = [
  summary("GP-OSA-FIXTURE-A", "fixture-a", true),
  summary("GP-OSA-FIXTURE-B", "fixture-b", false),
];

const base = summary("GP-OSA-FIXTURE-A", "fixture-a", true);

export const experienceDetailFixture: Experience = {
  ...base,
  highlights: proposed(["[FIXTURE] Highlight 1", "[FIXTURE] Highlight 2", "[FIXTURE] Highlight 3"], FIXTURE_SOURCE),
  itinerary: proposed(
    {
      isExample: true,
      steps: [
        { title: fixtureText("Meet and short chat"), description: fixtureText("Step description") },
        { title: fixtureText("Walk and stop"), description: tbd() },
        { title: fixtureText("Break") },
        { title: fixtureText("Finish") },
      ],
    },
    FIXTURE_SOURCE,
  ),
  included: proposed(["[FIXTURE] English-speaking local guide"], FIXTURE_SOURCE),
  excluded: proposed(["[FIXTURE] Transport fares, food and admission (paid by the family)"], FIXTURE_SOURCE),
  price: {
    unit: "per_group",
    amount: tbd("Price requires human approval"),
    maxPartySize: tbd(),
    notes: tbd(),
  },
  meetingPoint: tbd(),
  images: tbd(),
  faq: proposed(
    [{ question: fixtureText("Question?"), answer: fixtureText("Answer.") }],
    FIXTURE_SOURCE,
  ),
  cta: {
    ...fixtureCta("inquiry", `${fixtureHrefs.inquiry}?experience=fixture-a`, "section", "primary", "Inquiry CTA"),
    experienceId: base.id,
  },
  seo: {
    title: fixtureText("Experience SEO title"),
    description: tbd(),
    canonicalPath: base.href,
    noindex: true,
    breadcrumb: [
      { name: fixtureText("Home"), href: fixtureHrefs.home },
      { name: fixtureText("Experiences"), href: fixtureHrefs.experiences },
      { name: fixtureText("Experience title fixture-a"), href: base.href },
    ],
  },
};
