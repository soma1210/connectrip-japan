import { describe, expect, test } from "bun:test";
import { interviewSiteRoute } from "./site";

describe("interviewSiteRoute", () => {
  test.each([
    "/guide-interview",
    "/guide-interview/",
    "/privacy",
    "/interview/abcDEF123_-",
    "/api/interviews/availability",
    "/api/interviews/request",
    "/api/interviews/approve",
    "/admin/login",
    "/admin/guide-applications",
    "/admin/guide-applications/19693666-8d72-4fea-aacf-24910768e0bc",
    "/_next/static/chunks/main.js",
    "/_next/image",
    "/favicon.ico",
    "/robots.txt",
  ])("serves %s", (path) => {
    expect(interviewSiteRoute(path)).toBe("allow");
  });

  test.each(["/admin", "/admin/"])("sends %s to the applications list", (path) => {
    expect(interviewSiteRoute(path)).toBe("admin-home");
  });

  test.each([
    "/",
    "/en",
    "/en/contact",
    "/contact",
    "/reservation",
    "/guide-community",
    "/partner",
    "/partner/apply",
    "/admin/gallery",
    "/admin/vlog",
    "/admin/reviews",
    "/admin/partner-applications",
    "/admin/partner-applications/1",
    "/admin/guide-applications-export",
    "/api/guide-applications",
    "/api/partner-applications",
    "/api/contact",
    "/api/interviewsx",
    "/interview",
    "/guide-interviewx",
    "/privacy/extra",
    "/en/privacy",
    "/sitemap.xml",
    "/llms.txt",
    "/images/hero.jpg",
    "/opengraph-image",
  ])("hides %s", (path) => {
    expect(interviewSiteRoute(path)).toBe("not-found");
  });
});
