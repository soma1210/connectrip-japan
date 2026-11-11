import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { V1_PREVIEW } from "./website-v1/config";
import { PUBLIC_PATHS } from "./website-v1/routes";

const currentSite = createMiddleware(routing);

/**
 * Preview mode: the current multilingual site at the root, Website v1 under `/v1`.
 *
 * Public mode: Website v1 is the site. A launch page `/x` is served from the
 * `src/app/v1/x` folder (an internal rewrite, the URL stays `/x`); any other
 * path answers 404. The current site's pages are no longer served; the few
 * old URLs with a real equivalent are redirected in next.config.ts. `/v1/*`
 * itself is redirected to the root there, before this runs.
 */
export default function proxy(request: NextRequest) {
  if (V1_PREVIEW) return currentSite(request);
  const path = request.nextUrl.pathname.replace(/\/$/, "") || "/";
  const target = request.nextUrl.clone();
  target.pathname = PUBLIC_PATHS.includes(path) ? (path === "/" ? "/v1" : `/v1${path}`) : "/v1/__not-found";
  return NextResponse.rewrite(target);
}

export const config = {
  // `v1` is the Website v1 folder; it has no locale routing.
  // `guide-community` has its own root layout (Japanese only), also no locale routing.
  matcher: ["/((?!api|admin|v1(?:/|$)|guide-community|_next|_vercel|.*\\..*).*)"],
};
