import { DAY_END, MAX_DAYS_AHEAD, MAX_PARTY_SIZE, REQUEST_LEAD_HOURS } from "../booking/privateGuideRequest";
import { PRIVATE_GUIDE_PRICING_VISIBLE } from "./privateGuidePricing";

/**
 * Private Guide page: service areas and a basic FAQ (STEP 13A, 2026-11-11).
 *
 * Built only from decided facts, so the page says nothing new:
 * - areas: Osaka / Kyoto / Kobe / Nara / Other (APPROVED, W1-D04);
 * - lengths, start times, 20:00 end, party size, 48-hour cut-off, 90-day
 *   window, second choice: Private Guide Booking Rules V1.1 (APPROVED, W1-D24),
 *   numbers taken from the same constants the form uses;
 * - request → reply → Stripe invoice in JPY → confirmation after payment:
 *   the booking request flow already shown on the page (Human instruction
 *   2026-11-09 / 2026-11-10).
 * Not stated on purpose (not approved): prices, payment deadline, full or
 * advance payment, guide hold, cancellation terms, child age, reply time.
 * Wording is PROPOSED.
 */
export const PRIVATE_GUIDE_AREAS_NOTE =
  "We guide in Osaka, Kyoto, Nara and Kobe in the Kansai region. For somewhere else, choose “Other” in the request form and tell us where.";

export type FaqItem = { question: string; answer: string };

export const PRIVATE_GUIDE_FAQ: FaqItem[] = [
  {
    question: "Is my booking confirmed when I send a request?",
    answer:
      "No. A request is not a confirmed booking. We check your request and our guides' availability, then reply to you. If we can arrange your day, we send you a Stripe invoice in Japanese yen (JPY), and we confirm your booking once your payment has been received.",
  },
  {
    question: "How long can I book a private guide for?",
    answer: `4, 6 or 8 hours. You can start between 08:00 and 17:00 Japan time, in 30-minute steps, and your day ends by ${DAY_END}: the latest start is 16:00 for 4 hours, 14:00 for 6 hours and 12:00 for 8 hours.`,
  },
  {
    question: "How far in advance do I need to send a request?",
    answer: `At least ${REQUEST_LEAD_HOURS} hours before your preferred start time (Japan time), and up to ${MAX_DAYS_AHEAD} days ahead. A second choice of date and time is optional and follows the same rules, with the same length.`,
  },
  {
    question: "How many people can join?",
    answer: `Up to ${MAX_PARTY_SIZE} people per request, adults and children together, including at least 1 adult.`,
  },
  {
    question: "What if we are a larger group, or want to finish after 20:00?",
    answer: `The request form can't take groups of more than ${MAX_PARTY_SIZE} people or days that end after ${DAY_END}. Please contact us about these requests instead.`,
  },
  {
    question: "Where can a private guide take us?",
    answer: "Osaka, Kyoto, Nara and Kobe. If you'd like to go somewhere else, choose “Other” in the form and tell us where.",
  },
  // Price question: follows the Private Guide Pricing table. Where the table is shown (preview until
  // approved), the answer points to it; otherwise (public mode) the earlier answer stays, so the FAQ never
  // mentions a pricing section that isn't on the page.
  PRIVATE_GUIDE_PRICING_VISIBLE
    ? {
        question: "When will I know the final price?",
        answer:
          "You can find our standard Private Guide prices in the pricing section above. The final price may vary depending on your group size, preferred location, language, travel date, and special requests.\n\nWe will confirm your total price and guide availability before requesting payment. Submitting a request does not confirm your booking.",
      }
    : {
        question: "When will I know the price?",
        answer: "We confirm the price for your day when we reply to your request. Payment is in Japanese yen (JPY) by Stripe invoice.",
      },
];
