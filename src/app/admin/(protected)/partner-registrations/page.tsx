import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PartnerRegistrationsList } from "@/admin/components/PartnerRegistrationsList";
import { todayInJapan } from "@/features/partner-registration/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listPartnerRegistrations, partnerRegistrationStorageMode } from "@/lib/data/partner-registrations";

export const metadata: Metadata = {
  title: "事業者アンケート回答 · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function PartnerRegistrationsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const registrations = await listPartnerRegistrations();
  return (
    <PartnerRegistrationsList
      registrations={registrations}
      today={todayInJapan()}
      storageMode={partnerRegistrationStorageMode}
    />
  );
}
