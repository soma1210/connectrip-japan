import { NextResponse, type NextRequest } from "next/server";
import { V1_PREVIEW } from "./website-v1/config";
import { isServedPath } from "./website-v1/routes";

/**
 * Website v1 is the only site (2026-11-15: the legacy multilingual site is
 * retired and its pages are removed from this codebase).
 *
 * Public mode: a launch page `/x` is served from the `src/app/v1/x` folder (an
 * internal rewrite, the URL stays `/x`); any other path answers 404. Legacy
 * URLs with a real equivalent are redirected in next.config.ts. `/v1/*` itself
 * is redirected to the root there, before this runs.
 *
 * Preview mode: pages live under `/v1` (not matched here). The root `/` opens
 * the preview home; any other path outside `/v1` answers 404.
 */
export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  const target = request.nextUrl.clone();
  if (V1_PREVIEW) {
    if (path === "/") {
      target.pathname = "/v1";
      return NextResponse.redirect(target);
    }
    target.pathname = "/v1/__not-found";
    return NextResponse.rewrite(target);
  }
  target.pathname = isServedPath(path) ? (path === "/" ? "/v1" : `/v1${path}`) : "/v1/__not-found";
  return NextResponse.rewrite(target);
}

export const config = {
  // `v1` is the Website v1 folder. `admin` and `guide-community` are back-office
  // routes with their own root layouts.
  matcher: ["/((?!api|admin|v1(?:/|$)|guide-community|_next|_vercel|.*\\..*).*)"],
};
