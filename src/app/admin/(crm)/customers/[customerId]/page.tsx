import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CustomerDetailView } from "@/admin/components/CustomerDetailView";
import { getAdminCustomerDetail } from "@/admin/customers/readModel";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type Props = { params: Promise<{ customerId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await isAdminAuthenticated())) {
    return { title: "Connectrip Admin", robots: { index: false, follow: false } };
  }
  const { customerId } = await params;
  const customer = await getAdminCustomerDetail(customerId);
  return {
    title: customer ? `${customer.profile.fullName} · Connectrip Admin` : "Customer · Connectrip Admin",
    robots: { index: false, follow: false },
  };
}

export default async function CustomerDetailPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { customerId } = await params;
  const customer = await getAdminCustomerDetail(customerId);
  if (!customer) notFound();
  return <CustomerDetailView customer={customer} />;
}
