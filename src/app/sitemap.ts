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

export default function sitemap(): MetadataRoute.Sitemap {
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
