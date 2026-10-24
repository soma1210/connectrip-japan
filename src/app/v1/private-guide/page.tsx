import { getPrivateGuideViewModel } from "@/website-v1/content/privateGuide";
import { toMetadata } from "@/website-v1/metadata";
import { PrivateGuideView } from "@/website-v1/views/PageViews";

export function generateMetadata() {
  return toMetadata(getPrivateGuideViewModel().seo);
}

export default function V1PrivateGuidePage() {
  return <PrivateGuideView vm={getPrivateGuideViewModel()} />;
}
