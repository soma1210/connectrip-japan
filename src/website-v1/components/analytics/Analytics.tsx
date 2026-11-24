import { GA_ENABLED, GA_MEASUREMENT_ID } from "../../analytics";
import { routeHref } from "../../routes";
import { CookieConsent } from "./CookieConsent";

/**
 * GA4 behind the cookie consent banner, rendered once in the site's root
 * layout. Nothing at all (no banner, no tag) where GA4 is not enabled:
 * local, Vercel Preview, Netlify, the preview mode. See website-v1/analytics.ts.
 */
export function Analytics() {
  return GA_ENABLED && GA_MEASUREMENT_ID ? <CookieConsent gaId={GA_MEASUREMENT_ID} privacyHref={routeHref("privacy")} /> : null;
}
