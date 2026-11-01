import { redirect } from "next/navigation";
import { deleteSession, readSession, type AdminSession } from "./session";

/**
 * Who is looking at an admin screen: one of the Google accounts in
 * ADMIN_EMAIL_1 / ADMIN_EMAIL_2, or (in `next dev` only) the development password.
 */
export type AdminViewer = AdminSession;

/**
 * The one gate for every admin screen and Server Action. Pages, layouts and
 * actions call this instead of reading the session themselves; how someone
 * signs in lives in ./session and ./google-login, never in the screens.
 */
export async function requireAdmin(): Promise<AdminViewer> {
  const viewer = await readSession();
  if (!viewer) redirect("/admin/login");
  return viewer;
}

/** For places that must not redirect, such as generateMetadata. */
export async function getAdminViewer(): Promise<AdminViewer | null> {
  return readSession();
}

export async function signOut() {
  await deleteSession();
}
