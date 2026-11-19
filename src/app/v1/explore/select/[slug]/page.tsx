import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { EXPLORE_VISIBLE, getSelectArticle, getSelectArticles } from "@/website-v1/content/explore";
import { articleCrumbs, breadcrumbJsonLd, exploreArticleJsonLd, exploreArticleMetadata } from "@/website-v1/exploreSeo";
import { SelectArticleView } from "@/website-v1/views/ExploreViews";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return getSelectArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  if (!EXPLORE_VISIBLE) return {};
  const article = getSelectArticle((await params).slug);
  return article ? exploreArticleMetadata(article) : {};
}

export default async function V1ExploreSelectArticlePage({ params }: Props) {
  const article = EXPLORE_VISIBLE ? getSelectArticle((await params).slug) : undefined;
  if (!article) notFound();
  const crumbs = articleCrumbs(article);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={exploreArticleJsonLd(article)} />
      <SelectArticleView article={article} crumbs={crumbs} />
    </>
  );
}
