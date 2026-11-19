import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { EXPLORE_AREAS, EXPLORE_COPY, EXPLORE_VISIBLE, filterSelect, getSelectArticles, selectTopics, type ExploreArea } from "@/website-v1/content/explore";
import { breadcrumbJsonLd, collectionJsonLd, exploreCrumbs, exploreSelectListMetadata } from "@/website-v1/exploreSeo";
import { exploreSelectHref } from "@/website-v1/routes";
import { AREA_OPTIONS, SelectListView } from "@/website-v1/views/ExploreViews";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Connectrip Japan Select list. `?area=` and `?topic=` filter it (unknown
 * values are ignored); the canonical URL stays the unfiltered list.
 */
export function generateMetadata() {
  // Public mode: nothing about Explore in the 404 page either.
  if (!EXPLORE_VISIBLE) return {};
  return exploreSelectListMetadata();
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function V1ExploreSelectPage({ searchParams }: Props) {
  if (!EXPLORE_VISIBLE) notFound();
  const q = await searchParams;
  const all = getSelectArticles();
  const topics = selectTopics();
  const areaParam = one(q.area);
  const topicParam = one(q.topic);
  const area = EXPLORE_AREAS.find((a) => a === areaParam) as ExploreArea | undefined;
  const topic = topics.find((t) => t === topicParam);
  const crumbs = exploreCrumbs({ name: EXPLORE_COPY.select.label, href: exploreSelectHref() });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={area || topic ? undefined : collectionJsonLd(EXPLORE_COPY.select.label, exploreSelectHref(), all)} />
      <SelectListView
        crumbs={crumbs}
        articles={filterSelect(all, { area, topic })}
        total={all.length}
        filters={[
          { label: "Area", param: "area", current: area, options: AREA_OPTIONS },
          { label: "Category", param: "topic", current: topic, options: topics.map((t) => ({ value: t, label: t })) },
        ]}
      />
    </>
  );
}
