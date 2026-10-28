import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomersList } from "@/admin/components/CustomersList";
import { getAdminCustomerList } from "@/admin/customers/readModel";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Customers · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function CustomersPage() {
  // The layout also redirects, but App Router renders the page in parallel.
  // Stop before the read model runs so the redirect body does not include it.
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const customers = await getAdminCustomerList();
  return <CustomersList customers={customers} />;
}
