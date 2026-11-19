import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminConsoleShell } from "@/admin/components/AdminConsoleShell";
import { logoutAdmin, requireAdmin } from "@/lib/admin-auth";

// Auth reads the session cookie. Without this, `next build` prerenders the
// unauthenticated redirect when ADMIN_PASSWORD is not set at build time.
export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await logoutAdmin();
  redirect("/admin/login");
}

/**
 * One login covers every screen in this group. This check is only the first
 * line: each page and Server Action calls `requireAdmin()` again, because a
 * layout does not stop nested routes or actions from running.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return <AdminConsoleShell logout={logout}>{children}</AdminConsoleShell>;
}
