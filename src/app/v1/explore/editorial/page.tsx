import { notFound } from "next/navigation";
import { V1_PREVIEW } from "@/website-v1/config";
import { getEditorialRows } from "@/website-v1/content/explore";
import { exploreEditorialDashboardMetadata } from "@/website-v1/exploreSeo";
import { EditorialDashboardView } from "@/website-v1/views/ExploreViews";

/**
 * Editorial list (preview only). Never part of the public site: 404 outside
 * the preview even after Explore Kansai launches, noindex, not linked from
 * any page and not in the sitemap.
 */
export const dynamic = "force-dynamic";

export function generateMetadata() {
  if (!V1_PREVIEW) return {};
  return exploreEditorialDashboardMetadata();
}

export default function V1ExploreEditorialPage() {
  if (!V1_PREVIEW) notFound();
  return <EditorialDashboardView rows={getEditorialRows()} />;
}
