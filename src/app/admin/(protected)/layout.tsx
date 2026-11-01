import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminConsoleShell } from "@/admin/components/AdminConsoleShell";
import { requireAdmin, signOut } from "@/admin/access";

// Auth reads the session cookie. Without this, `next build` prerenders the
// unauthenticated redirect at build time.
export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await signOut();
  redirect("/admin/login");
}

/** One login (see @/admin/access) covers every screen in this group. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return <AdminConsoleShell logout={logout}>{children}</AdminConsoleShell>;
}
