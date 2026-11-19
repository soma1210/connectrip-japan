import type { ImageAsset } from "./media";
import type { Tbd } from "./status";

export type BreadcrumbItem = {
  name: Tbd<string>;
  href: string;
};

/**
 * Page-level SEO data, consumed by the metadata / structured-data layer.
 * Presentation components only use `breadcrumb` (if they show one).
 */
export type SeoMeta = {
  title: Tbd<string>;
  description: Tbd<string>;
  /** PROPOSED until the Sitemap and domain are approved. */
  canonicalPath: string;
  ogImage?: Tbd<ImageAsset>;
  noindex: boolean;
  breadcrumb?: BreadcrumbItem[];
  /** Open Graph type. Defaults to "website". */
  ogType?: "website" | "article";
  /** Articles only: ISO dates, shown on the page as Published / Updated. */
  publishedTime?: string;
  modifiedTime?: string;
};
