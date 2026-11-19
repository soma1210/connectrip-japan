import { V1_PREVIEW } from "../../config";
import { GLOBE_ASSETS, PHILOSOPHY_COPY, philosophyStoryHref } from "../../content/philosophy";
import { CinematicGlobePhilosophy } from "./CinematicGlobePhilosophy";

/**
 * Home: the Cinematic Globe Philosophy section, preview only (Human
 * instruction 2026-11-14). Public mode renders nothing: no DOM, no images and
 * no WebGL renderer chunk. Note: the bundler still includes the small client
 * controller (CinematicGlobePhilosophy, unused) in the Home client bundle;
 * dropping it entirely would need a build-config alias (next.config.ts).
 */
export function PhilosophySection() {
  if (!V1_PREVIEW) return null;
  return (
    <CinematicGlobePhilosophy
      eyebrow={PHILOSOPHY_COPY.eyebrow}
      lines={PHILOSOPHY_COPY.lines}
      storyLabel={PHILOSOPHY_COPY.storyLabel}
      storyHref={philosophyStoryHref()}
      fallback={GLOBE_ASSETS.fallback}
      textures={GLOBE_ASSETS.textures}
    />
  );
}
