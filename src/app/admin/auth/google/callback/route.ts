import { NextResponse, type NextRequest } from "next/server";
import { finishGoogleLogin, isGoogleLoginConfigured } from "@/admin/google-login";
import { isAllowedAdminEmail, writeSession } from "@/admin/session";

/** Google sends the browser back here. Only ADMIN_EMAIL_1 / ADMIN_EMAIL_2 get a session. */
export async function GET(request: NextRequest) {
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  if (!isGoogleLoginConfigured) return to("/admin/login");

  const result = await finishGoogleLogin(request.nextUrl.searchParams);
  if (!result.ok) return to(`/admin/login?error=${result.reason}`);
  if (!isAllowedAdminEmail(result.email)) return to("/admin/login?error=denied");

  await writeSession({ method: "google", email: result.email });
  return to("/admin");
}
