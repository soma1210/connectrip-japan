import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site";
import { V1_PREVIEW } from "@/website-v1/config";
import { PUBLIC_PATHS } from "@/website-v1/routes";

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

/**
 * Public mode: Website v1 is the site (src/proxy.ts), so only its launch pages
 * are listed (English only, no hreflang). The Travel Guide is outside the
 * launch scope (its entries: website-v1/sitemap.ts, once it is public). No `lastModified`: the build time is not a content date.
 * Preview mode: the current multilingual site, as before.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!V1_PREVIEW) {
    return [
      ...PUBLIC_PATHS.map((path) => ({ url: path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}` })),
    ];
  }
  const lastModified = new Date();

  return ROUTES.map(({ href, priority, changeFrequency }) => {
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
}
