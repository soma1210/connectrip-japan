import { routeHref } from "../routes";

/**
 * Cinematic Globe Philosophy section (Home, last section before the footer).
 * Preview only (Human instruction 2026-11-14): public mode does not render it.
 *
 * Copy: the words given in the instruction, unchanged. The link goes to the
 * About page through the Route Registry (`/v1/about` in preview, `/about` at
 * launch once About is approved and public).
 */
export const PHILOSOPHY_SOURCE = "Human instruction 2026-11-14 (Cinematic Globe V1.2 integration)";

export const PHILOSOPHY_COPY = {
  eyebrow: "Our Philosophy",
  lines: ["Connecting People.", "Creating Experiences."] as const,
  storyLabel: "Discover Our Story",
};

export function philosophyStoryHref(): string {
  return routeHref("about");
}

/**
 * Globe images (public/images/v1/globe), taken from prototype v1.2 and
 * re-encoded as WebP. Rights: NOT_VERIFIED. The prototype credits NASA
 * public-domain imagery (Blue Marble / Black Marble, via the three-globe
 * example textures); the cloud layer has no recorded source. The static image
 * is a frame of this site's own renderer, so it carries the same textures and
 * the same open question. A human must confirm sources and terms before any
 * public use.
 *
 * V1.4 (2026-11-15): no new source material. The day map is the same
 * prototype file (earth_day_2048.jpg) re-encoded at a higher quality
 * (WebP q90, 91 KB; was 55 KB). A sharper Earth needs a larger map: the
 * candidate is NASA Visible Earth "Blue Marble: Next Generation" (4096 px or
 * more), to be adopted only after a human confirms NASA's current image-use
 * terms and the required credit.
 */
export const GLOBE_ASSETS = {
  rights: "NOT_VERIFIED" as const,
  /** V1.4 finished frame (globe + connections), rendered from this site's own renderer; covers 120% of the globe box. */
  fallback: { src: "/images/v1/globe/globe-fallback-v14-1024.webp", width: 1024, height: 1024 },
  textures: {
    desktop: {
      day: "/images/v1/globe/earth-day-v14-2048.webp",
      night: "/images/v1/globe/earth-night-2048.webp",
      clouds: "/images/v1/globe/earth-clouds-1024.webp",
    },
    mobile: {
      // V1.4: phones draw the Earth close up too, so they get the 2048 day map (91 KB).
      day: "/images/v1/globe/earth-day-v14-2048.webp",
      night: "/images/v1/globe/earth-night-1024.webp",
      clouds: "/images/v1/globe/earth-clouds-1024.webp",
    },
  },
};
