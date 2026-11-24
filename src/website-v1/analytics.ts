import { V1_PREVIEW } from "./config";

/**
 * Google Analytics 4 (owner instruction 2026-11-24). GA4 is loaded directly with
 * the Google tag (gtag.js) through `@next/third-parties/google`; Google Tag
 * Manager is NOT loaded, so a GA4 tag inside a GTM container can never count
 * the same visit twice. If GTM is adopted later, remove this and configure GA4
 * in GTM instead (one or the other, never both).
 *
 * The measurement ID comes from `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Vercel →
 * Production environment only). Tags are rendered only when all of these hold,
 * so local development, Vercel Preview deployments, Netlify builds and the
 * Website v1 preview never send data into the production property:
 *
 * - the ID is set and looks like a GA4 measurement ID (`G-…`);
 * - the build runs on Vercel Production (`VERCEL_ENV=production`), or
 *   `GA_ALLOW_NON_PRODUCTION=1` is set for a deliberate local check;
 * - the site is not in preview mode (`NEXT_PUBLIC_WEBSITE_V1_PREVIEW`).
 *
 * The tag itself loads only after the visitor accepts analytics cookies
 * (components/analytics/CookieConsent.tsx, Consent Mode v2 basic).
 *
 * page_view: the Google tag sends the first one when it loads; later Next.js page
 * changes (history.pushState) are counted by GA4 Enhanced measurement
 * ("Page changes based on browser history events", on by default). Do not add
 * a manual page_view on route change, or every navigation is counted twice.
 */
const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export const GA_MEASUREMENT_ID = /^G-[A-Z0-9]+$/.test(id) ? id : null;

export const GA_ENABLED =
  GA_MEASUREMENT_ID !== null &&
  !V1_PREVIEW &&
  (process.env.VERCEL_ENV === "production" || process.env.GA_ALLOW_NON_PRODUCTION === "1");
