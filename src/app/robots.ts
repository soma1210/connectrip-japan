import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { isInterviewOnlySite } from "@/features/guide-interviews/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/interview"],
    },
    // The interview-only site serves no sitemap (and is noindex throughout).
    ...(isInterviewOnlySite() ? {} : { sitemap: `${SITE_URL}/sitemap.xml` }),
  };
}
