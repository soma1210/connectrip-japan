import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  INTERVIEW_ADMIN_HOME,
  interviewSiteRoute,
  isInterviewOnlySite,
} from "./features/guide-interviews/site";

const intlMiddleware = createMiddleware(routing);

// Paths outside the next-intl locale routing: the same prefixes and "has a dot"
// rule the previous matcher excluded.
const OUTSIDE_LOCALES = /^\/(?:api|admin|guide-community|guide-interview|interview|privacy|_next|_vercel)|\./;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isInterviewOnlySite()) {
    // Interview-only site: nothing here is meant for search engines.
    const route = interviewSiteRoute(pathname);
    if (route === "admin-home") {
      const response = NextResponse.redirect(new URL(INTERVIEW_ADMIN_HOME, request.url));
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }
    if (route === "not-found") {
      return new NextResponse("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
      });
    }
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (OUTSIDE_LOCALES.test(pathname)) return NextResponse.next();
  return intlMiddleware(request);
}

export const config = {
  // Every request except prebuilt static files, so INTERVIEW_ONLY_SITE can hide
  // admin, API and public files too. Without the flag, paths outside the locale
  // routing pass straight through, as with the previous matcher.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
