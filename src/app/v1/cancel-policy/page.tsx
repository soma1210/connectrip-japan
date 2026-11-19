import { JsonLd } from "@/website-v1/components/JsonLd";
import { pageBreadcrumbJsonLd } from "@/website-v1/structuredData";
import { routeHref } from "@/website-v1/routes";
import { getCancellationPolicyViewModel } from "@/website-v1/content/cancellationPolicy";
import { toMetadata } from "@/website-v1/metadata";
import { CancellationPolicyView } from "@/website-v1/views/CurrentSiteViews";

export function generateMetadata() {
  return toMetadata(getCancellationPolicyViewModel().seo);
}

export default function V1CancelPolicyPage() {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd("Cancellation & Refund Policy", routeHref("cancelPolicy"))} />
      <CancellationPolicyView vm={getCancellationPolicyViewModel()} />
    </>
  );
}
