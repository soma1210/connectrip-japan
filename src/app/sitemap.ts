import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site";

const ROUTES: { href: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { href: "/", priority: 1, changeFrequency: "weekly" },
  { href: "/reservation", priority: 0.9, changeFrequency: "monthly" },
  { href: "/contact", priority: 0.8, changeFrequency: "monthly" },
  { href: "/business-inquiry", priority: 0.6, changeFrequency: "monthly" },
  { href: "/company", priority: 0.5, changeFrequency: "monthly" },
  { href: "/cancel-policy", priority: 0.5, changeFrequency: "monthly" },
  { href: "/careers", priority: 0.4, changeFrequency: "monthly" },
  { href: "/pricing", priority: 0.4, changeFrequency: "monthly" },
];

// Standalone pages outside the next-intl locale routing: one URL each, no hreflang.
// Never list personal booking links (/interview/[token]) or /admin here.
const UNLOCALIZED_ROUTES: { href: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { href: "/guide-interview", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const localized: MetadataRoute.Sitemap = ROUTES.map(({ href, priority, changeFrequency }) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        `${SITE_URL}${getPathname({ locale, href })}`,
      ]),
    );

    return {
      url: `${SITE_URL}${getPathname({ locale: routing.defaultLocale, href })}`,
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ...languages,
          "x-default": `${SITE_URL}${getPathname({ locale: routing.defaultLocale, href })}`,
        },
      },
    };
  });

  const unlocalized: MetadataRoute.Sitemap = UNLOCALIZED_ROUTES.map(({ href, priority, changeFrequency }) => ({
    url: `${SITE_URL}${href}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  return [...localized, ...unlocalized];
}
