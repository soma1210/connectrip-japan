import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Same rules in preview and public mode. Hosts that must not be indexed
// (*.netlify.app) get `X-Robots-Tag: noindex` instead (next.config.ts, netlify.toml):
// a robots.txt block would stop crawlers from ever seeing that noindex.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
