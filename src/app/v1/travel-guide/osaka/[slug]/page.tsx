import { notFound } from "next/navigation";
import { getArticleSlugs, getArticleViewModel } from "@/website-v1/content/travelGuide";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { toGuideMetadata } from "@/website-v1/metadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/website-v1/structuredData";
import { ArticleView } from "@/website-v1/views/TravelGuideViews";

type Props = { params: Promise<{ slug: string }> };

// Freshness (event states, period banners) is computed per day.
export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getArticleSlugs("osaka").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const vm = getArticleViewModel((await params).slug);
  return vm ? toGuideMetadata(vm.seo) : {};
}

export default async function V1GuideArticlePage({ params }: Props) {
  const vm = getArticleViewModel((await params).slug);
  if (!vm) notFound();
  return (
    <>
      <JsonLd data={articleJsonLd(vm)} />
      <JsonLd data={breadcrumbJsonLd(vm.seo)} />
      <ArticleView vm={vm} />
    </>
  );
}
