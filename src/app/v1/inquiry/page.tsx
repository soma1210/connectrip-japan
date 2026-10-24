import { getInquiryViewModel } from "@/website-v1/content/inquiry";
import { toMetadata } from "@/website-v1/metadata";
import { InquiryView } from "@/website-v1/views/PageViews";

export function generateMetadata() {
  return toMetadata(getInquiryViewModel().seo);
}

export default function V1InquiryPage() {
  return <InquiryView vm={getInquiryViewModel()} />;
}
