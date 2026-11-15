import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { EXPLORE_VISIBLE } from "@/website-v1/content/explore";
import { breadcrumbJsonLd, exploreCrumbs, exploreEditorialPolicyMetadata } from "@/website-v1/exploreSeo";
import { exploreEditorialPolicyHref } from "@/website-v1/routes";
import { EditorialPolicyView } from "@/website-v1/views/ExploreViews";

/** Explore Kansai editorial policy (linked from every article's author box). Preview only; wording is a draft. */
export const revalidate = 86400;

export function generateMetadata() {
  // Public mode: nothing about Explore in the 404 page either.
  if (!EXPLORE_VISIBLE) return {};
  return exploreEditorialPolicyMetadata();
}

export default function V1ExploreEditorialPolicyPage() {
  if (!EXPLORE_VISIBLE) notFound();
  const crumbs = exploreCrumbs({ name: "Editorial Policy", href: exploreEditorialPolicyHref() });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <EditorialPolicyView crumbs={crumbs} />
    </>
  );
}
