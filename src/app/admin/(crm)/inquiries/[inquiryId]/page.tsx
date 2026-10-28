import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InquiryDetailView } from "@/admin/components/InquiryDetailView";
import { getAdminInquiryDetail } from "@/admin/customers/readModel";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type Props = { params: Promise<{ inquiryId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await isAdminAuthenticated())) {
    return { title: "Connectrip Admin", robots: { index: false, follow: false } };
  }
  const { inquiryId } = await params;
  const inquiry = await getAdminInquiryDetail(inquiryId);
  return {
    title: inquiry ? `${inquiry.inquiryId} · Connectrip Admin` : "Inquiry · Connectrip Admin",
    robots: { index: false, follow: false },
  };
}

export default async function InquiryDetailPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { inquiryId } = await params;
  const inquiry = await getAdminInquiryDetail(inquiryId);
  if (!inquiry) notFound();
  return <InquiryDetailView inquiry={inquiry} />;
}
