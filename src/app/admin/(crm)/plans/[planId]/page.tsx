import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PlanDetailView } from "@/admin/components/PlanDetailView";
import { getAdminPlanDetail } from "@/admin/customers/readModel";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type Props = { params: Promise<{ planId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await isAdminAuthenticated())) {
    return { title: "Connectrip Admin", robots: { index: false, follow: false } };
  }
  const { planId } = await params;
  const plan = await getAdminPlanDetail(planId);
  return {
    title: plan ? `${plan.planId} · Connectrip Admin` : "Private Day Plan · Connectrip Admin",
    robots: { index: false, follow: false },
  };
}

export default async function PlanDetailPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { planId } = await params;
  const plan = await getAdminPlanDetail(planId);
  if (!plan) notFound();
  return <PlanDetailView plan={plan} />;
}
