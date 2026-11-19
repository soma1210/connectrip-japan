import { FEATURED_TOUR_SLUG, getFeaturedTour } from "@/website-v1/content/featuredTour";
import { pageSeo } from "@/website-v1/content/shared";
import { toMetadata } from "@/website-v1/metadata";
import { experienceHref } from "@/website-v1/routes";
import { TourDetailView } from "@/website-v1/views/TourDetailView";
import { bookingStoreFromEnv } from "@/lib/booking-request/handler";

/**
 * Osaka Tenma tour detail (2026-11-13). Preview only: `/experiences/*` is not
 * in the public launch scope (routes.ts PUBLIC_PATHS), so it answers 404 in
 * public mode until shrine and shop terms are confirmed.
 */
// The USD reference hides itself once the exchange rate is out of date (content/exchangeRate.ts): re-check daily.
export const revalidate = 86400;

export function generateMetadata() {
  return toMetadata(pageSeo(getFeaturedTour().title, experienceHref(FEATURED_TOUR_SLUG)));
}

export default function V1OsakaLikeALocalPage() {
  // Live only when the booking backend is configured on the server (same rule as the Private Guide form).
  return <TourDetailView tour={getFeaturedTour()} bookingMode={bookingStoreFromEnv() ? "live" : "mock"} />;
}
