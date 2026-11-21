/**
 * The window that frames photos on the award Home (2026-11-22). First a
 * katomado (temple window); since the same day a plain upright window (the
 * pointed top read as a roof mark). One path family in objectBoundingBox units
 * (0..1), always with the same commands, so GSAP can morph a small window into
 * a full-bleed rectangle by tweening the `d` attribute.
 */
export type Box = { cx: number; w: number; ys: number; y1: number };

const f = (n: number) => n.toFixed(4);

/**
 * `cx` centre x, `w` width, `ys` shoulder height (where the straight sides
 * end), `y1` bottom. The arch above the shoulder is 0.3 / 0.7 of the height.
 */
export function katomadoPath({ cx, w, ys, y1 }: Box): string {
  // Plain upright window (Human instruction 2026-11-22: no roof-like point). Same signature as before:
  // the top sits where the pointed top used to be (0.3 / 0.7 of the height above the shoulder).
  const h = (y1 - ys) / 0.7;
  const y0 = ys - 0.3 * h;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  return `M${f(x0)} ${f(y1)} L${f(x0)} ${f(y0)} L${f(x1)} ${f(y0)} L${f(x1)} ${f(y1)}Z`;
}

/** The same path family, large enough to cover the whole box (full bleed). */
export const KATOMADO_FULL = katomadoPath({ cx: 0.5, w: 1.08, ys: -0.02, y1: 1.02 });

/** A katomado that fills its own box (for framed photos). */
export const KATOMADO_FRAME = katomadoPath({ cx: 0.5, w: 1, ys: 0.3, y1: 1 });
