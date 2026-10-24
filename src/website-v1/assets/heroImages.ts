import type { ImageAsset } from "@/contracts";

/**
 * Website v1 Hero background images.
 *
 * Files live in `public/images/v1/hero/<region>/`. To add or replace a photo,
 * drop the file into its region folder and edit this list (order = slide
 * order). Osaka comes first: Website v1 is Osaka-first; Kyoto / Kobe / Nara
 * show the Kansai brand.
 *
 * DEVELOPMENT / PLACEHOLDER ASSETS. Licences are not verified, and the two
 * Adobe Stock images carry watermarks. All must be replaced with licensed,
 * watermark-free files before production.
 */
export type HeroRegion = "osaka" | "kyoto" | "kobe" | "nara";

export type HeroImage = {
  region: HeroRegion;
  image: ImageAsset;
  /** CSS object-position: keeps the subject in frame on narrow (mobile) crops. */
  focus: string;
  /** Licence / watermark status, for reviewers. */
  licence: "NOT_VERIFIED" | "WATERMARKED_PLACEHOLDER";
};

function hero(
  region: HeroRegion,
  file: string,
  alt: string,
  width: number,
  height: number,
  focus: string,
  licence: HeroImage["licence"] = "NOT_VERIFIED",
): HeroImage {
  return {
    region,
    focus,
    licence,
    image: { src: `/images/v1/hero/${region}/${file}`, alt, width, height, rights: "NOT_VERIFIED", consent: "NOT_VERIFIED" },
  };
}

/**
 * Slide order (Working Baseline): starts with Osaka Castle, then
 * Osaka → Kyoto → Kobe → Nara. Osaka Castle and Dotonbori come from the
 * current site (Hero / Gallery).
 */
export const HERO_IMAGES: HeroImage[] = [
  // Osaka
  hero("osaka", "osaka-castle.jpg", "Osaka Castle", 1706, 960, "38% 40%"),
  hero("osaka", "osaka-dojima-river-night.jpg", "Dojima River and the Nakanoshima skyline at night, Osaka", 1920, 1276, "50% 55%"),
  hero("osaka", "osaka-shinsekai-tsutenkaku.jpg", "Tsutenkaku Tower and the lights of Shinsekai, Osaka", 1410, 942, "58% 45%", "WATERMARKED_PLACEHOLDER"),
  hero("osaka", "osaka-daruma.jpg", "Rows of red daruma dolls, Osaka", 2400, 1600, "50% 45%"),
  hero("osaka", "osaka-dotonbori.jpg", "Dotonbori canal at night, Namba, Osaka", 1307, 1599, "55% 55%"),
  // Kyoto
  hero("kyoto", "kyoto-kinkakuji.jpg", "Kinkaku-ji, the Golden Pavilion, Kyoto", 2400, 1600, "52% 55%"),
  // Kobe
  hero("kobe", "kobe-port-tower.jpg", "Kobe Port Tower at night", 2400, 1600, "28% 50%"),
  // Nara
  hero("nara", "nara-deer.jpg", "A deer on a tree-lined path in Nara", 2400, 1600, "53% 65%"),
];

export const HERO_PLACEHOLDER_SOURCE =
  "DEVELOPMENT / PLACEHOLDER ASSET: licence NOT_VERIFIED, two Adobe Stock watermarked files. Replace before production";

/** Crop focus for a hero image by src (undefined for unknown images). */
export function heroFocus(src: string): string | undefined {
  return HERO_IMAGES.find((h) => h.image.src === src)?.focus;
}
