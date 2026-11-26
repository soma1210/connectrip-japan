import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { AREA_INFO, EXPLORE_AREAS, EXPLORE_VISIBLE, getAreaArticles, getAreaCounts, isIndexable, type ExploreArea } from "@/website-v1/content/explore";
import { breadcrumbJsonLd, collectionJsonLd, exploreAreaMetadata, exploreCrumbs } from "@/website-v1/exploreSeo";
import { exploreAreaHref } from "@/website-v1/routes";
import { ExploreAreaView } from "@/website-v1/views/ExploreViews";

type Props = { params: Promise<{ area: string }> };

/**
 * Area page (Osaka, Kyoto, Nara, Kobe): every Select guide and current
 * update for the area. An area without indexable articles is noindex (and left
 * out of the sitemap), so empty pages never reach search results.
 */
export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return EXPLORE_AREAS.map((area) => ({ area }));
}

const toArea = (v: string) => EXPLORE_AREAS.find((a) => a === v) as ExploreArea | undefined;

export async function generateMetadata({ params }: Props) {
  if (!EXPLORE_VISIBLE) return {};
  const area = toArea((await params).area);
  if (!area) return {};
  const { select, updates } = getAreaArticles(area);
  return exploreAreaMetadata(area, [...select, ...updates].some(isIndexable));
}

export default async function V1ExploreAreaPage({ params }: Props) {
  const area = EXPLORE_VISIBLE ? toArea((await params).area) : undefined;
  if (!area) notFound();
  const { select, updates } = getAreaArticles(area);
  const name = `${AREA_INFO[area].name} Travel Guides`;
  const crumbs = exploreCrumbs({ name: AREA_INFO[area].name, href: exploreAreaHref(area) });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={collectionJsonLd(name, exploreAreaHref(area), [...select, ...updates])} />
      <ExploreAreaView crumbs={crumbs} area={area} select={select} updates={updates} areaCounts={getAreaCounts()} />
    </>
  );
}
