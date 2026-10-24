import {
  approved,
  proposed,
  tbd,
  type CtaDestination,
  type CtaPosition,
  type CtaSpec,
  type ImageAsset,
  type ProposedValue,
  type SeoMeta,
  type Tbd,
} from "@/contracts";

/**
 * Content layer for the Website v1 preview.
 *
 * Nothing here is approved copy. Values are either:
 * - TBD (most copy, products, people, prices), or
 * - PROPOSED wording taken from Working Baselines (page names from the
 *   Sitemap, section / CTA wording written in the Business Decision), or
 * - APPROVED only where a human decision is recorded (with its source).
 */
export const SITEMAP_SOURCE = "Sitemap WORKING_BASELINE (W1-D01): page name. Copy TBD";
export const DECISION_SOURCE = "Business Decision W1-D01 wording. Final copy TBD";
export const PHOTO_SOURCE = "Existing site photo. Rights / consent NOT_VERIFIED, preview only";

export function pageName(name: string): ProposedValue<string> {
  return proposed(name, SITEMAP_SOURCE);
}

export function baselineText(text: string): ProposedValue<string> {
  return proposed(text, DECISION_SOURCE);
}

export function approvedText(text: string, source: string) {
  return approved(text, source);
}

export function cta<D extends CtaDestination>(
  id: string,
  destination: D,
  href: string,
  position: CtaPosition,
  emphasis: CtaSpec["emphasis"],
  label: Tbd<string>,
  extra?: Pick<CtaSpec, "experienceId" | "disabled">,
): CtaSpec<D> {
  return { id, destination, href, position, emphasis, label, ...extra };
}

/** A photo already used on the current site. Never treated as cleared. */
export function existingPhoto(src: string, alt: string, width: number, height: number): ImageAsset {
  return { src, alt, width, height, rights: "NOT_VERIFIED", consent: "NOT_VERIFIED" };
}

export const photos = {
  osakaCastle: existingPhoto("/images/hero/slides/01-osaka-castle.jpg", "Osaka Castle", 1706, 960),
  dotonbori: existingPhoto("/images/gallery/gallery-dotonbori.jpg", "Dotonbori, Osaka", 1307, 1599),
};

/** Every v1 preview page is noindex. Titles are page names; descriptions are TBD. */
export function pageSeo(name: string, canonicalPath: string): SeoMeta {
  return {
    title: pageName(name),
    description: tbd("Meta description TBD (AIO / SEO Requirements)"),
    canonicalPath,
    noindex: true,
  };
}

export { proposed, tbd };
