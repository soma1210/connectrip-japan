import { notFound } from "next/navigation";
import { getArticleSlugs, getArticleViewModel } from "@/website-v1/content/travelGuide";
import { toMetadata } from "@/website-v1/metadata";
import { ArticleView } from "@/website-v1/views/TravelGuideViews";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const vm = getArticleViewModel((await params).slug);
  return vm ? toMetadata(vm.seo) : {};
}

export default async function V1GuideArticlePage({ params }: Props) {
  const vm = getArticleViewModel((await params).slug);
  if (!vm) notFound();
  return <ArticleView vm={vm} />;
}
