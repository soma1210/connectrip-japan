import { getPrivateGuideBookingPageViewModel } from "@/website-v1/content/privateGuideBooking";
import { toMetadata } from "@/website-v1/metadata";
import { PrivateGuideBookingView } from "@/website-v1/views/PrivateGuideBookingView";

// Booking dates are relative to today (Japan): regenerate daily.
export const revalidate = 86400;

export function generateMetadata() {
  return toMetadata(getPrivateGuideBookingPageViewModel().seo);
}

/** Private Guide Unified Booking Flow v1 (PROTOTYPE). */
export default function V1PrivateGuideBookingPage() {
  return <PrivateGuideBookingView vm={getPrivateGuideBookingPageViewModel()} />;
}
