/**
 * Cinematic Globe camera path (V1.4), shared by the section (which sizes the
 * globe box) and the WebGL renderer (which draws the Earth), so both always
 * describe the same camera.
 *
 * The approach is a real dolly: one lens, the camera distance shrinks, and
 * the size of the Earth on screen is exactly what that lens would show
 * (`discScale`). Nothing is enlarged by CSS beyond that.
 */
export const CAM_FAR = 3.9;
export const CAM_NEAR = 2.06;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * 0 → 1 over the scroll. Most of the way in during cuts 1–3, then a last slow
 * push through cut 4, so the picture never freezes while the words appear.
 */
export function approachOf(p: number): number {
  const x = clamp(p / 0.74, 0, 1);
  // Starts gently, covers ground through cut 2 (the first lines need a readable Earth), eases out before the words.
  const main = 0.5 * (x * x * (3 - 2 * x)) + 0.5 * (1 - (1 - x) * (1 - x));
  return 0.93 * main + 0.07 * smoothstep(0.7, 1, p);
}

/** Camera distance from the Earth's centre, in Earth radii. */
export function camDist(p: number): number {
  return CAM_FAR + (CAM_NEAR - CAM_FAR) * approachOf(p);
}

/** Size of the Earth's disc relative to its final size, for a fixed lens (1 at p = 1). */
export function discScale(p: number): number {
  const d = camDist(p);
  return Math.sqrt(CAM_NEAR * CAM_NEAR - 1) / Math.sqrt(d * d - 1);
}
