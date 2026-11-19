/**
 * Cinematic Hero direction (Human instruction 2026-11-14): the camera move of
 * each of the twelve Hero scenes, and how the NEXT scene arrives after it.
 * Keyed by file name; scene order and crop focus live in assets/heroImages.ts.
 *
 * A move is a straight camera path from `from` to `to`:
 *   s = scale, x / y = offset in % of the frame (positive x = photo shifted
 *   right, i.e. the camera travels left).
 * `origin` is the zoom centre in % of the frame: the subject, so it never
 * drifts out. Every move is checked by `moveProblems` (edges never exposed).
 *
 * Arrivals: crossfade is the base; soft-edged directional reveals are the
 * accents, placed where two scenes differ strongly, never twice in a row.
 */
export type HeroArrival = "crossfade" | "revealRight" | "revealLeft";

type Pose = { s: number; x: number; y: number };

export type HeroDirection = {
  from: Pose;
  to: Pose;
  /** Zoom centre, % of the frame: [x, y]. */
  origin: [number, number];
  /** How the following scene comes in. */
  next: HeroArrival;
};

const pose = (s: number, x = 0, y = 0): Pose => ({ s, x, y });

const DIRECTION: Record<string, HeroDirection> = {
  // 01 Osaka Castle — the first impression after the opening slits. A heavy, slow push towards the keep,
  //    rising slightly. 1706 px source: the zoom stops at 1.09.
  "osaka-castle.jpg": { from: pose(1.025, 0, 0.4), to: pose(1.09, 0, -0.6), origin: [36, 42], next: "crossfade" },
  // 02 Kinkaku-ji — start on the pavilion, pull back until the pond and the garden frame it.
  "kyoto-kinkakuji.jpg": { from: pose(1.11), to: pose(1.03), origin: [52, 60], next: "revealRight" },
  // 03 Kobe Port Tower — travel along the waterfront from the tower towards the harbour lights.
  "kobe-port-tower.jpg": { from: pose(1.08, 2.6), to: pose(1.08, -2.6), origin: [50, 50], next: "crossfade" },
  // 04 Nara — from the deer back to the whole avenue: calm, wide. Zoom centre at the left, so the deer sits right of the headline.
  "nara-deer.jpg": { from: pose(1.1), to: pose(1.03), origin: [15, 72], next: "revealLeft" },
  // 05 Dojima River at night — a sideways glide over the water; the reflections slide past. 1920 px source.
  "osaka-dojima-river-night.jpg": { from: pose(1.07, -2.4), to: pose(1.07, 2.4), origin: [50, 60], next: "crossfade" },
  // 06 Yasaka Pagoda — walk up the dark street towards the pagoda.
  "kyoto-yasaka-pagoda-night.jpg": { from: pose(1.03, 0.6), to: pose(1.11, -0.6), origin: [66, 46], next: "revealRight" },
  // 07 Nachi Falls — scale first: pagoda and waterfall together, then a gentle push between them.
  //    Restrained zoom so the mountain keeps its size.
  "wakayama-nachi-falls.jpg": { from: pose(1.03, 0, 0.5), to: pose(1.075, 0, -0.5), origin: [50, 55], next: "crossfade" },
  // 08 Shinsekai — pan right to left across the signs, the tower staying in frame.
  "osaka-shinsekai-day.jpg": { from: pose(1.08, -2.6), to: pose(1.08, 2.6), origin: [50, 40], next: "revealLeft" },
  // 09 Akashi Kaikyo Bridge — follow the deck along its diagonal, from the near girders down towards the tower.
  //    No centre zoom: the move runs along the structure.
  "hyogo-akashi-kaikyo-bridge.jpg": { from: pose(1.09, 2.8, 1.6), to: pose(1.1, -2.8, -1.6), origin: [50, 50], next: "crossfade" },
  // 10 Daruma — open from a few faces to the whole wall.
  "osaka-daruma.jpg": { from: pose(1.1), to: pose(1.03), origin: [50, 45], next: "revealRight" },
  // 11 Arashiyama — glide along the water in the boat's direction with a slight push: maples and boat both stay.
  //    The photo moves as one piece; the boat is never moved on its own.
  "kyoto-arashiyama-boat.jpg": { from: pose(1.06, 2.2), to: pose(1.09, -2.2), origin: [50, 62], next: "crossfade" },
  // 12 Dotonbori — night push-in along the canal; portrait 1307 px source, so the zoom stays small.
  //    Dissolves into Osaka Castle to close the loop.
  "osaka-dotonbori.jpg": { from: pose(1.02), to: pose(1.07), origin: [55, 55], next: "crossfade" },
};

const FALLBACK: HeroDirection = { from: pose(1.02), to: pose(1.08), origin: [50, 50], next: "crossfade" };

export function heroDirection(src: string): HeroDirection {
  return DIRECTION[src.split("/").pop() ?? ""] ?? FALLBACK;
}

/** CSS custom properties for the `camera` keyframes (CinematicHero.module.css). */
export function moveVars(d: HeroDirection): Record<string, string> {
  return {
    "--fs": String(d.from.s),
    "--fx": `${d.from.x}%`,
    "--fy": `${d.from.y}%`,
    "--ts": String(d.to.s),
    "--tx": `${d.to.x}%`,
    "--ty": `${d.to.y}%`,
  };
}

/**
 * Edge check. A frame scaled by `s` around origin `o` (0–1) and shifted by `t`
 * (fraction of the frame) still covers the frame when
 *   -(1 - o)(s - 1) <= t <= o(s - 1)
 * on each axis. The path is straight in (s, t), and the bounds are linear in
 * s, so checking both ends covers the whole move. Returns the problems found.
 */
export function moveProblems(d: HeroDirection): string[] {
  const problems: string[] = [];
  for (const [name, p] of [["from", d.from], ["to", d.to]] as const) {
    for (const [axis, t, o] of [["x", p.x / 100, d.origin[0] / 100], ["y", p.y / 100, d.origin[1] / 100]] as const) {
      const max = o * (p.s - 1);
      const min = -(1 - o) * (p.s - 1);
      if (t > max + 1e-9 || t < min - 1e-9) problems.push(`${name}.${axis}=${(t * 100).toFixed(2)}% outside [${(min * 100).toFixed(2)}%, ${(max * 100).toFixed(2)}%]`);
    }
    if (p.s < 1.02 || p.s > 1.12) problems.push(`${name}.s=${p.s} outside 1.02–1.12`);
  }
  return problems;
}

export const HERO_DIRECTION_FILES = Object.keys(DIRECTION);
