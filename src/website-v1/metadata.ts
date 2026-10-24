import type { Metadata } from "next";
import type { SeoMeta } from "@/contracts";

/** Contract `SeoMeta` → Next.js metadata. The whole preview is noindex. */
export function toMetadata(seo: SeoMeta): Metadata {
  return {
    title: seo.title.status === "TBD" ? "TBD" : seo.title.value,
    description: seo.description.status === "TBD" ? undefined : seo.description.value,
    robots: { index: false, follow: false },
  };
}
