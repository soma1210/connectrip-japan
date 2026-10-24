import { getTravelGuideListViewModel } from "@/website-v1/content/travelGuide";
import { toMetadata } from "@/website-v1/metadata";
import { TravelGuideListView } from "@/website-v1/views/TravelGuideViews";

export function generateMetadata() {
  return toMetadata(getTravelGuideListViewModel().seo);
}

export default function V1TravelGuidePage() {
  return <TravelGuideListView vm={getTravelGuideListViewModel()} />;
}
