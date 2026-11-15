import { notFound } from "next/navigation";
import { getJournalPage } from "@/website-v1/content/journal";
import { journalListMetadata } from "@/website-v1/journalSeo";
import { KansaiTravelJournal } from "@/website-v1/components/journal/KansaiTravelJournal";

/** Kansai Travel Journal, page 1 (preview only until the launch scope includes it). */
export const revalidate = 86400;

export function generateMetadata() {
  return journalListMetadata(1);
}

export default function V1JournalFirstPage() {
  const data = getJournalPage(1);
  if (!data) notFound();
  return <KansaiTravelJournal data={data} headingLevel="h1" />;
}
