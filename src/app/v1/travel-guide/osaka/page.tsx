import { getTravelGuideListViewModel } from "@/website-v1/content/travelGuide";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { toGuideMetadata } from "@/website-v1/metadata";
import { breadcrumbJsonLd } from "@/website-v1/structuredData";
import { TravelGuideListView } from "@/website-v1/views/TravelGuideViews";

// Freshness (ended events, out-of-period articles) is computed per day.
export const revalidate = 86400;

export function generateMetadata() {
  return toGuideMetadata(getTravelGuideListViewModel().seo);
}

export default function V1OsakaTravelGuidePage() {
  const vm = getTravelGuideListViewModel();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(vm.seo)} />
      <TravelGuideListView vm={vm} />
    </>
  );
}
