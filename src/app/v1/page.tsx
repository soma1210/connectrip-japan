import { getHomeViewModel } from "@/website-v1/content/home";
import { toMetadata } from "@/website-v1/metadata";
import { HomeView } from "@/website-v1/views/HomeView";

export function generateMetadata() {
  return toMetadata(getHomeViewModel().seo);
}

export default function V1HomePage() {
  return <HomeView vm={getHomeViewModel()} />;
}
