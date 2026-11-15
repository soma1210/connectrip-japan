import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { EXPLORE_COPY, EXPLORE_VISIBLE } from "@/website-v1/content/explore";
import { getConnectripSelectOsakaViewModel } from "@/website-v1/content/select/osaka";
import { breadcrumbJsonLd, exploreCrumbs, exploreMapMetadata } from "@/website-v1/exploreSeo";
import { exploreSelectHref, routeHref } from "@/website-v1/routes";
import { ExploreMapView } from "@/website-v1/views/ExploreViews";

/** Connectrip Japan Select map, Osaka (Explore Kansai, 2026-11-14). Preview only. */
export const revalidate = 86400;

export function generateMetadata() {
  // Public mode: nothing about Explore in the 404 page either.
  if (!EXPLORE_VISIBLE) return {};
  return exploreMapMetadata();
}

export default function V1ExploreMapOsakaPage() {
  if (!EXPLORE_VISIBLE) notFound();
  const crumbs = exploreCrumbs({ name: EXPLORE_COPY.select.label, href: exploreSelectHref() }, { name: EXPLORE_COPY.map.label, href: routeHref("connectripSelect") });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <ExploreMapView crumbs={crumbs} content={getConnectripSelectOsakaViewModel().content} />
    </>
  );
}
