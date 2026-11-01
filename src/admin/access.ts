import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/**
 * Who is looking at an admin screen. Today the shared ADMIN_PASSWORD is the
 * only way in, so there is no person to name yet.
 */
export type AdminViewer = { method: "shared-password" };

/**
 * The one gate for Guide Admin screens. Pages call this instead of reading the
 * session themselves, so moving to Google Login limited to ADMIN_EMAIL_1 /
 * ADMIN_EMAIL_2 only changes this function (and the login page), not the screens.
 */
export async function requireAdmin(): Promise<AdminViewer> {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return { method: "shared-password" };
}
