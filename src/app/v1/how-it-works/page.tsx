import { getHowItWorksViewModel } from "@/website-v1/content/howItWorks";
import { toMetadata } from "@/website-v1/metadata";
import { HowItWorksView } from "@/website-v1/views/PageViews";

export function generateMetadata() {
  return toMetadata(getHowItWorksViewModel().seo);
}

export default function V1HowItWorksPage() {
  return <HowItWorksView vm={getHowItWorksViewModel()} />;
}
