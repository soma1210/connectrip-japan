import { getBusinessInquiryViewModel } from "@/website-v1/content/currentSitePages";
import { toMetadata } from "@/website-v1/metadata";
import { BusinessInquiryView } from "@/website-v1/views/BusinessInquiryView";

export function generateMetadata() {
  return toMetadata(getBusinessInquiryViewModel().seo);
}

export default function V1BusinessInquiryPage() {
  return <BusinessInquiryView vm={getBusinessInquiryViewModel()} />;
}
