import { JsonLd } from "@/website-v1/components/JsonLd";
import { pageBreadcrumbJsonLd } from "@/website-v1/structuredData";
import { routeHref } from "@/website-v1/routes";
import { getLegalViewModel } from "@/website-v1/content/pages";
import { toMetadata } from "@/website-v1/metadata";
import { LegalView } from "@/website-v1/views/PageViews";

export function generateMetadata() {
  return toMetadata(getLegalViewModel("terms").seo);
}

export default function V1TermsPage() {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd("Terms", routeHref("terms"))} />
      <LegalView vm={getLegalViewModel("terms")} />
    </>
  );
}
