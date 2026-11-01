import type { Metadata } from "next";
import { PartnerRegistrationsList } from "@/admin/components/PartnerRegistrationsList";
import { todayInJapan } from "@/features/partner-registration/admin";
import { requireAdmin } from "@/admin/access";
import { listPartnerRegistrations, partnerRegistrationStorageMode } from "@/lib/data/partner-registrations";

export const metadata: Metadata = {
  title: "事業者アンケート回答 · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function PartnerRegistrationsPage() {
  await requireAdmin();
  const registrations = await listPartnerRegistrations();
  return (
    <PartnerRegistrationsList
      registrations={registrations}
      today={todayInJapan()}
      storageMode={partnerRegistrationStorageMode}
    />
  );
}
