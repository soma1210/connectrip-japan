import { notFound, permanentRedirect } from "next/navigation";
import { getJournalPage, getJournalPageCount } from "@/website-v1/content/journal";
import { journalListMetadata } from "@/website-v1/journalSeo";
import { journalPageHref } from "@/website-v1/routes";
import { KansaiTravelJournal } from "@/website-v1/components/journal/KansaiTravelJournal";

type Props = { params: Promise<{ page: string }> };

/** `/kansai-travel-journal/page/{n}` for n ≥ 2; `/page/1` goes to the journal root. */
export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return Array.from({ length: getJournalPageCount() }, (_, i) => ({ page: String(i + 1) }));
}

export async function generateMetadata({ params }: Props) {
  return journalListMetadata(Number((await params).page));
}

export default async function V1JournalPage({ params }: Props) {
  const n = Number((await params).page);
  if (n === 1) permanentRedirect(journalPageHref(1));
  const data = getJournalPage(n);
  if (!data) notFound();
  return <KansaiTravelJournal data={data} headingLevel="h1" />;
}
