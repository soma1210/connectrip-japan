import { getHomeViewModel } from "@/website-v1/content/home";
import { toMetadata } from "@/website-v1/metadata";
import { HomeView } from "@/website-v1/views/HomeView";

// The Travel Guide section drops ended / out-of-period articles; recomputed daily.
export const revalidate = 86400;

export function generateMetadata() {
  return toMetadata(getHomeViewModel().seo);
}

export default function V1HomePage() {
  return <HomeView vm={getHomeViewModel()} />;
}
