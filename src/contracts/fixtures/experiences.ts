import type { BookingConditions, Experience, ExperienceSummary, PriceStructure } from "../experience";
import { proposed, tbd } from "../status";
import {
  FIXTURE_SOURCE,
  fixtureBookingHref,
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
const priceTbd: PriceStructure = {
  unit: tbd("Price unit not decided"),
  amount: tbd("Price requires human approval"),
  notes: tbd(),
};

/** Every booking condition is a Human Decision (T-03 §8). */
export const bookingConditionsTbd: BookingConditions = {
  options: tbd("4h / 8h or other variants not decided"),
  minGuests: tbd(),
  maxGuests: tbd("Max guests not decided"),
  childrenPolicy: tbd("Children policy not decided"),
  operatingHours: tbd("Operating hours not decided"),
  cancellationPolicy: tbd("Cancellation policy not decided"),
  confirmationMode: tbd("Instant vs human confirmation not decided"),
};

type ExperienceFields = Omit<ExperienceSummary, "cta" | "bookCta">;

function fields(id: Experience["id"], slug: string, filled: boolean): ExperienceFields {
  return {
    id,
    productType: "ready_made",
    status: "PROPOSED",
    market: "osaka",
    href: fixtureExperienceHref(slug),
    title: fixtureText(`Experience title ${slug}`),
    summary: filled ? fixtureText("One or two sentences about who it fits and why.") : tbd(),
    duration: filled ? proposed({ minMinutes: 180, maxMinutes: 240 }, FIXTURE_SOURCE) : tbd(),
    ageFit: filled ? proposed({ minAge: 0 }, FIXTURE_SOURCE) : tbd(),
    walkingIntensity: filled ? proposed("low_medium", FIXTURE_SOURCE) : tbd(),
    participation: tbd("Private party / shared not decided"),
    visitExperience: filled ? proposed("first_visit", FIXTURE_SOURCE) : tbd(),
    area: fixtureText("Area"),
    image: filled ? proposed(fixtureImage(1200, 900, "Experience image placeholder"), FIXTURE_SOURCE) : tbd(),
    price: priceTbd,
  };
}

function summary(id: Experience["id"], slug: string, filled: boolean): ExperienceSummary {
  const base = fields(id, slug, filled);
  return {
    ...base,
    cta: {
      ...fixtureCta("experienceDetail", base.href, "card", "secondary", "Detail CTA"),
      id: `fixture_detail_${slug}`,
    },
    ...(filled
      ? {
          bookCta: {
            ...fixtureCta("booking", fixtureBookingHref(slug), "card", "primary", "Book Now CTA"),
            id: `fixture_book_${slug}`,
            experienceId: id,
          },
        }
      : {}),
  };
}

/** One fully drafted card and one mostly-TBD card, to design both states. */
export const experienceSummariesFixture: ExperienceSummary[] = [
  summary("GP-OSA-FIXTURE-A", "fixture-a", true),
  summary("GP-OSA-FIXTURE-B", "fixture-b", false),
];

const base = fields("GP-OSA-FIXTURE-A", "fixture-a", true);

/** Booking open: use to design Detail → Booking Flow. */
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
  included: proposed(["[FIXTURE] Included item"], FIXTURE_SOURCE),
  excluded: proposed(["[FIXTURE] Excluded item"], FIXTURE_SOURCE),
  meetingPoint: tbd(),
  images: tbd(),
  faq: proposed(
    [{ question: fixtureText("Question?"), answer: fixtureText("Answer.") }],
    FIXTURE_SOURCE,
  ),
  bookingConditions: bookingConditionsTbd,
  bookingState: "open",
  cta: {
    ...fixtureCta("booking", fixtureBookingHref("fixture-a"), "section", "primary", "Book Now CTA"),
    experienceId: base.id,
  },
  privateGuideCta: fixtureCta("privateGuide", fixtureHrefs.privateGuide, "section", "secondary", "Private Guide CTA"),
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

/** Booking closed: design the disabled Book Now state. */
export const experienceDetailClosedFixture: Experience = {
  ...experienceDetailFixture,
  bookingState: "closed",
  cta: { ...experienceDetailFixture.cta, disabled: true },
};
