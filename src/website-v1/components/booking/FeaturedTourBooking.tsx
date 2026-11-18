import type { FeaturedTour } from "../../content/featuredTour";
import { PRIVACY_FORM_NOTICE, PRIVACY_POLICY_VISIBLE } from "../../content/privacyPolicy";
import { V1_PREVIEW } from "../../config";
import { routeHref } from "../../routes";
import { TourBookingRequest } from "./TourBookingRequest";

export type BookingMode = "live" | "mock";

/**
 * The featured tour's "Send Booking Request" button + form (2026-11-17), for
 * Home and the tour detail page. `mode` comes from the page (live when the
 * server has a database). Public mode shows the button only when live, so a
 * visitor never meets a form that cannot send.
 */
export function FeaturedTourBooking({ tour, mode, className }: { tour: FeaturedTour; mode: BookingMode; className?: string }) {
  if (!V1_PREVIEW && mode !== "live") return null;
  if (!tour.booking.open) return null;
  return (
    <TourBookingRequest
      tour={tour.booking}
      mode={mode}
      cta={tour.bookingCta}
      privacyHref={routeHref("privacy")}
      privacyNotice={PRIVACY_POLICY_VISIBLE ? PRIVACY_FORM_NOTICE : null}
      className={className}
    />
  );
}
