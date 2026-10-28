import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminConsoleShell } from "@/admin/components/AdminConsoleShell";
import { clearAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";

// Auth reads the session cookie. Without this, `next build` prerenders the
// unauthenticated redirect when ADMIN_PASSWORD is not set at build time.
export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await clearAdminSession();
  redirect("/admin/login");
}

/** One login (ADMIN_PASSWORD cookie) covers every screen in this group. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return <AdminConsoleShell logout={logout}>{children}</AdminConsoleShell>;
}
