import { JsonLd } from "@/website-v1/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/website-v1/structuredData";
import { getHomeViewModel } from "@/website-v1/content/home";
import { toMetadata } from "@/website-v1/metadata";
import { AwardHomeView } from "@/website-v1/views/AwardHomeView";

// The Travel Guide section drops ended / out-of-period articles; recomputed daily.
export const revalidate = 86400;

export function generateMetadata() {
  return toMetadata(getHomeViewModel().seo);
}

export default function V1HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <AwardHomeView vm={getHomeViewModel()} />
    </>
  );
}
