import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/admin/access";
import { GuideSheetDetailView } from "@/admin/components/GuideSheetDetailView";
import { loadGuideSheet } from "@/lib/data/guide-sheet";

type Props = PageProps<"/admin/guide-sheet/[applicationId]">;

// The applicant's name stays out of the tab title: tab titles end up in browser history.
export const metadata: Metadata = {
  title: "ガイド応募の詳細 · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function GuideSheetDetailPage({ params }: Props) {
  await requireAdmin();
  const { applicationId } = await params;
  let key: string;
  try {
    key = decodeURIComponent(applicationId);
  } catch {
    notFound();
  }
  const data = await loadGuideSheet();
  const application = data.applications.find((row) => row.key === key);
  if (!application) notFound();
  const interviewRequests = application.fields.applicationId
    ? data.interviewRequests.filter((request) => request.applicationId === application.fields.applicationId)
    : [];
  return <GuideSheetDetailView application={application} interviewRequests={interviewRequests} data={data} />;
}
