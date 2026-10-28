"use server";

import { redirect } from "next/navigation";
import { clearAdminSession } from "@/lib/admin-auth";

/** Same session cookie as the existing CMS. No new auth mechanism. */
export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
