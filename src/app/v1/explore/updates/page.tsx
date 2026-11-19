import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { EXPLORE_AREAS, EXPLORE_COPY, EXPLORE_VISIBLE, UPDATE_CATEGORIES, filterUpdates, getUpdateLists, type ExploreArea, type UpdateCategory } from "@/website-v1/content/explore";
import { breadcrumbJsonLd, collectionJsonLd, exploreCrumbs, exploreUpdatesListMetadata } from "@/website-v1/exploreSeo";
import { exploreUpdatesHref } from "@/website-v1/routes";
import { AREA_OPTIONS, UpdatesListView } from "@/website-v1/views/ExploreViews";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Kansai Travel Updates list: current updates, then past ones. `?area=` and
 * `?category=` filter both (unknown values are ignored); canonical = the
 * unfiltered list.
 */
export function generateMetadata() {
  // Public mode: nothing about Explore in the 404 page either.
  if (!EXPLORE_VISIBLE) return {};
  return exploreUpdatesListMetadata();
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function V1ExploreUpdatesPage({ searchParams }: Props) {
  if (!EXPLORE_VISIBLE) notFound();
  const q = await searchParams;
  const areaParam = one(q.area);
  const categoryParam = one(q.category);
  const area = EXPLORE_AREAS.find((a) => a === areaParam) as ExploreArea | undefined;
  const category = UPDATE_CATEGORIES.find((c) => c === categoryParam) as UpdateCategory | undefined;
  const { current, past } = getUpdateLists();
  const crumbs = exploreCrumbs({ name: EXPLORE_COPY.updates.label, href: exploreUpdatesHref() });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={area || category ? undefined : collectionJsonLd(EXPLORE_COPY.updates.label, exploreUpdatesHref(), current)} />
      <UpdatesListView
        crumbs={crumbs}
        current={filterUpdates(current, { area, category })}
        past={filterUpdates(past, { area, category })}
        total={current.length}
        filters={[
          { label: "Area", param: "area", current: area, options: AREA_OPTIONS },
          { label: "Category", param: "category", current: category, options: UPDATE_CATEGORIES.map((c) => ({ value: c, label: c })) },
        ]}
      />
    </>
  );
}
