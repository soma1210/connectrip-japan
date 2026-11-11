import { JsonLd } from "@/website-v1/components/JsonLd";
import { pageBreadcrumbJsonLd } from "@/website-v1/structuredData";
import { routeHref } from "@/website-v1/routes";
import { getInquiryViewModel } from "@/website-v1/content/inquiry";
import { toMetadata } from "@/website-v1/metadata";
import { InquiryView } from "@/website-v1/views/PageViews";

export function generateMetadata() {
  return toMetadata(getInquiryViewModel().seo);
}

export default function V1InquiryPage() {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd("Inquiry", routeHref("inquiry"))} />
      <InquiryView vm={getInquiryViewModel()} />
    </>
  );
}
