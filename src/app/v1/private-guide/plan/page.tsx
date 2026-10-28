import { getPrivateDayPlannerViewModel } from "@/website-v1/content/privateDayPlanner";
import { toMetadata } from "@/website-v1/metadata";
import { PrivateDayPlannerView } from "@/website-v1/views/PrivateDayPlannerView";

// The demo booking date is relative to today (Japan): regenerate daily.
export const revalidate = 86400;

export function generateMetadata() {
  return toMetadata(getPrivateDayPlannerViewModel().seo);
}

/** Private Day Planner v1 (PROTOTYPE). Later opened from a booking, by booking id. */
export default function V1PrivateDayPlannerPage() {
  return <PrivateDayPlannerView vm={getPrivateDayPlannerViewModel()} />;
}
