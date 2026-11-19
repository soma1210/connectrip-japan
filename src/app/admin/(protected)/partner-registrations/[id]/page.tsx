import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PartnerRegistrationDetailView } from "@/admin/components/PartnerRegistrationDetailView";
import { todayInJapan } from "@/features/partner-registration/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getPartnerRegistration } from "@/lib/data/partner-registrations";

type Props = PageProps<"/admin/partner-registrations/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await isAdminAuthenticated())) {
    return { title: "Connectrip Admin", robots: { index: false, follow: false } };
  }
  const { id } = await params;
  const registration = await getPartnerRegistration(id);
  return {
    title: registration ? `${registration.company_name} · 事業者アンケート · Connectrip Admin` : "事業者アンケート · Connectrip Admin",
    robots: { index: false, follow: false },
  };
}

export default async function PartnerRegistrationDetailPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const registration = await getPartnerRegistration(id);
  if (!registration) notFound();
  return <PartnerRegistrationDetailView registration={registration} today={todayInJapan()} />;
}
