import type { Metadata } from "next";
import { requireAdmin } from "@/admin/access";
import { GuideSheetList } from "@/admin/components/GuideSheetList";
import { loadGuideSheet } from "@/lib/data/guide-sheet";

export const metadata: Metadata = {
  title: "ガイド応募（Google Form） · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function GuideSheetPage() {
  await requireAdmin();
  const data = await loadGuideSheet();
  return <GuideSheetList data={data} />;
}
