import { getCompanyProfileViewModel } from "@/website-v1/content/currentSitePages";
import { toMetadata } from "@/website-v1/metadata";
import { CompanyProfileView } from "@/website-v1/views/CurrentSiteViews";

export function generateMetadata() {
  return toMetadata(getCompanyProfileViewModel().seo);
}

export default function V1CompanyPage() {
  return <CompanyProfileView vm={getCompanyProfileViewModel()} />;
}
