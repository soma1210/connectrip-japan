/**
 * A stippled red-crowned crane (tancho) for WHY TRAVEL WITH CONNECTRIP (Human instruction
 * 2026-11-25, "The Journey of a Crane").
 *
 * The bird is a 3D point model, about 9,000 dots and 2,000 short strokes, made once from a
 * seeded random generator. It is drawn on a 2D canvas, so WebGL is not needed. Each feather
 * is drawn with a shaft, barbs, edge dots and stippled vanes, in the manner of an engraving.
 * The plumage follows the real bird:
 * - white body, primaries and coverts;
 * - black neck, face, secondaries and tertials, drawn here as dim bronze;
 * - a white nape and a vermilion crown.
 *
 * The local frame is x forward, y to the right wing and z up; one unit is about a metre.
 * Each wing has a shoulder, a wrist and fingertip joints. A flap therefore folds and sweeps
 * the hand on the upstroke, and the outer feathers trail the inner wing in phase.
 */

export type Flap = { a1: number; a2: number; a3: number; sweep: number; bob: number };

export type CranePose = {
  /** Centre of the body, CSS px in the canvas. */
  x: number;
  y: number;
  /** Direction of flight on screen, radians (0 = to the right, y down). */
  heading: number;
  /** Roll into the turn, radians. */
  bank: number;
  /** CSS px per model unit (the wingspan is about 2.6 units). */
  scale: number;
  alpha: number;
  /** 0 → scattered dots, 1 → the bird is formed. */
  assemble: number;
  flap: Flap;
};

const SW = 0.38; // wrist, along the span
const SMAX = 0.95; // end of the leading edge
const SH = 0.085; // shoulder, half the body width
const XW = 0.17; // wrist, along the body
const TILT = 0.68; // we see the back, turned a little toward one flank
const PERSP = 0.12;
const NB = 14; // tone buckets

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const xLE = (s: number) =>
  s <= SW ? 0.12 + 0.075 * Math.sin((s / SW) * (Math.PI / 2)) : 0.195 - 0.36 * Math.pow((s - SW) / (SMAX - SW), 1.45);
const cov = (s: number) => 0.16 - 0.075 * (s / SMAX);

// Parts: 0 body / neck / head (back faces hidden), 1 right wing, 2 left wing, 3 legs, tail, bill (never hidden).
type Builder = {
  d: number[]; // x, y|s, z, nx, ny, nz, tone, size, part, red, key, delay, scx, scy  (14)
  s: number[]; // ax, ay, az, bx, by, bz, tone, part, key, delay, scx, scy  (12)
};
const DF = 14;
const SF = 12;

export type CraneModel = {
  dn: number;
  sn: number;
  d: Float32Array;
  s: Float32Array;
  // scratch, reused every frame
  dX: Float32Array;
  dY: Float32Array;
  dB: Int8Array;
  dZ: Float32Array;
  sX: Float32Array;
  sY: Float32Array;
  sX2: Float32Array;
  sY2: Float32Array;
  sB: Int8Array;
  dOrd: Int32Array;
  sOrd: Int32Array;
  gold: string[];
  red: string[];
};

export function createCrane(seed = 11): CraneModel {
  const r = rng(seed);
  const b: Builder = { d: [], s: [] };
  const scatter = () => {
    const a = r() * Math.PI * 2;
    const m = 0.35 + r() * 1.5;
    return [Math.cos(a) * m, Math.sin(a) * m];
  };
  const dot = (x: number, y: number, z: number, nx: number, ny: number, nz: number, tone: number, size: number, part: number, red = 0) => {
    const [sx, sy] = scatter();
    const dl = Math.min(0.55, Math.max(0, 0.08 + (0.9 - x) * 0.2 + r() * 0.22));
    b.d.push(x, y, z, nx, ny, nz, tone, size, part, red, r(), dl, sx, sy);
  };
  const stroke = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, tone: number, part: number) => {
    const [sx, sy] = scatter();
    const dl = Math.min(0.6, Math.max(0, 0.12 + (0.9 - ax) * 0.2 + r() * 0.22));
    b.s.push(ax, ay, az, bx, by, bz, tone, part, r(), dl, sx, sy);
  };
  const j = (v: number) => (r() - 0.5) * v;

  // ---- Feather: shaft, barbs, edge dots and stippled vanes, in the (x, lateral) plane. ----
  const feather = (
    part: number,
    x0: number,
    l0: number,
    ang: number,
    len: number,
    w: number,
    tone: number,
    z0: number,
    opts: { outer?: number; curl?: number; nb?: number; lsign?: number } = {},
  ) => {
    const outer = opts.outer ?? 0.4;
    const curl = opts.curl ?? 0.06;
    const nb = opts.nb ?? 9;
    const ls = opts.lsign ?? 1;
    const dx = -Math.cos(ang);
    const dl = Math.sin(ang) * ls;
    const px = Math.sin(ang);
    const pl = Math.cos(ang) * ls;
    const at = (t: number, off: number): [number, number, number] => {
      const bend = -curl * len * t * t;
      return [x0 + dx * len * t + px * (bend + off), l0 + dl * len * t + pl * (bend + off), z0 + 0.012 * t];
    };
    const wid = (t: number) => w * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.93)), 0.5);
    const N = part === 1 || part === 2 ? [0, 0, 1] : [0, 0, 1];
    // shaft
    for (let k = 0; k < 4; k++) {
      const a = at(k / 4, 0);
      const c = at((k + 1) / 4, 0);
      stroke(a[0], a[1], a[2], c[0], c[1], c[2], tone * 0.95, part);
    }
    // barbs, angled toward the tip
    for (let k = 1; k <= nb; k++) {
      const t = k / (nb + 1);
      const a = at(t, 0);
      const ww = wid(t);
      for (const side of [1, -1]) {
        const fr = side > 0 ? outer : 1 - outer;
        const e = at(Math.min(1, t + (ww * 0.6) / len), side * ww * fr);
        stroke(a[0], a[1], a[2], e[0], e[1], e[2], tone * 0.72, part);
      }
    }
    // edges
    const ne = Math.round(len * 70);
    for (let k = 0; k <= ne; k++) {
      const t = k / ne;
      const ww = wid(t);
      for (const side of [1, -1]) {
        const fr = side > 0 ? outer : 1 - outer;
        const p = at(t, side * ww * fr + j(0.003));
        dot(p[0], p[1], p[2], N[0], N[1], N[2], tone * (0.88 + r() * 0.12), 0.85 + r() * 0.3, part);
      }
    }
    // vanes
    const nf = Math.round(len * 110);
    for (let k = 0; k < nf; k++) {
      const t = Math.pow(r(), 0.85);
      const side = r() < 0.5 ? 1 : -1;
      const fr = side > 0 ? outer : 1 - outer;
      const p = at(t, side * wid(t) * fr * Math.pow(r(), 0.7));
      dot(p[0], p[1], p[2], N[0], N[1], N[2], tone * (0.62 + r() * 0.3), 0.7 + r() * 0.35, part);
    }
  };

  // ---- Wings ----
  for (const sg of [1, -1]) {
    const part = sg > 0 ? 1 : 2;
    // coverts: dense, brightest near the leading edge
    for (let i = 0; i < 1250; i++) {
      const s = Math.pow(r(), 0.92) * SMAX * 0.985;
      const v = Math.pow(r(), 1.3);
      const x = xLE(s) - v * (cov(s) + 0.025);
      const z = 0.028 * Math.sin(Math.PI * Math.min(1, v * 1.05)) * (1 - (0.5 * s) / SMAX);
      dot(x, s, z, 0, 0, 1, 0.74 + 0.24 * (1 - v) + j(0.08), 0.75 + r() * 0.5, part);
    }
    // covert rows, as small scallops
    for (let row = 0; row < 4; row++) {
      const v0 = 0.2 + row * 0.21;
      for (let s = 0.012 + row * 0.006; s < SMAX * 0.93; s += 0.017) {
        const x = xLE(s) - v0 * cov(s);
        const z = 0.028 * Math.sin(Math.PI * v0);
        stroke(x, s, z, x - 0.026, s + 0.007, z - 0.002, 0.6 - row * 0.05, part);
      }
    }
    // leading edge
    for (let k = 0; k < 300; k++) {
      const s = (k / 299) * SMAX;
      if (r() < 0.7) dot(xLE(s) + 0.002 + j(0.004), s, 0.004, 0, 0, 1, 0.8 + r() * 0.2, 0.9 + r() * 0.3, part);
    }
    // alula at the wrist
    feather(part, xLE(SW + 0.02) - 0.01, SW + 0.02, 2.5, 0.045, 0.014, 0.8, 0.01, { nb: 3 });
    // secondaries and tertials: black, shown as dim bronze
    const NS = 15;
    for (let k = 0; k < NS; k++) {
      const t = k / (NS - 1);
      const s = 0.03 + t * (SW + 0.04);
      const tert = k < 3;
      feather(part, xLE(s) - cov(s) + 0.04, s, 0.04 + 0.14 * t, (tert ? 0.31 : 0.27) - 0.05 * t, 0.058, tert ? 0.3 : 0.34, -0.004 - k * 0.0008, {
        outer: 0.45,
        curl: tert ? 0.12 : 0.04,
        nb: 8,
      });
    }
    // primaries: white, fanned, the outer ones parted like fingers
    const NP = 10;
    for (let k = 0; k < NP; k++) {
      const t = k / (NP - 1);
      const s = SW + 0.05 + t * (SMAX - SW - 0.12);
      const len = 0.29 + 0.14 * Math.sin(t * Math.PI * 0.88);
      feather(part, xLE(s) - cov(s) * 0.8 + 0.035, s, 0.55 + 0.88 * Math.pow(t, 1.1), len, 0.052 - 0.014 * t, 0.93, -0.002 - k * 0.001, {
        outer: 0.34,
        curl: 0.05 + 0.05 * t,
        nb: 10,
      });
    }
  }

  // ---- Body (white) ----
  const ell = (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, n: number, tone: (vx: number, vy: number, vz: number) => [number, number], part = 0, size = [0.8, 1.25]) => {
    for (let i = 0; i < n; i++) {
      const u = 2 * r() - 1;
      const th = r() * Math.PI * 2;
      const q = Math.sqrt(1 - u * u);
      const vx = u;
      const vy = q * Math.cos(th);
      const vz = q * Math.sin(th);
      const f = 1 + 0.14 * vx;
      const nx = vx / rx;
      const ny = vy / (ry * f);
      const nz = vz / (rz * f);
      const nl = Math.hypot(nx, ny, nz);
      const [t, red] = tone(vx, vy, vz);
      dot(cx + rx * vx, cy + ry * f * vy, cz + rz * f * vz, nx / nl, ny / nl, nz / nl, t, size[0] + r() * (size[1] - size[0]), part, red);
    }
  };
  ell(-0.02, 0, 0.005, 0.3, 0.132, 0.112, 2100, () => [0.9 + j(0.12), 0]);
  // contour feathers on the back
  for (let i = 0; i < 300; i++) {
    const x = -0.26 + r() * 0.48;
    const y = (r() * 2 - 1) * 0.085 * Math.sqrt(Math.max(0, 1 - ((x + 0.02) / 0.29) ** 2));
    const z = 0.1 * Math.sqrt(Math.max(0, 1 - ((x + 0.02) / 0.29) ** 2 - (y / 0.112) ** 2)) + 0.002;
    stroke(x, y, z, x - 0.034, y * 1.06, z - 0.003, 0.66 + j(0.12), 0);
  }

  // ---- Neck: black at the front and sides, a white band down the nape ----
  for (let i = 0; i < 760; i++) {
    const t = r();
    const th = r() * Math.PI * 2;
    const cx = 0.22 + t * 0.4;
    const cz = 0.022 + 0.018 * t;
    const rad = 0.056 - 0.025 * t;
    const sn = Math.sin(th);
    const white = sn > 0.25 && t < 0.86;
    dot(cx, rad * Math.cos(th), cz + rad * sn, 0, Math.cos(th), sn, white ? 0.86 + j(0.1) : 0.32 + j(0.08), 0.75 + r() * 0.4, 0);
  }
  for (let i = 0; i < 180; i++) {
    const t = r();
    const th = Math.PI * (0.15 + r() * 0.7);
    const cx = 0.22 + t * 0.4;
    const rad = 0.056 - 0.025 * t;
    const y = rad * Math.cos(th);
    const z = 0.022 + 0.018 * t + rad * Math.sin(th);
    stroke(cx + 0.02, y, z, cx - 0.008, y, z - 0.002, Math.sin(th) > 0.25 && t < 0.86 ? 0.66 : 0.28, 0);
  }

  // ---- Head: vermilion crown, black face, white behind the eye ----
  ell(0.645, 0, 0.04, 0.056, 0.037, 0.042, 420, (vx, _vy, vz) => {
    if (vz > 0.5 && vx > -0.3 && vx < 0.6) return [0.85 + j(0.1), 1];
    if (vx > 0.15) return [0.3 + j(0.08), 0];
    return [0.86 + j(0.1), 0];
  }, 0, [0.7, 1.05]);
  for (const sg of [1, -1]) dot(0.672, sg * 0.031, 0.05, 0, sg, 0.3, 1, 1.5, 0);

  // ---- Bill ----
  for (let i = 0; i < 220; i++) {
    const t = Math.pow(r(), 0.8);
    const th = r() * Math.PI * 2;
    const rad = 0.017 * (1 - t) + 0.002;
    dot(0.695 + t * 0.18, rad * Math.cos(th), 0.036 - t * 0.008 + rad * 0.7 * Math.sin(th), 0, Math.cos(th), Math.sin(th), 0.6 + j(0.12), 0.7 + r() * 0.3, 3);
  }
  stroke(0.695, 0, 0.05, 0.875, 0, 0.029, 0.7, 3);

  // ---- Tail: a short white fan ----
  for (let k = 0; k < 12; k++) {
    const t = k / 11 - 0.5;
    feather(3, -0.25, t * 0.08, -t * 0.45, 0.12, 0.026, k % 2 ? 0.5 : 0.62, 0.01, { outer: 0.5, curl: 0, nb: 4 });
  }

  // ---- Legs: dark, trailing behind the tail ----
  for (const sg of [1, -1]) {
    const ax = -0.12;
    const ay = sg * 0.03;
    const az = -0.07;
    const bx = -0.86;
    const by = sg * 0.042;
    const bz = -0.1;
    for (let k = 0; k < 14; k++) {
      const t0 = k / 14;
      const t1 = (k + 1) / 14;
      for (const o of [-0.0055, 0.0055]) {
        stroke(ax + (bx - ax) * t0, ay + (by - ay) * t0 + o, az + (bz - az) * t0, ax + (bx - ax) * t1, ay + (by - ay) * t1 + o, az + (bz - az) * t1, 0.46, 3);
      }
    }
    for (let i = 0; i < 70; i++) {
      const t = r();
      dot(ax + (bx - ax) * t, ay + (by - ay) * t + j(0.01), az + (bz - az) * t, 0, 0, 1, 0.42 + j(0.1), 0.7, 3);
    }
    // black thigh feathers
    for (let i = 0; i < 60; i++) dot(-0.1 - r() * 0.07, sg * (0.03 + j(0.02)), -0.06 + j(0.02), 0, 0, 1, 0.3, 0.8, 3);
    // toes
    for (const ta of [-0.28, 0, 0.28]) {
      const ex = bx - 0.075 * Math.cos(ta);
      const ey = by + sg * 0.075 * Math.sin(ta) * 0.6;
      stroke(bx, by, bz, ex, ey, bz - 0.01, 0.48, 3);
    }
  }

  const d = new Float32Array(b.d);
  const s = new Float32Array(b.s);
  const dn = d.length / DF;
  const sn = s.length / SF;

  const mix = (a: number[], c: number[], t: number) => a.map((v, i) => Math.round(v + (c[i] - v) * t));
  const stops: [number, number[]][] = [
    [0, [74, 57, 33]],
    [0.42, [150, 116, 58]],
    [0.72, [207, 169, 95]],
    [1, [246, 231, 190]],
  ];
  const goldAt = (t: number) => {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
    }
    return stops[stops.length - 1][1];
  };
  const gold: string[] = [];
  const red: string[] = [];
  for (let i = 0; i < NB; i++) {
    const t = (i + 0.5) / NB;
    const [cr, cg, cb] = goldAt(t);
    gold.push(`rgba(${cr},${cg},${cb},${(0.22 + 0.78 * Math.pow(t, 0.85)).toFixed(3)})`);
    red.push(`rgba(224,83,47,${(0.2 + 0.8 * t).toFixed(3)})`);
  }

  return {
    dn,
    sn,
    d,
    s,
    dX: new Float32Array(dn),
    dY: new Float32Array(dn),
    dB: new Int8Array(dn),
    dZ: new Float32Array(dn),
    sX: new Float32Array(sn),
    sY: new Float32Array(sn),
    sX2: new Float32Array(sn),
    sY2: new Float32Array(sn),
    sB: new Int8Array(sn),
    dOrd: new Int32Array(dn),
    sOrd: new Int32Array(sn),
    gold,
    red,
  };
}

/** Wing-beat state. Downstrokes are quicker than upstrokes, and the hand folds back on the way up. */
export class Wingbeat {
  phase = 0.6;
  weight = 1;
  step(dt: number, target: number, rate = 1) {
    this.weight += (target - this.weight) * (1 - Math.exp(-dt * 2.6));
    const om = Math.PI * 2 * 1.45 * rate;
    this.phase += dt * om * (1 + 0.32 * Math.sin(this.phase)) * (0.35 + 0.65 * this.weight);
  }
  get flap(): Flap {
    const p = this.phase;
    const w = this.weight;
    return {
      a1: 0.1 + w * 0.64 * Math.cos(p),
      a2: -0.03 + w * 0.36 * Math.cos(p - 0.6),
      a3: 0.13 + w * 0.3 * Math.cos(p - 1.2),
      sweep: 0.05 + w * 0.42 * Math.pow(Math.max(0, -Math.sin(p - 0.2)), 1.2),
      bob: -w * 0.03 * Math.cos(p),
    };
  }
}

export const GLIDE: Flap = { a1: 0.1, a2: -0.03, a3: 0.13, sweep: 0.05, bob: 0 };

const L = (() => {
  const v = [-0.38, -0.55, 0.74];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((c) => c / l);
})();

/**
 * Draws the crane. `ctx` has no transform; positions are multiplied by `dpr`.
 * Returns the device-pixel box it drew into, so the caller can clear just that box next time.
 */
export function drawCrane(ctx: CanvasRenderingContext2D, m: CraneModel, pose: CranePose, dpr: number, lod = 1) {
  const { d, s, dX, dY, dB, dZ, sX, sY, sX2, sY2, sB } = m;
  const S = pose.scale * dpr;
  const cx = pose.x * dpr;
  const cy = pose.y * dpr;
  const ch = Math.cos(pose.heading);
  const sh = Math.sin(pose.heading);
  const fx = ch;
  const fy = sh;
  const spx = -sh;
  const spy = ch;
  const al = TILT * Math.cos(pose.heading) + pose.bank;
  const ca = Math.cos(al);
  const sa = Math.sin(al);
  const nx = -sa * spx;
  const ny = -sa * spy;
  const nz = ca;
  const rx = ca * spx;
  const ry = ca * spy;
  const rz = sa;
  const { a1, a2, a3, sweep, bob } = pose.flap;
  const c1 = Math.cos(a1);
  const s1 = Math.sin(a1);
  const cw = Math.cos(sweep);
  const swn = Math.sin(sweep);
  const asm = pose.assemble;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // local → world → screen
  let wx = 0;
  let wy = 0;
  let wz = 0;
  let lnx = 0;
  let lny = 0;
  let lnz = 1;
  const local = (x: number, y: number, z: number, part: number) => {
    if (part === 1 || part === 2) {
      const sg = part === 1 ? 1 : -1;
      let ly: number;
      let lz: number;
      let lx: number;
      let ang: number;
      if (y <= SW) {
        ang = a1;
        ly = y * c1 - z * s1;
        lz = y * s1 + z * c1;
        lx = x;
      } else {
        const ds = y - SW;
        const dx = x - XW;
        const dx2 = dx * cw - ds * swn;
        const ds2 = dx * swn + ds * cw;
        const tip = Math.min(1, Math.max(0, (y - 0.68) / 0.4));
        ang = a1 + a2 + a3 * tip * tip * (3 - 2 * tip);
        const cb = Math.cos(ang);
        const sb = Math.sin(ang);
        ly = SW * c1 + ds2 * cb - z * sb;
        lz = SW * s1 + ds2 * sb + z * cb;
        lx = XW + dx2;
      }
      ly = sg * (SH + ly);
      lz += 0.02;
      lnx = 0;
      lny = -sg * Math.sin(ang);
      lnz = Math.cos(ang);
      wx = lx * fx + ly * rx + lz * nx;
      wy = lx * fy + ly * ry + lz * ny;
      wz = ly * rz + lz * nz;
      return;
    }
    const lz = z + bob;
    wx = x * fx + y * rx + lz * nx;
    wy = x * fy + y * ry + lz * ny;
    wz = y * rz + lz * nz;
  };

  const shade = (tone: number, part: number, onx: number, ony: number, onz: number) => {
    // world normal
    const Nx = onx * fx + ony * rx + onz * nx;
    const Ny = onx * fy + ony * ry + onz * ny;
    const Nz = ony * rz + onz * nz;
    const l = Nx * L[0] + Ny * L[1] + Nz * L[2];
    let v: number;
    if (part === 1 || part === 2) v = Nz >= 0 ? tone * (0.42 + 0.58 * Math.max(0, l)) : tone * (0.34 + 0.45 * Math.abs(l));
    else if (part === 0) {
      if (Nz < -0.12) return -1; // the far side of the body is hidden
      v = tone * (0.55 + 0.45 * Math.max(0, l));
    } else v = tone * 0.9;
    return v * (0.84 + 0.16 * Math.min(1, Math.max(0, 0.55 + wz)));
  };

  const ease = (a: number, dl: number) => {
    const q = Math.min(1, Math.max(0, (a - dl) / 0.45));
    return 1 - (1 - q) * (1 - q) * (1 - q);
  };

  // ---- dots ----
  let farWingZ = 0;
  let nearWingZ = 0;
  for (let i = 0, o = 0; i < m.dn; i++, o += DF) {
    if (d[o + 10] > lod) {
      dB[i] = -1;
      continue;
    }
    const part = d[o + 8];
    local(d[o], d[o + 1], d[o + 2], part);
    let tone = d[o + 6];
    let onx = d[o + 3];
    let ony = d[o + 4];
    let onz = d[o + 5];
    if (part === 1 || part === 2) {
      onx = lnx;
      ony = lny;
      onz = lnz;
      if (part === 1) farWingZ += wz;
      else nearWingZ += wz;
    }
    const k = 1 / (1 - wz * PERSP);
    let X = cx + wx * S * k;
    let Y = cy + wy * S * k;
    let v = shade(tone, part, onx, ony, onz);
    // Stipple: tone is carried by density as much as by colour.
    const keep = (d[o + 10] * 9.73) % 1;
    if (v < 0 || keep > v * 1.35 + 0.12) {
      dB[i] = -1;
      continue;
    }
    if (asm < 1) {
      const q = ease(asm, d[o + 11]);
      X += (1 - q) * d[o + 12] * S;
      Y += (1 - q) * d[o + 13] * S;
      v *= q;
    }
    tone = v * pose.alpha;
    if (tone < 0.04) {
      dB[i] = -1;
      continue;
    }
    dX[i] = X;
    dY[i] = Y;
    dZ[i] = d[o + 7] * k;
    dB[i] = Math.min(NB - 1, Math.floor(tone * NB));
    if (X < minX) minX = X;
    if (X > maxX) maxX = X;
    if (Y < minY) minY = Y;
    if (Y > maxY) maxY = Y;
  }

  // ---- strokes ----
  for (let i = 0, o = 0; i < m.sn; i++, o += SF) {
    if (s[o + 8] > lod) {
      sB[i] = -1;
      continue;
    }
    const part = s[o + 7];
    local(s[o], s[o + 1], s[o + 2], part);
    const k = 1 / (1 - wz * PERSP);
    let X1 = cx + wx * S * k;
    let Y1 = cy + wy * S * k;
    const z1 = wz;
    const n1x = lnx;
    const n1y = lny;
    const n1z = lnz;
    local(s[o + 3], s[o + 4], s[o + 5], part);
    const k2 = 1 / (1 - wz * PERSP);
    let X2 = cx + wx * S * k2;
    let Y2 = cy + wy * S * k2;
    wz = (wz + z1) / 2;
    let v = part === 1 || part === 2 ? shade(s[o + 6], part, n1x, n1y, n1z) : shade(s[o + 6], part === 0 ? 3 : part, 0, 0, 1);
    if (v < 0) {
      sB[i] = -1;
      continue;
    }
    if (asm < 1) {
      const q = ease(asm, s[o + 9]);
      const ox = (1 - q) * s[o + 10] * S;
      const oy = (1 - q) * s[o + 11] * S;
      X1 += ox;
      X2 += ox;
      Y1 += oy;
      Y2 += oy;
      v *= q;
    }
    const tone = v * pose.alpha;
    if (tone < 0.05) {
      sB[i] = -1;
      continue;
    }
    sX[i] = X1;
    sY[i] = Y1;
    sX2[i] = X2;
    sY2[i] = Y2;
    sB[i] = Math.min(NB - 1, Math.floor(tone * NB));
  }

  // ---- paint: far wing, then body, then near wing ----
  const farPart = farWingZ < nearWingZ ? 1 : 2;
  const order = [farPart, -1, farPart === 1 ? 2 : 1];
  const dotPx = Math.max(0.75 * dpr, Math.min(2.3 * dpr, S * 0.0098));
  const lw = Math.max(0.5 * dpr, Math.min(1.1 * dpr, S * 0.0052));
  ctx.lineCap = "round";
  ctx.lineWidth = lw;
  // One counting sort into (group, tone, red) runs, then one path per run.
  const slot = (part: number) => (part === order[0] ? 0 : part === order[2] ? 2 : 1);
  const K = 3 * NB * 2;
  const dCount = new Int32Array(K + 1);
  const sCount = new Int32Array(3 * NB + 1);
  for (let i = 0, o = 0; i < m.dn; i++, o += DF) if (dB[i] >= 0) dCount[(slot(d[o + 8]) * NB + dB[i]) * 2 + d[o + 9] + 1]++;
  for (let i = 0, o = 0; i < m.sn; i++, o += SF) if (sB[i] >= 0) sCount[slot(s[o + 7]) * NB + sB[i] + 1]++;
  for (let k = 1; k <= K; k++) dCount[k] += dCount[k - 1];
  for (let k = 1; k <= 3 * NB; k++) sCount[k] += sCount[k - 1];
  const dOrd = m.dOrd;
  const sOrd = m.sOrd;
  const dPos = dCount.slice(0, K);
  const sPos = sCount.slice(0, 3 * NB);
  for (let i = 0, o = 0; i < m.dn; i++, o += DF) if (dB[i] >= 0) dOrd[dPos[(slot(d[o + 8]) * NB + dB[i]) * 2 + d[o + 9]]++] = i;
  for (let i = 0, o = 0; i < m.sn; i++, o += SF) if (sB[i] >= 0) sOrd[sPos[slot(s[o + 7]) * NB + sB[i]]++] = i;
  for (let g = 0; g < 3; g++) {
    for (let bk = 0; bk < NB; bk++) {
      // strokes first, dots on top
      const sk = g * NB + bk;
      if (sCount[sk + 1] > sCount[sk]) {
        ctx.beginPath();
        for (let q = sCount[sk]; q < sCount[sk + 1]; q++) {
          const i = sOrd[q];
          ctx.moveTo(sX[i], sY[i]);
          ctx.lineTo(sX2[i], sY2[i]);
        }
        ctx.strokeStyle = m.gold[bk];
        ctx.stroke();
      }
      for (let isRed = 0; isRed < 2; isRed++) {
        const dk = (g * NB + bk) * 2 + isRed;
        if (dCount[dk + 1] === dCount[dk]) continue;
        ctx.beginPath();
        for (let q = dCount[dk]; q < dCount[dk + 1]; q++) {
          const i = dOrd[q];
          const sz = dotPx * dZ[i];
          ctx.rect(dX[i] - sz / 2, dY[i] - sz / 2, sz, sz);
        }
        ctx.fillStyle = isRed ? m.red[bk] : m.gold[bk];
        ctx.fill();
      }
    }
  }
  const pad = 4 * dpr;
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
}
