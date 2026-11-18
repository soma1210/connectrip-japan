import type { CtaSpec, ImageAsset, Money } from "@/contracts";
import { OSAKA_LIKE_A_LOCAL_ID, bookableTour, type BookableTour } from "@/lib/booking-request/tours";
import { experienceHref } from "../routes";
import { cta, proposed } from "./shared";

/**
 * Featured Experience on Home (Human instruction 2026-11-13): the one tour on
 * sale, the 3-hour Osaka Tenma private walking tour. Title and summary are the
 * owner's approved copy (do not edit the title).
 *
 * The detail page (`/experiences/osaka-like-a-local`, preview only) exists
 * since 2026-11-13. Booking requests are open since 2026-11-17: the booking
 * CTA opens the tour's request form (components/booking/TourBookingRequest),
 * checked by the API against `src/lib/booking-request/tours.ts` (`experienceId`).
 * A request is never a confirmed booking. Prices (per private group, tax included) are shown
 * on the detail page only since 2026-11-13; the Home card shows none. Ema / wish-ball offers and shop
 * participation are still being confirmed, so the copy promises neither.
 */
export const FEATURED_TOUR_SLUG = "osaka-like-a-local";

export type FeaturedTour = {
  title: string;
  summary: string;
  /** Product description on the detail page (the Home card keeps `summary`). */
  tagline: string;
  highlights: { key: "shrine" | "craft" | "souvenir" | "local"; label: string }[];
  /** Detail page facts (Home card keeps `facts`). */
  detailFacts: { label: string; value: string }[];
  /** Shop visit times are the current plan; travel time is included in the 3 hours. */
  schedule: { time: string; title: string; text: string }[];
  /**
   * Connectrip sells the guide service only (2026-11-13): ema / wish-ball fees
   * and souvenirs are paid by guests directly on site, never collected by us.
   */
  included: string[];
  notIncluded: string[];
  notIncludedNote: string;
  /**
   * Sale prices per private group, tax included (2026-11-13). Guide service only.
   * `price` is the official JPY price; the page adds an approximate USD reference
   * (content/exchangeRate.ts) explained by `usdNote`. USD is display only.
   */
  pricing: { heading: string; subheading: string; tiers: { guests: string; price: Money<"JPY"> }[]; note: string; usdNote: string };
  image: ImageAsset;
  /** CSS object-position for the photo: keeps the 大阪天満宮 stone pillar and the gate roof in frame. */
  imagePosition: string;
  facts: { label: string; value: string }[];
  detailCta: CtaSpec;
  /** Opens the request form (a button, not a link). */
  bookingCta: CtaSpec;
  /** The tour's Booking Request rules (start time, 1–6 guests, language, window). */
  booking: BookableTour;
};

const SOURCE = "Featured Experience copy (Human instruction 2026-11-13)";

export function getFeaturedTour(): FeaturedTour {
  return {
    title: "Osaka Like a Local: Shrine Traditions & Unique Japanese Souvenirs",
    summary:
      "Explore the local side of Osaka on a 3-hour private walking tour. Experience Japanese shrine traditions, discover local craftsmanship, and find unique souvenirs while exploring Tenjinbashisuji Shopping Street with a friendly local guide.",
    tagline:
      "Discover Osaka like a local on a 3-hour private walking tour. Explore Japanese shrine traditions, visit neighborhood shops, and discover unique Japanese souvenirs along Tenjinbashisuji Shopping Street.",
    highlights: [
      { key: "shrine", label: "Shrine Traditions" },
      { key: "craft", label: "Japanese Craftsmanship" },
      { key: "souvenir", label: "Unique Japanese Souvenirs" },
      { key: "local", label: "Local Osaka Life" },
    ],
    detailFacts: [
      { label: "Duration", value: "3 Hours" },
      { label: "Time", value: "9:30 AM – 12:30 PM" },
      { label: "Guests", value: "1–6" },
      { label: "Tour Type", value: "Private Walking Tour" },
      { label: "Language", value: "English" },
      { label: "Meeting Area", value: "Osaka Tenmangu Shrine" },
      { label: "End Point", value: "Near JR Tenma Station" },
    ],
    // Website summary of the itinerary (final, 2026-11-13). No workshop, craftsman
    // demo or pottery making is promised; ema / wish-ball / souvenirs are optional and paid on site.
    schedule: [
      {
        time: "9:30 AM",
        title: "Osaka Tenmangu Shrine & Hoshiai Pond",
        text: "Discover Japanese shrine traditions, ema wishes, and the wish-ball ritual at Hoshiai Pond.",
      },
      {
        time: "Around 10:30 AM",
        title: "Local Crafts & Souvenir Shops",
        text: "Explore Japanese knives at Kunishige Hamono and traditional ceramics at Tamaichi Doi Pottery.",
      },
      {
        time: "Around 11:30 AM",
        title: "Tenjinbashisuji Shopping Street",
        text: "Enjoy local shopping and discover nostalgic Japanese sweets at Marushige Ogimachi.",
      },
      { time: "12:30 PM", title: "End of Tour — JR Tenma Station", text: "Finish your Osaka experience near JR Tenma Station." },
    ],
    included: [
      "3-hour private English-speaking local guide",
      "Guided shrine and neighborhood walk",
      "Visits to selected local shops, subject to opening hours and availability",
    ],
    notIncluded: [
      "Ema prayer plaques",
      "Wish-ball offerings at Hoshiai Pond",
      "Souvenir purchases",
      "Food and drinks",
      "Transportation to the meeting point",
      "Personal expenses",
    ],
    notIncludedNote:
      "Optional shrine offerings and souvenir purchases are paid directly on-site and are not included in the tour price.",
    pricing: {
      heading: "Private Tour Pricing",
      subheading: "3-hour private walking tour · English-speaking local guide",
      tiers: [
        { guests: "1–2 Guests", price: { amount: 19800, currency: "JPY" } },
        { guests: "3–4 Guests", price: { amount: 29800, currency: "JPY" } },
        { guests: "5–6 Guests", price: { amount: 39800, currency: "JPY" } },
      ],
      note: "Prices are per private group, not per person. Guide service only. Tax included.",
      usdNote: "USD amounts are approximate and may vary with exchange rates. All payments are charged in JPY.",
    },
    image: {
      src: "/images/v1/experiences/osaka-tenmangu-gate.webp",
      alt: "The main gate of Osaka Tenmangu Shrine with its stone name pillar, under a blue sky",
      width: 1536,
      height: 1024,
      rights: "NOT_VERIFIED",
      consent: "NOT_APPLICABLE",
    },
    imagePosition: "85% 40%",
    facts: [
      { label: "Duration", value: "3 Hours" },
      { label: "Time", value: "9:30 AM – 12:30 PM" },
      { label: "Guests", value: "1–6" },
      { label: "Tour Type", value: "Private Walking Tour" },
      { label: "Language", value: "English" },
      { label: "Area", value: "Osaka / Tenma" },
    ],
    detailCta: cta("v1_home_featured_detail", "experiences", experienceHref(FEATURED_TOUR_SLUG), "section", "secondary", proposed("Experience Detail", SOURCE)),
    // Request-first, like Private Guide: opens the form; the href is the detail page (fallback / tracking only).
    bookingCta: cta("v1_home_featured_booking", "booking", experienceHref(FEATURED_TOUR_SLUG), "section", "primary", proposed("Send Booking Request", SOURCE), {
      experienceId: OSAKA_LIKE_A_LOCAL_ID,
    }),
    booking: bookableTour(OSAKA_LIKE_A_LOCAL_ID)!,
  };
}
