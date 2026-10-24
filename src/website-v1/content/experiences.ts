import type {
  BookingConditions,
  Experience,
  ExperienceDetailViewModel,
  ExperienceId,
  ExperienceSummary,
  ExperiencesListViewModel,
  PriceStructure,
} from "@/contracts";
import { bookingHref, experienceHref, routeHref } from "../routes";
import { cta, pageName, pageSeo, tbd } from "./shared";

/**
 * Ready-made Experience slots. No product is decided yet, so every slot is
 * TBD. They exist only so the list → detail navigation can be reviewed.
 * They are not GP-OSA-01〜03.
 */
const SLOTS: { slug: string; id: ExperienceId }[] = [
  { slug: "preview-a", id: "GP-OSA-PREVIEW-A" },
  { slug: "preview-b", id: "GP-OSA-PREVIEW-B" },
  { slug: "preview-c", id: "GP-OSA-PREVIEW-C" },
];

const priceTbd: PriceStructure = {
  unit: tbd("Price unit TBD"),
  amount: tbd("Price TBD"),
  notes: tbd(),
};

const bookingConditionsTbd: BookingConditions = {
  options: tbd("4h / 8h or other options TBD"),
  minGuests: tbd("Min guests TBD"),
  maxGuests: tbd("Max guests TBD"),
  childrenPolicy: tbd("Children policy TBD"),
  operatingHours: tbd("Operating hours TBD"),
  cancellationPolicy: tbd("Cancellation policy TBD"),
  confirmationMode: tbd("Instant vs human confirmation TBD"),
};

type Fields = Omit<ExperienceSummary, "cta" | "bookCta">;

function fields(slot: (typeof SLOTS)[number]): Fields {
  return {
    id: slot.id,
    productType: "ready_made",
    status: "PROPOSED",
    market: "osaka",
    href: experienceHref(slot.slug),
    title: tbd("Product not decided"),
    summary: tbd("Product summary TBD"),
    duration: tbd("Duration TBD"),
    ageFit: tbd("Age fit TBD"),
    walkingIntensity: tbd("Walking intensity TBD"),
    participation: tbd("Private party / shared TBD"),
    visitExperience: tbd(),
    area: tbd("Area TBD"),
    image: tbd("Product photo TBD"),
    price: priceTbd,
  };
}

/** Booking is not open in the preview: no products, prices or booking backend. */
function bookCta(slot: (typeof SLOTS)[number], position: "card" | "section") {
  return cta(
    `v1_book_${slot.slug}_${position}`,
    "booking",
    bookingHref(slot.slug),
    position,
    "primary",
    // "Book Now" is written in the Home Working Baseline (W1-D01 §6-3).
    { status: "PROPOSED", value: "Book Now", source: "Home WORKING_BASELINE (W1-D01). Copy TBD" },
    { experienceId: slot.id, disabled: true },
  );
}

function summary(slot: (typeof SLOTS)[number]): ExperienceSummary {
  const base = fields(slot);
  return {
    ...base,
    cta: cta(`v1_detail_${slot.slug}`, "experienceDetail", base.href, "card", "secondary", pageName("Experience Detail")),
    bookCta: bookCta(slot, "card"),
  };
}

export function getExperienceSummaries(): ExperienceSummary[] {
  return SLOTS.map(summary);
}

export function getExperienceSlugs(): string[] {
  return SLOTS.map((slot) => slot.slug);
}

function experience(slot: (typeof SLOTS)[number]): Experience {
  const base = fields(slot);
  return {
    ...base,
    highlights: tbd("Highlights TBD"),
    itinerary: tbd("Example itinerary TBD"),
    included: tbd("Included TBD"),
    excluded: tbd("Excluded TBD"),
    meetingPoint: tbd("Meeting point TBD"),
    images: tbd("Product photos TBD"),
    faq: tbd("FAQ TBD"),
    bookingConditions: bookingConditionsTbd,
    bookingState: "closed",
    cta: bookCta(slot, "section"),
    privateGuideCta: cta(
      `v1_detail_private_${slot.slug}`,
      "privateGuide",
      routeHref("privateGuide"),
      "section",
      "secondary",
      pageName("Private Guide"),
    ),
    seo: pageSeo("Experience Detail", base.href),
  };
}

export function getExperiencesListViewModel(): ExperiencesListViewModel {
  return {
    route: "experiences",
    seo: pageSeo("Experiences", routeHref("experiences")),
    content: {
      intro: { headline: pageName("Experiences"), supporting: tbd("Experiences intro copy TBD") },
      items: getExperienceSummaries(),
      privateGuideCta: cta("v1_experiences_private", "privateGuide", routeHref("privateGuide"), "section", "secondary", pageName("Private Guide")),
    },
  };
}

export function getExperienceDetailViewModel(slug: string): ExperienceDetailViewModel | undefined {
  const slot = SLOTS.find((s) => s.slug === slug);
  if (!slot) return undefined;
  const { seo, ...content } = experience(slot);
  return { route: "experienceDetail", seo, content };
}
