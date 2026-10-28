import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardView } from "@/admin/components/DashboardView";
import { getAdminDashboard } from "@/admin/customers/readModel";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Dashboard · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const dashboard = await getAdminDashboard();
  return <DashboardView dashboard={dashboard} />;
}
