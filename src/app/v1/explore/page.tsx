import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { EXPLORE_COPY, EXPLORE_VISIBLE, getAreaCounts, getSelectArticles, getUpdateLists } from "@/website-v1/content/explore";
import { breadcrumbJsonLd, collectionJsonLd, exploreCrumbs, exploreHubMetadata } from "@/website-v1/exploreSeo";
import { exploreHref } from "@/website-v1/routes";
import { ExploreHubView } from "@/website-v1/views/ExploreViews";

/** Explore Kansai hub (2026-11-14). Preview only: not in PUBLIC_PATHS, and 404 outside the preview. */
export const revalidate = 86400;

export function generateMetadata() {
  // Public mode: nothing about Explore in the 404 page either.
  if (!EXPLORE_VISIBLE) return {};
  return exploreHubMetadata();
}

export default function V1ExplorePage() {
  if (!EXPLORE_VISIBLE) notFound();
  const crumbs = exploreCrumbs();
  const select = getSelectArticles();
  const updates = getUpdateLists();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={collectionJsonLd(EXPLORE_COPY.title, exploreHref(), [...select, ...updates.current])} />
      <ExploreHubView crumbs={crumbs} select={select} updates={updates} areaCounts={getAreaCounts()} />
    </>
  );
}
