import { redirect } from "next/navigation";
import { routeHref } from "@/website-v1/routes";

/**
 * `/travel-guide` → Osaka hub (temporary, 307) until a second area exists and
 * this becomes the Kansai entry page (W1-D10 K-2).
 */
export default function V1TravelGuideRootPage() {
  redirect(routeHref("travelGuide"));
}
