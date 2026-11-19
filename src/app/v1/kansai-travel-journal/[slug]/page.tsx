import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { getJournalArticle, getJournalSlugs } from "@/website-v1/content/journal";
import { journalArticleJsonLd, journalArticleMetadata } from "@/website-v1/journalSeo";
import { JournalArticleView } from "@/website-v1/views/JournalArticleView";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
// DEMO dates are relative to today (Japan): regenerate daily.
export const revalidate = 86400;

export function generateStaticParams() {
  return getJournalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const article = getJournalArticle((await params).slug);
  return article ? journalArticleMetadata(article) : {};
}

export default async function V1JournalArticlePage({ params }: Props) {
  const article = getJournalArticle((await params).slug);
  if (!article) notFound();
  return (
    <>
      <JsonLd data={journalArticleJsonLd(article)} />
      <JournalArticleView article={article} />
    </>
  );
}
