import { routing, type Locale } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";

export const SITE_URL = "https://connectripjapan.com";

/**
 * Builds the `alternates` metadata field (canonical + per-locale hreflang
 * URLs) for a given route, keeping every locale's canonical/hreflang set in
 * sync with the actual next-intl routing config.
 */
export function buildAlternates(locale: Locale, href: string) {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, getPathname({ locale: l, href })]),
  ) as Record<Locale, string>;

  return {
    canonical: getPathname({ locale, href }),
    languages,
  };
}
