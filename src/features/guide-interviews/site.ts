// Interview-only deployment (INTERVIEW_ONLY_SITE=1).
//
// The interview system can be published on its own Netlify site before the
// main website goes live. That site runs this same app, so src/proxy.ts uses
// interviewSiteRoute() to serve only what the interview flow needs and answer
// 404 for everything else (main site pages, /guide-community, /partner and the
// other admin screens). Without the flag nothing changes.

export const isInterviewOnlySite = () => process.env.INTERVIEW_ONLY_SITE === "1";

/** Where the admin lands after login on the interview-only site (/admin itself is not served). */
export const INTERVIEW_ADMIN_HOME = "/admin/guide-applications";

const EXACT = new Set(["/guide-interview", "/admin/login", "/favicon.ico", "/robots.txt"]);

const PREFIXES = [
  "/interview/",
  "/api/interviews/",
  "/admin/guide-applications",
  "/_next/", // build output: scripts, styles, fonts, image optimisation
  "/__nextjs", // dev-server internals (error overlay), never reached in production
];

export type InterviewSiteRoute = "allow" | "admin-home" | "not-found";

export function interviewSiteRoute(pathname: string): InterviewSiteRoute {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/admin") return "admin-home";
  if (EXACT.has(path)) return "allow";
  for (const prefix of PREFIXES) {
    // "/admin/guide-applications" must not also match "/admin/guide-applications-export".
    if (prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix || path.startsWith(`${prefix}/`)) {
      return "allow";
    }
  }
  return "not-found";
}
