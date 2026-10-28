import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InquiriesList } from "@/admin/components/InquiriesList";
import { getAdminInquiryList } from "@/admin/customers/readModel";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Inquiries · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function InquiriesPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const inquiries = await getAdminInquiryList();
  return <InquiriesList inquiries={inquiries} />;
}
