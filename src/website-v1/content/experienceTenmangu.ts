import type { Experience, ExperienceId, GroupPriceTier } from "@/contracts";
import { formatMoney } from "../components/format";
import { bookingHref, experienceHref, routeHref } from "../routes";
import { cta, pageName, pageSeo, proposed, tbd } from "./shared";

/**
 * DRAFT Experience (Human instruction 2026-11-16): the first Ready-made
 * Experience product, a 3-hour guided walking tour of Osaka Tenmangu Shrine,
 * Tenjinbashisuji Shopping Street and the Tenma neighbourhood.
 *
 * Status PROPOSED: preview only (`/experiences/*` is outside the public launch
 * scope, routes.ts PUBLIC_PATHS), not on sale. Booking stays closed and the
 * booking button is disabled until a person approves price and conditions.
 *
 * Decided by the owner: title, subtitle, categories, area, 3 hours, overview,
 * highlights and the three places; 2026-11-17: prices per private group
 * (JPY, `PRICE_TIERS`), up to 6 guests, what the price includes / excludes.
 * NOT decided, so TBD in the data and shown as "To Be Confirmed": meeting /
 * end point, start times, languages, visit order and timing, children policy,
 * cancellation terms, and whether prices include tax. Nothing here invents them.
 *
 * Booking requests for Ready-made products are not open (the booking API
 * answers `booking_closed`), so the request button stays disabled.
 *
 * Note: a separate, earlier tour of the same area exists
 * (content/featuredTour.ts, `/experiences/osaka-like-a-local`, shown on Home)
 * with its own price and schedule. Whether this product replaces it is an
 * open decision; this file does not change it.
 *
 * `id` is the key a future booking request will carry (`experienceId`).
 * Placeholder id until the product id list (GP-OSA-01…) is assigned.
 */
export const TENMANGU_SLUG = "osaka-tenmangu-tenjinbashisuji";
export const TENMANGU_ID: ExperienceId = "GP-OSA-TENMANGU-DRAFT";

const SOURCE = "Experience product brief (Human instruction 2026-11-16)";
const p = <T,>(value: T) => proposed(value, SOURCE);
const PRICE_SOURCE = "Tenmangu tour sale prices (Human instruction 2026-11-17)";

/** Official sale prices per private group, JPY (2026-11-17). Not per person. */
export const PRICE_TIERS: GroupPriceTier[] = [
  { guests: "1–2 Guests", minGuests: 1, maxGuests: 2, price: { amount: 24800, currency: "JPY" } },
  { guests: "3–4 Guests", minGuests: 3, maxGuests: 4, price: { amount: 39800, currency: "JPY" } },
  { guests: "5–6 Guests", minGuests: 5, maxGuests: 6, price: { amount: 59800, currency: "JPY" } },
];
const MAX_GUESTS = 6;

/** The group price for a party size (null above 6 or below 1): the one rule a future booking quote should use. */
export function tenmanguPriceFor(guests: number): GroupPriceTier | null {
  return PRICE_TIERS.find((t) => Number.isInteger(guests) && guests >= t.minGuests && guests <= t.maxGuests) ?? null;
}

const FROM = PRICE_TIERS[0].price;

export function getTenmanguExperience(): Experience {
  const href = experienceHref(TENMANGU_SLUG);
  return {
    id: TENMANGU_ID,
    productType: "ready_made",
    status: "PROPOSED",
    market: "osaka",
    href,
    listing: "product",
    title: p("Osaka Tenmangu & Japan's Longest Shopping Street"),
    subtitle: "Discover the Heart of Local Osaka",
    categories: ["Culture", "Local Life", "Walking Tour"],
    tourType: "Guided Walking Tour",
    // Card text (owner's copy) and the longer page introduction (owner's overview).
    summary: p("Explore historic Osaka Tenmangu Shrine and the vibrant Tenjinbashisuji Shopping Street with a local guide."),
    introduction:
      "Step beyond Osaka's famous tourist districts and discover the city's local side. Visit the historic Osaka Tenmangu Shrine, explore the lively Tenjinbashisuji Shopping Street, and experience the everyday culture, food, and atmosphere of Tenma with a local guide.",
    duration: p({ minMinutes: 180, maxMinutes: 180 }),
    area: p("Tenma, Osaka"),
    ageFit: tbd("Age fit TBD"),
    walkingIntensity: tbd("Walking intensity TBD"),
    participation: tbd("Private party / shared TBD"),
    visitExperience: tbd(),
    // The Osaka Tenmangu gate photo already used on the site (rights NOT_VERIFIED: preview only).
    image: p({
      src: "/images/v1/experiences/osaka-tenmangu-gate.webp",
      alt: "The main gate of Osaka Tenmangu Shrine with its stone name pillar, under a blue sky",
      width: 1536,
      height: 1024,
      rights: "NOT_VERIFIED",
      consent: "NOT_APPLICABLE",
    }),
    // "From" price = the 1–2 guest tier. Per private group, JPY.
    price: { unit: proposed("per_group", PRICE_SOURCE), amount: proposed(FROM, PRICE_SOURCE), notes: proposed("Per private group, not per person.", PRICE_SOURCE) },
    priceLabel: `From ${formatMoney(FROM)} / group`,
    priceTiers: PRICE_TIERS,
    priceNote: "Prices are per private group, not per person. All payments are charged in Japanese yen (JPY).",
    highlights: p([
      "Explore a historic shrine in central Osaka",
      "Walk through a lively local shopping street",
      "Discover everyday life in the Tenma neighborhood",
      "Experience Osaka beyond the major tourist attractions",
    ]),
    places: [
      {
        name: "Osaka Tenmangu Shrine",
        nameJa: "大阪天満宮",
        text: "A historic shrine dedicated to Sugawara no Michizane, honored as a god of learning, and home of the Tenjin Matsuri, one of Japan's best-known summer festivals.",
      },
      {
        name: "Tenjinbashisuji Shopping Street",
        nameJa: "天神橋筋商店街",
        text: "Often called Japan's longest shopping street: a long covered arcade of small shops, eateries and local businesses running north from the shrine.",
      },
      {
        name: "Tenma Neighborhood",
        nameJa: "天満",
        text: "The streets around the shrine and the shopping street, where everyday Osaka life, from neighborhood restaurants to local stores, carries on just as it always has.",
      },
    ],
    importantNotes: [
      "This tour is not open for booking yet. The meeting point, start times and languages will be confirmed before booking opens.",
      "The places above are part of the tour plan. The order of visits and the time at each place are not fixed yet.",
      "Osaka Tenmangu Shrine is an active place of worship. Please follow your guide's advice on etiquette and photography.",
      "This is a walking tour. Comfortable shoes are recommended.",
    ],
    // Order and timing are not decided: no itinerary is shown.
    itinerary: tbd("Visit order and timing TBD"),
    included: proposed(["3-hour guided walking tour"], PRICE_SOURCE),
    excluded: proposed(["Food and drinks", "Personal purchases and souvenirs", "Optional shrine items and experiences", "Other personal expenses"], PRICE_SOURCE),
    meetingPoint: tbd("Meeting point TBD"),
    images: tbd("Product photos TBD (Tenjinbashisuji, Tenma)"),
    faq: tbd("FAQ TBD"),
    bookingConditions: {
      options: tbd("Options TBD"),
      minGuests: proposed(1, PRICE_SOURCE),
      maxGuests: proposed(MAX_GUESTS, PRICE_SOURCE),
      childrenPolicy: tbd("Children policy TBD"),
      operatingHours: tbd("Start times TBD"),
      cancellationPolicy: tbd("Cancellation policy TBD"),
      confirmationMode: proposed("human_review", "Booking Request flow: requests are reviewed, never confirmed instantly"),
    },
    bookingState: "closed",
    // Request-first flow; carries the product id for the future booking request. Disabled while closed.
    cta: cta("v1_book_tenmangu_section", "booking", bookingHref(TENMANGU_SLUG), "section", "primary", p("Send Booking Request"), { experienceId: TENMANGU_ID, disabled: true }),
    privateGuideCta: cta("v1_detail_private_tenmangu", "privateGuide", routeHref("privateGuide"), "section", "secondary", pageName("Private Guide")),
    seo: {
      ...pageSeo("Osaka Tenmangu & Japan's Longest Shopping Street", href),
      description: p(
        "A 3-hour guided walking tour of Tenma, Osaka: Osaka Tenmangu Shrine, Tenjinbashisuji Shopping Street and the everyday life of a local neighborhood.",
      ),
    },
  };
}
