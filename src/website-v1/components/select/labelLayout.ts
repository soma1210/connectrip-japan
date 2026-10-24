/**
 * Collision-aware label placement for map pins (Connectrip Select v0.2).
 *
 * Every spot keeps a visible name. Each label scores positions next to its
 * pin and further out (with a leader line back to the pin): overlaps with
 * labels / pins, leaving the map, leader lines crossing other leaders or
 * passing through labels, and leader length all cost. The cheapest position
 * wins, so labels stay close and lines rarely cross. Dense pins go first.
 * Nothing is ever hidden.
 */
export type LabelInput = { id: string; x: number; y: number; width: number; height: number };
export type LabelPlacement = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  /** Leader line from the pin head to the label, when the label is offset. */
  leader?: { x1: number; y1: number; x2: number; y2: number };
};

type Rect = { x1: number; y1: number; x2: number; y2: number };

/** Pin head sits this far above the pin point (the point is the pin tip). */
export const PIN_HEAD_OFFSET = 17;
const PIN_BOX = { w: 18, h: 26 };
const GAP = 4;

const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));

type Segment = { x1: number; y1: number; x2: number; y2: number };

function segmentsCross(a: Segment, b: Segment) {
  const d = (p: number, q: number, r: number, s: number, t: number, u: number) => (r - p) * (u - q) - (s - q) * (t - p);
  const d1 = d(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1);
  const d2 = d(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2);
  const d3 = d(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1);
  const d4 = d(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function segmentHitsRect(s: Segment, r: Rect) {
  const inside = (x: number, y: number) => x > r.x1 && x < r.x2 && y > r.y1 && y < r.y2;
  if (inside(s.x1, s.y1) || inside(s.x2, s.y2)) return true;
  const edges: Segment[] = [
    { x1: r.x1, y1: r.y1, x2: r.x2, y2: r.y1 },
    { x1: r.x2, y1: r.y1, x2: r.x2, y2: r.y2 },
    { x1: r.x2, y1: r.y2, x2: r.x1, y2: r.y2 },
    { x1: r.x1, y1: r.y2, x2: r.x1, y2: r.y1 },
  ];
  return edges.some((e) => segmentsCross(s, e));
}

function nearestPoint(r: Rect, x: number, y: number) {
  return { x: Math.min(Math.max(x, r.x1), r.x2), y: Math.min(Math.max(y, r.y1), r.y2) };
}

export function layoutLabels(items: LabelInput[], bounds: { width: number; height: number }): LabelPlacement[] {
  const pins: Rect[] = items.map((p) => ({ x1: p.x - PIN_BOX.w / 2, x2: p.x + PIN_BOX.w / 2, y1: p.y - PIN_BOX.h, y2: p.y }));
  const placed: Rect[] = [];
  const leaders: Segment[] = [];

  // Most crowded first.
  const crowd = (p: LabelInput) => items.filter((q) => q !== p && Math.hypot(q.x - p.x, q.y - p.y) < 90).length;
  const order = [...items].sort((a, b) => crowd(b) - crowd(a) || a.y - b.y);

  const result = new Map<string, LabelPlacement>();
  for (const p of order) {
    const hx = p.x;
    const hy = p.y - PIN_HEAD_OFFSET;
    const { width: w, height: h } = p;
    const candidates: { r: Rect; leader: boolean }[] = [
      { r: { x1: hx + 11, y1: hy - h / 2, x2: hx + 11 + w, y2: hy + h / 2 }, leader: false },
      { r: { x1: hx - 11 - w, y1: hy - h / 2, x2: hx - 11, y2: hy + h / 2 }, leader: false },
    ];
    for (const dist of [30, 52, 76, 104, 136]) {
      for (const deg of [0, 180, -30, 30, 150, -150, -60, 60, -120, 120, -90, 90]) {
        const a = (deg * Math.PI) / 180;
        const cx = hx + Math.cos(a) * dist;
        const cy = hy + Math.sin(a) * dist;
        // Anchor the box on the side facing away from the pin.
        const x1 = Math.cos(a) > 0.2 ? cx : Math.cos(a) < -0.2 ? cx - w : cx - w / 2;
        candidates.push({ r: { x1, y1: cy - h / 2, x2: x1 + w, y2: cy + h / 2 }, leader: true });
      }
    }

    let best: { r: Rect; leader: boolean; cost: number } | undefined;
    for (const c of candidates) {
      const r = c.r;
      const out = r.x1 < GAP || r.y1 < GAP || r.x2 > bounds.width - GAP || r.y2 > bounds.height - GAP;
      const padded = { x1: r.x1 - GAP, y1: r.y1 - GAP, x2: r.x2 + GAP, y2: r.y2 + GAP };
      const overlap =
        placed.reduce((sum, q) => sum + overlapArea(padded, q), 0) +
        pins.reduce((sum, q, i) => sum + (items[i] === p ? 0 : overlapArea(padded, q)), 0);
      const end = nearestPoint(r, hx, hy);
      const leader = { x1: hx, y1: hy, x2: end.x, y2: end.y };
      const length = c.leader ? Math.hypot(end.x - hx, end.y - hy) : 0;
      const crossings = c.leader ? leaders.filter((l) => segmentsCross(leader, l)).length : 0;
      const through = c.leader ? placed.filter((q) => segmentHitsRect(leader, q)).length : 0;
      // Labels placed earlier must not have their leaders cut by this label.
      const cut = leaders.filter((l) => segmentHitsRect(l, r)).length;
      const cost = (out ? 1e7 : 0) + overlap * 50 + (crossings + through + cut) * 900 + length * 2 + (c.leader ? 20 : 0);
      if (!best || cost < best.cost) best = { ...c, cost };
    }
    const chosen = best!;
    placed.push(chosen.r);
    const anchor = nearestPoint(chosen.r, hx, hy);
    if (chosen.leader) leaders.push({ x1: hx, y1: hy, x2: anchor.x, y2: anchor.y });
    result.set(p.id, {
      id: p.id,
      left: chosen.r.x1,
      top: chosen.r.y1,
      width: w,
      height: h,
      leader: chosen.leader ? { x1: hx, y1: hy, x2: anchor.x, y2: anchor.y } : undefined,
    });
  }
  return items.map((p) => result.get(p.id)!);
}
