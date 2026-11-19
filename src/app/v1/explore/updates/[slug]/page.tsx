import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { EXPLORE_VISIBLE, getUpdateArticle, getUpdateArticles } from "@/website-v1/content/explore";
import { articleCrumbs, breadcrumbJsonLd, exploreArticleJsonLd, exploreArticleMetadata } from "@/website-v1/exploreSeo";
import { UpdateArticleView } from "@/website-v1/views/ExploreViews";

type Props = { params: Promise<{ slug: string }> };

// No updates yet: every slug answers 404 until a verified update is added (content/explore.ts).
export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return getUpdateArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  if (!EXPLORE_VISIBLE) return {};
  const article = getUpdateArticle((await params).slug);
  return article ? exploreArticleMetadata(article) : {};
}

export default async function V1ExploreUpdatePage({ params }: Props) {
  const article = EXPLORE_VISIBLE ? getUpdateArticle((await params).slug) : undefined;
  if (!article) notFound();
  const crumbs = articleCrumbs(article);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={exploreArticleJsonLd(article)} />
      <UpdateArticleView article={article} crumbs={crumbs} />
    </>
  );
}
