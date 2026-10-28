import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlansList } from "@/admin/components/PlansList";
import { getAdminPlanList } from "@/admin/customers/readModel";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Private Day Plans · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function PlansPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const plans = await getAdminPlanList();
  return <PlansList plans={plans} />;
}
