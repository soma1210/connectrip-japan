/**
 * SEO guard (2026-11-26): the search, analytics and consent settings released with the SEO /
 * IndexNow work must survive later merges (design work is developed separately and merged
 * into main afterwards). If a merge brings back an older file, this test fails in `test:unit`
 * and in the "Checks" workflow on the pull request.
 *
 * Change a value here only together with an owner decision (e.g. Explore Kansai approved for
 * the public site: update the Explore expectations below in the same change).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import nextConfig from "../../next.config";
import { pageSeo } from "./content/shared";
import { EXPLORE_PUBLIC, getSelectArticles, getUpdateArticles, isIndexable } from "./content/explore";
import { PUBLIC_PAGE_META, toMetadata } from "./metadata";
import { routeHref } from "./routes";
import { getExploreSitemapEntries } from "./sitemap";
import { organizationJsonLd, websiteJsonLd } from "./structuredData";

const SITE = "https://connectripjapan.com";
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

// --- Meta descriptions: every launch page has one, 25–160 characters (Bing / Google snippet) ---
for (const path of ["/", "/private-guide", "/inquiry", "/privacy", "/terms", "/company", "/about", "/experiences", "/experiences/osaka-like-a-local"]) {
  const d = PUBLIC_PAGE_META[path]?.description ?? "";
  assert.ok(d.length >= 25 && d.length <= 160, `${path}: description is ${d.length} characters`);
}
// Not a travel agency (Terms, Article 2): no wording that suggests arranging travel.
for (const [path, { description }] of Object.entries(PUBLIC_PAGE_META))
  assert.doesNotMatch(description, /travel agency|book (?:your|a) (?:trip|tour package)|package tour|arrange(?:ment)?s? (?:your|of) (?:travel|trip)/i, path);

// --- Canonical: absolute, on the official host ---
const meta = toMetadata(pageSeo("About Us", routeHref("about")));
assert.equal(meta.alternates?.canonical, `${SITE}/about`);
assert.equal(meta.description, PUBLIC_PAGE_META["/about"].description);

// --- Sitemap: the launched pages, official URLs only ---
const urls = sitemap().map((e) => e.url);
for (const path of ["/", "/private-guide", "/inquiry", "/privacy", "/terms", "/company", "/about", "/how-it-works", "/experiences", "/experiences/osaka-like-a-local", "/experiences/osaka-tenmangu-tenjinbashisuji"])
  assert.ok(urls.includes(path === "/" ? `${SITE}/` : `${SITE}${path}`), `sitemap lists ${path}`);
assert.ok(urls.every((u) => u.startsWith(`${SITE}/`) && !u.includes("/v1")), "sitemap: official URLs only");

// --- noindex management: Explore Kansai stays unpublished until the owner approves it ---
assert.equal(EXPLORE_PUBLIC, false, "Explore Kansai is not approved for the public site");
assert.deepEqual(getExploreSitemapEntries(), [], "no Explore URL in the sitemap");
assert.deepEqual([...getSelectArticles(), ...getUpdateArticles()].filter(isIndexable).map((a) => a.slug), [], "no Explore article is indexable");

// --- robots.txt ---
assert.deepEqual(robots(), { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }, sitemap: `${SITE}/sitemap.xml` });

// --- Structured data ---
const org = organizationJsonLd() as Record<string, unknown>;
assert.equal(org["@type"], "Organization");
assert.equal(org.url, `${SITE}/`);
assert.deepEqual((org.areaServed as { name: string }[]).map((c) => c.name), ["Osaka", "Kyoto", "Nara", "Kobe"]);
assert.equal((websiteJsonLd() as Record<string, unknown>).url, `${SITE}/`);

// --- H1 on How It Works (the page's only title) ---
assert.match(read("src/website-v1/components/wd/HowItWorksScene.tsx"), /<h1 data-wd-letters aria-label=\{heading\}/);

// --- www → apex, permanent ---
const redirects = await nextConfig.redirects!();
assert.ok(
  redirects.some((r) => r.has?.some((h) => h.type === "host" && h.value === "www.connectripjapan.com") && r.destination === `${SITE}/:path*` && r.permanent),
  "www.connectripjapan.com redirects to the apex",
);

// --- Search engine ownership (Yandex Webmaster, Naver Search Advisor) ---
const layoutSource = read("src/app/v1/layout.tsx");
assert.match(
  layoutSource,
  /yandex: "e6dac6303897942b"/,
  "Yandex Webmaster verification meta stays in the public layout metadata",
);
assert.match(
  layoutSource,
  /"naver-site-verification": "2452c8013980cd69f8bd7a5172ec52c0b6a2274a"/,
  "Naver Search Advisor verification meta stays in the public layout metadata",
);

// --- GA4 behind Cookie Consent (Consent Mode v2, production only) ---
assert.match(read("src/app/v1/layout.tsx"), /<Analytics \/>/);
const analytics = read("src/website-v1/analytics.ts");
assert.match(analytics, /VERCEL_ENV === "production"/);
assert.match(analytics, /NEXT_PUBLIC_GA_MEASUREMENT_ID/);
const consent = read("src/website-v1/components/analytics/CookieConsent.tsx");
assert.match(consent, /analytics_storage: "denied"/, "consent defaults to denied");
assert.match(consent, /Reject Analytics/);
assert.ok(existsSync(new URL("../../src/website-v1/components/analytics/trackEvent.ts", import.meta.url)));

// --- IndexNow ---
const key = read("scripts/indexnow/config.ts").match(/KEY = "([a-f0-9]{32})"/)?.[1];
assert.ok(key && read(`public/${key}.txt`) === key, "IndexNow key file");
assert.ok(existsSync(new URL("../../.github/workflows/indexnow.yml", import.meta.url)));
assert.ok(existsSync(new URL("../../src/app/api/build-info/route.ts", import.meta.url)));
assert.equal(JSON.parse(read("vercel.json")).git.deploymentEnabled["indexnow-state"], false);

console.log("SEO guard: search, analytics and consent settings intact");
