import { NextResponse, type NextRequest } from "next/server";
import { isGoogleLoginConfigured, startGoogleLogin } from "@/admin/google-login";
import { isSessionConfigured } from "@/admin/session";

/** "Sign in with Google" button target: off to Google's account chooser. */
export async function GET(request: NextRequest) {
  if (!isGoogleLoginConfigured || !isSessionConfigured()) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.redirect(await startGoogleLogin(request.nextUrl.origin));
}
