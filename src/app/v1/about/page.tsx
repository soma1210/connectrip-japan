import { getAboutViewModel } from "@/website-v1/content/pages";
import { toMetadata } from "@/website-v1/metadata";
import { AboutView } from "@/website-v1/views/PageViews";

export function generateMetadata() {
  return toMetadata(getAboutViewModel().seo);
}

export default function V1AboutPage() {
  return <AboutView vm={getAboutViewModel()} />;
}
