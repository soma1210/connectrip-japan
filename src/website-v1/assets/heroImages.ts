import type { ImageAsset } from "@/contracts";

/**
 * Website v1 Hero background images.
 *
 * Files live in `public/images/v1/hero/<region>/`. To add or replace a photo,
 * drop the file into its region folder and edit this list (order = slide
 * order). Osaka comes first: Website v1 is Osaka-first; Kyoto / Kobe / Nara
 * show the Kansai brand.
 *
 * DEVELOPMENT / PLACEHOLDER ASSETS. Licences are not verified. All must be
 * confirmed or replaced with licensed files before production.
 */
export type HeroRegion = "osaka" | "kyoto" | "kobe" | "nara" | "wakayama" | "hyogo";

/** Location label shown at the bottom right of the Hero while the photo is on screen. */
export type HeroLocation = "OSAKA" | "KYOTO" | "KOBE" | "NARA" | "WAKAYAMA" | "HYOGO";

export type HeroImage = {
  region: HeroRegion;
  location: HeroLocation;
  image: ImageAsset;
  /** CSS object-position on wide screens (mostly the vertical crop). */
  focus: string;
  /** CSS object-position on narrow portrait screens: keeps the subject in the ~45% of the width that stays visible. */
  focusMobile: string;
  /** Licence / watermark status, for reviewers. */
  licence: "NOT_VERIFIED" | "WATERMARKED_PLACEHOLDER";
  /** Where the file came from (original file name), for the rights check. */
  source?: string;
};

function hero(
  region: HeroRegion,
  location: HeroLocation,
  file: string,
  alt: string,
  width: number,
  height: number,
  focus: string,
  focusMobile: string,
  source?: string,
): HeroImage {
  return {
    region,
    location,
    focus,
    focusMobile,
    licence: "NOT_VERIFIED",
    source,
    image: { src: `/images/v1/hero/${region}/${file}`, alt, width, height, rights: "NOT_VERIFIED", consent: "NOT_VERIFIED" },
  };
}

/**
 * Scene order (Cinematic Hero storyboard, Human instruction 2026-11-14):
 * twelve scenes, city / history / nature / night alternating, regions never
 * bunched. Nine photos are the existing set; Arashiyama, Nachi Falls and the
 * landscape Akashi Kaikyo Bridge were added on 2026-11-14 (human-provided
 * Unsplash downloads, resized to 3200 px; originals in the project backups).
 * Camera moves and transitions per scene: components/hero/heroDirection.ts.
 */
export const HERO_IMAGES: HeroImage[] = [
  hero("osaka", "OSAKA", "osaka-castle.jpg", "Osaka Castle", 1706, 960, "38% 40%", "34% 40%"),
  hero("kyoto", "KYOTO", "kyoto-kinkakuji.jpg", "Kinkaku-ji, the Golden Pavilion, Kyoto", 2400, 1600, "52% 55%", "52% 55%"),
  hero("kobe", "KOBE", "kobe-port-tower.jpg", "Kobe Port Tower at night", 2400, 1600, "28% 50%", "27% 50%"),
  hero("nara", "NARA", "nara-deer.jpg", "A deer on a tree-lined path in Nara", 2400, 1600, "53% 65%", "56% 65%"),
  hero("osaka", "OSAKA", "osaka-dojima-river-night.jpg", "Dojima River and the Nakanoshima skyline at night, Osaka", 1920, 1276, "50% 55%", "50% 55%"),
  hero("kyoto", "KYOTO", "kyoto-yasaka-pagoda-night.jpg", "Yasaka Pagoda above a quiet stone-paved street at night, Kyoto", 2400, 1600, "66% 50%", "68% 50%"),
  hero(
    "wakayama",
    "WAKAYAMA",
    "wakayama-nachi-falls.jpg",
    "The three-storied pagoda of Seiganto-ji with Nachi Falls behind it, Wakayama",
    3200,
    2134,
    "50% 45%",
    "38% 50%",
    "pen_ash-iLUTwsTjg8I-unsplash.jpg",
  ),
  hero("osaka", "OSAKA", "osaka-shinsekai-day.jpg", "Tsutenkaku Tower above the shop signs of Shinsekai, Osaka", 2400, 1595, "48% 40%", "48% 40%"),
  hero(
    "hyogo",
    "HYOGO",
    "hyogo-akashi-kaikyo-bridge.jpg",
    "Akashi Kaikyo Bridge seen from below, stretching across the strait under a clear sky, Hyogo",
    3200,
    2119,
    "60% 50%",
    "73% 50%",
    "ta-ni-d-QtiiVVisg-unsplash.jpg",
  ),
  hero("osaka", "OSAKA", "osaka-daruma.jpg", "Rows of red daruma dolls, Osaka", 2400, 1600, "50% 45%", "50% 45%"),
  hero(
    "kyoto",
    "KYOTO",
    "kyoto-arashiyama-boat.jpg",
    "A covered boat on the river under red autumn maples, Arashiyama, Kyoto",
    3200,
    2133,
    "50% 60%",
    "56% 60%",
    "nicolas-caetano-kjsSHDpQfBo-unsplash.jpg",
  ),
  hero("osaka", "OSAKA", "osaka-dotonbori.jpg", "Dotonbori canal at night, Namba, Osaka", 1307, 1599, "55% 55%", "55% 55%"),
];

export const HERO_PLACEHOLDER_SOURCE =
  "DEVELOPMENT / PLACEHOLDER ASSET: licence NOT_VERIFIED. Confirm or replace before production";

/** Crop focus for a hero image by src (undefined for unknown images). */
export function heroFocus(src: string): string | undefined {
  return HERO_IMAGES.find((h) => h.image.src === src)?.focus;
}

/** Hero metadata by src: crop focus (wide / narrow) and the location label. */
export function heroMeta(src: string): Pick<HeroImage, "focus" | "focusMobile" | "location"> | undefined {
  return HERO_IMAGES.find((h) => h.image.src === src);
}
