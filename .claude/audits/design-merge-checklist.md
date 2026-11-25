# Design work → main: required checklist (2026-11-26)

The design work (worktree `claude-officer-title`, branch `claude/website-dark-cream`, preview
localhost:3081) is developed separately from the SEO / IndexNow work. That branch was started
before several production changes. **Its files are older than main for everything below.**
Copying its files over main brings the old versions back.

## How to merge
1. Start a new branch from the **latest `origin/main`**, never from the design branch.
2. Carry over **design files only** (components, CSS, views and their content). Never copy a whole
   folder or "every modified file" without checking the list below.
3. Run `bun --no-env-file run test:unit`. `src/website-v1/seoGuard.test.ts` fails if any setting
   below went back. The "Checks" workflow runs the same tests on the PR.
4. Before release, take screenshots of every public page on PC and phone and compare them with production.

## Must survive (main is the source of truth)

| Area | Files |
|---|---|
| **GA4 loading. Required fix: the design branch's `src/app/v1/layout.tsx` has no `<Analytics />`.** | `src/app/v1/layout.tsx`, `src/website-v1/analytics.ts`, `src/website-v1/components/analytics/*` |
| Cookie Consent (Consent Mode v2) | `src/website-v1/components/analytics/CookieConsent.tsx`, `CookieSettingsButton.tsx`, `src/website-v1/consent/consent.ts`, footer link in `components/Layout.tsx` |
| GA4 events on booking / inquiry | `BookingStartTracker.tsx`, `trackEvent.ts`, `views/PageViews.tsx`, `booking/PrivateGuideRequestForm.tsx`, `booking/TourBookingRequest.tsx`, `components/LiveInquiryForm.tsx` |
| Privacy policy (2026-11-24) | `src/website-v1/content/privacyPolicy.ts` and its test |
| Booking / inquiry APIs and rules | `src/lib/booking-request/*`, `src/lib/inquiries/*`, `src/app/api/v1/*` and their tests |
| Meta descriptions | `src/website-v1/metadata.ts` (`PUBLIC_PAGE_META`, 25–160 characters) |
| Sitemap / robots | `src/app/sitemap.ts`, `src/app/robots.ts`, `src/website-v1/sitemap.ts` |
| Structured data | `src/website-v1/structuredData.ts` (`areaServed`) |
| How It Works H1 | `src/website-v1/components/wd/HowItWorksScene.tsx` (`<h1 data-wd-letters …>`) |
| www → apex 308 | `next.config.ts` (`redirects`) |
| noindex management | `src/website-v1/content/explore/*` (`EXPLORE_PUBLIC = false`; the 7 Select drafts stay noindex until the owner approves them) |
| IndexNow | `scripts/indexnow/*`, `.github/workflows/indexnow.yml`, `public/ef7bc773cb5d3c99b8a0abe0dbfc69aa.txt`, `src/app/api/build-info/route.ts`, `vercel.json` (`indexnow-state: false`) |
| Checks on PRs | `.github/workflows/checks.yml`, `src/website-v1/seoGuard.test.ts`, `package.json` scripts (`test:unit`, `check:*`, `indexnow:dry-run`) |

Files that exist only on main (GA4, consent, IndexNow, build-info) are missing from the design branch.
They must not be deleted. If the design branch shows them as "deleted", that is its age, not a decision.
