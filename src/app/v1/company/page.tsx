import { JsonLd } from "@/website-v1/components/JsonLd";
import { organizationJsonLd, pageBreadcrumbJsonLd } from "@/website-v1/structuredData";
import { routeHref } from "@/website-v1/routes";
import { getCompanyProfileViewModel } from "@/website-v1/content/currentSitePages";
import { toMetadata } from "@/website-v1/metadata";
import { CompanyProfileView } from "@/website-v1/views/CurrentSiteViews";

export function generateMetadata() {
  return toMetadata(getCompanyProfileViewModel().seo);
}

export default function V1CompanyPage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={pageBreadcrumbJsonLd("Company Profile", routeHref("company"))} />
      <CompanyProfileView vm={getCompanyProfileViewModel()} />
    </>
  );
}
