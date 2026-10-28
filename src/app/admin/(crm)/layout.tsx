import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/admin/components/AdminShell";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Connectrip Admin",
  robots: { index: false, follow: false },
};

// Auth reads the session cookie. Without this, `next build` prerenders the
// unauthenticated redirect and serves it to signed-in staff.
export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
