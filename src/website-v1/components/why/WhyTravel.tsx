"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { createCrane, drawCrane, GLIDE, Wingbeat, type CraneModel } from "./crane";
import styles from "./WhyTravel.module.css";

/**
 * WHY TRAVEL WITH CONNECTRIP · "The Journey of a Crane" (Human instruction 2026-11-25,
 * final art direction; replaces the "one line, one journey" version kept in
 * .claude/backups/why-travel-line-2026-11-25).
 *
 * One screen, no pin. The heading sits at the top left. The four strengths alternate:
 * 01 upper left, 02 right, 03 left, 04 lower right. Each has a fine gold ring with a small
 * vermilion dot. A single crane (a stippled tancho drawn on a canvas, see crane.ts) flies
 * from 01 to 04 and leaves a gold dotted trail behind it. The trail is a chain of smooth S
 * curves, routed so that it never crosses any text.
 *
 * Arriving at a strength makes its ring ripple, and its title brightens with a wipe. After
 * 04 the crane lifts away into the widest open space and stays there in a glide, so the
 * finished composition holds. The animation plays once and takes about 5.5 seconds. It
 * pauses while the section is off screen.
 *
 * Fallbacks: the text is plain HTML (h2, ol, h3, p) and is always readable. Without
 * JavaScript, the four strengths show with their rings, with no trail and no crane. With
 * reduced motion, the finished composition (full trail, crane gliding) is drawn once.
 */

type Rect = { l: number; t: number; r: number; b: number };
type Pt = { x: number; y: number };

const T_APPEAR = 0.95;
const T_PATH = 3.5;
const T_EXIT = 1.35;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const rectDist = (x: number, y: number, r: Rect) => {
  const dx = Math.max(r.l - x, 0, x - r.r);
  const dy = Math.max(r.t - y, 0, y - r.b);
  return Math.hypot(dx, dy);
};
const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};
const hits = (pts: Pt[], boxes: Rect[], pad: number) =>
  pts.some((p) => boxes.some((r) => p.x > r.l - pad && p.x < r.r + pad && p.y > r.t - pad && p.y < r.b + pad));

/** A sampled polyline with cumulative length. */
class Track {
  x: number[] = [];
  y: number[] = [];
  s: number[] = [];
  push(p: Pt) {
    const n = this.x.length;
    if (n) {
      const d = Math.hypot(p.x - this.x[n - 1], p.y - this.y[n - 1]);
      if (d < 0.01) return;
      this.s.push(this.s[n - 1] + d);
    } else this.s.push(0);
    this.x.push(p.x);
    this.y.push(p.y);
  }
  get total() {
    return this.s[this.s.length - 1] ?? 0;
  }
  /** Position and direction at length `len`. */
  at(len: number) {
    const { s, x, y } = this;
    let lo = 0;
    let hi = s.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (s[mid] < len) lo = mid;
      else hi = mid;
    }
    const span = s[hi] - s[lo] || 1;
    const f = Math.min(1, Math.max(0, (len - s[lo]) / span));
    const a = Math.max(0, lo - 3);
    const b = Math.min(s.length - 1, hi + 3);
    return { x: x[lo] + (x[hi] - x[lo]) * f, y: y[lo] + (y[hi] - y[lo]) * f, dir: Math.atan2(y[b] - y[a], x[b] - x[a]) };
  }
}

type Geo = {
  W: number;
  H: number;
  trail: Track;
  d: string;
  /** Time (0..1 of T_PATH) at each sample of the trail. */
  time: number[];
  markLen: number[];
  exit: Track;
  start: Pt;
  final: { x: number; y: number; heading: number; scale: number };
  unit: number;
  boxes: Rect[];
  lod: number;
};

function measure(root: HTMLElement): Geo | null {
  const rr = root.getBoundingClientRect();
  const W = root.clientWidth;
  const H = root.clientHeight;
  const rel = (el: Element): Rect => {
    const b = el.getBoundingClientRect();
    return { l: b.left - rr.left, t: b.top - rr.top, r: b.right - rr.left, b: b.bottom - rr.top };
  };
  const lis = [...root.querySelectorAll<HTMLElement>("[data-why-item]")];
  if (lis.length < 2) return null;
  const marks: Pt[] = [];
  const boxes: Rect[] = [];
  for (const li of lis) {
    const m = li.querySelector("[data-why-mark]");
    const texts = [...li.querySelectorAll("[data-why-text]")].map(rel);
    if (!m || !texts.length) return null;
    const mr = rel(m);
    marks.push({ x: (mr.l + mr.r) / 2, y: (mr.t + mr.b) / 2 });
    boxes.push({
      l: Math.min(...texts.map((r) => r.l)),
      t: Math.min(...texts.map((r) => r.t)),
      r: Math.max(...texts.map((r) => r.r)),
      b: Math.max(...texts.map((r) => r.b)),
    });
  }
  // The heading's words, not its full-width block: the space beside them is open sky.
  const words = [...root.querySelectorAll("[data-why-word]")].map(rel);
  const obstacles = [...boxes, ...words];

  // ---- The trail: down beside the text, an S across the gap, down into the next ring. ----
  const trail = new Track();
  const parts: string[] = [`M${marks[0].x.toFixed(1)} ${marks[0].y.toFixed(1)}`];
  const markLen: number[] = [0];
  trail.push(marks[0]);
  for (let i = 0; i < marks.length - 1; i++) {
    const M = marks[i];
    const N = marks[i + 1];
    const top = boxes[i].b;
    const bottom = Math.max(top + 2, boxes[i + 1].t);
    const p = Math.min(26, Math.max(3, (bottom - top) * 0.22));
    const P1 = { x: M.x, y: Math.max(M.y, top + p) };
    const P2 = { x: N.x, y: Math.max(P1.y + 1, Math.min(N.y, bottom - p)) };
    const h = Math.max(8, P2.y - P1.y);
    let C1 = P1;
    let C2 = P2;
    let pts: Pt[] = [];
    for (const k of [2.4, 2, 1.6, 1.25, 1]) {
      C1 = { x: P1.x, y: P1.y + h * k };
      C2 = { x: P2.x, y: P2.y - h * k };
      pts = [];
      for (let q = 0; q <= 64; q++) pts.push(cubic(P1, C1, C2, P2, q / 64));
      if (!hits(pts, obstacles, 5)) break;
    }
    if (P1.y > M.y + 0.5) {
      parts.push(`L${P1.x.toFixed(1)} ${P1.y.toFixed(1)}`);
      for (let q = 1; q <= 8; q++) trail.push({ x: M.x, y: M.y + ((P1.y - M.y) * q) / 8 });
    }
    parts.push(
      `C${C1.x.toFixed(1)} ${C1.y.toFixed(1)} ${C2.x.toFixed(1)} ${C2.y.toFixed(1)} ${P2.x.toFixed(1)} ${P2.y.toFixed(1)}`,
    );
    pts.forEach((pt) => trail.push(pt));
    parts.push(`L${N.x.toFixed(1)} ${N.y.toFixed(1)}`);
    for (let q = 1; q <= 8; q++) trail.push({ x: N.x, y: P2.y + ((N.y - P2.y) * q) / 8 });
    markLen.push(trail.total);
  }

  // ---- Speed: slower at each ring and in tight turns, quicker across the gaps. ----
  const time: number[] = [0];
  const n = trail.x.length;
  for (let i = 1; i < n; i++) {
    const s = trail.s[i];
    const near = Math.min(...markLen.map((m) => Math.abs(s - m)));
    const a = Math.max(0, i - 4);
    const b = Math.min(n - 1, i + 4);
    const a1 = Math.atan2(trail.y[i] - trail.y[a], trail.x[i] - trail.x[a]);
    const a2 = Math.atan2(trail.y[b] - trail.y[i], trail.x[b] - trail.x[i]);
    let turn = Math.abs(a2 - a1);
    if (turn > Math.PI) turn = 2 * Math.PI - turn;
    const ds = s - trail.s[i - 1];
    const ss = Math.min(trail.total - s, s);
    const v = (0.42 + 0.58 * smooth(0, 110, near)) * (1 - 0.35 * Math.min(1, turn * 2.2)) * (0.45 + 0.55 * smooth(0, 120, ss));
    time.push(time[i - 1] + ds / Math.max(0.12, v));
  }
  const tt = time[n - 1] || 1;
  for (let i = 0; i < n; i++) time[i] /= tt;

  // ---- Crane size, and where it rests: the open space farthest from the words and the trail. ----
  const phone = W < 640;
  const unit = Math.min(120, Math.max(30, W * (phone ? 0.092 : 0.07)));
  const lod = unit < 42 ? 0.55 : unit < 68 ? 0.8 : 1;
  const headT = words.length ? Math.min(...words.map((r) => r.t)) : 0;
  let best = { x: W * 0.7, y: H * 0.5, score: -1 };
  for (let y = headT; y < H - 20; y += 16) {
    for (let x = W * 0.08; x < W * 0.92; x += 16) {
      let c = Math.min(...obstacles.map((r) => rectDist(x, y, r)), ...marks.map((m) => Math.hypot(x - m.x, y - m.y) - 22));
      c = Math.min(c, x - unit * 1.35, W - unit * 1.35 - x, H - unit * 0.9 - y, y - unit * 0.6);
      let dp = Infinity;
      for (let i = 0; i < n; i += 3) dp = Math.min(dp, Math.hypot(x - trail.x[i], y - trail.y[i]));
      c = Math.min(c, dp + unit * 0.5);
      const score = c + (x / W) * 36 - Math.abs(y / H - 0.45) * 30;
      if (score > best.score) best = { x, y, score };
    }
  }
  const end = marks[marks.length - 1];
  const dx = best.x - end.x;
  // A diagonal glide, climbing away from the last ring.
  const heading = dx >= 0 ? -0.62 : Math.PI + 0.62;
  const finalScale = unit * Math.min(1.3, Math.max(0.6, best.score / (unit * 1.25)));

  // ---- Exit: from the last ring, swing round and climb to the resting place. ----
  const exit = new Track();
  const F = { x: best.x, y: best.y };
  const dist = Math.hypot(F.x - end.x, F.y - end.y);
  let ePts: Pt[] = [];
  for (const [d1, sx] of [
    [Math.min(90, Math.max(30, H - end.y - 20)), 0],
    [60, -0.6],
    [40, 0.6],
    [24, 0],
  ]) {
    const C1 = { x: end.x + d1 * sx, y: end.y + d1 };
    const C2 = { x: F.x - Math.cos(heading) * dist * 0.45, y: F.y - Math.sin(heading) * dist * 0.45 };
    ePts = [];
    for (let q = 0; q <= 64; q++) ePts.push(cubic(end, C1, C2, F, q / 64));
    if (!hits(ePts.slice(6), obstacles, 2)) break;
  }
  ePts.forEach((p) => exit.push(p));

  return {
    W,
    H,
    trail,
    d: parts.join(""),
    time,
    markLen,
    exit,
    start: { x: marks[0].x - unit * 0.6, y: marks[0].y - unit * 0.9 },
    final: { x: F.x, y: F.y, heading, scale: finalScale },
    unit,
    boxes: obstacles,
    lod,
  };
}

/** One span per letter (spaces kept as text), numbered from `from` for the stagger. */
function letters(text: string, from: number) {
  let n = from;
  return [...text].map((ch, i) =>
    ch === " " ? (
      " "
    ) : (
      <span key={i} className={styles.ch} style={{ "--c": n++ } as CSSProperties}>
        {ch}
      </span>
    ),
  );
}

export function WhyTravel({
  id,
  heading,
  items,
}: {
  id?: string;
  heading: string;
  items: { title: string; description: string }[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const maskRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const maskId = `${id ?? "why"}-trail`;
  const cut = heading.lastIndexOf(" ");
  const lead = cut > 0 ? heading.slice(0, cut) : heading;
  const name = cut > 0 ? heading.slice(cut + 1) : "";

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const trailPath = trailRef.current;
    const maskPath = maskRef.current;
    const svg = svgRef.current;
    if (!root || !canvas || !trailPath || !maskPath || !svg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lis = [...root.querySelectorAll<HTMLElement>("[data-why-item]")];
    if (!reduce) root.setAttribute("data-armed", "");

    let model: CraneModel | null = null;
    let geo: Geo | null = null;
    let dpr = 1;
    let t = 0;
    let started = false;
    let finished = reduce;
    let visible = false;
    let raf = 0;
    let last = 0;
    const wb = new Wingbeat();
    const st = { heading: 0, bank: 0, scale: 0, init: false };

    const setTrail = (f: number) => maskPath.style.setProperty("stroke-dashoffset", String(1 - f));
    const hit = (i: number) => lis[i] && !lis[i].hasAttribute("data-hit") && lis[i].setAttribute("data-hit", "");

    const layout = () => {
      geo = measure(root);
      if (!geo) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(geo.W * dpr);
      canvas.height = Math.round(geo.H * dpr);
      svg.setAttribute("viewBox", `0 0 ${geo.W} ${geo.H}`);
      trailPath.setAttribute("d", geo.d);
      maskPath.setAttribute("d", geo.d);
      if (finished) paintFinal();
    };

    const clear = () => {
      // The whole canvas: assembling dots and trailing legs reach past the bird's box.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const paintFinal = () => {
      if (!geo || !model) return;
      clear();
      setTrail(1);
      lis.forEach((_, i) => hit(i));
      const f = geo.final;
      drawCrane(ctx, model, { x: f.x, y: f.y, heading: f.heading, bank: 0, scale: f.scale, alpha: 1, assemble: 1, flap: GLIDE }, dpr, geo.lod);
    };

    const clearance = (g: Geo, x: number, y: number) => Math.min(...g.boxes.map((r) => rectDist(x, y, r)));

    const frame = (now: number) => {
      raf = 0;
      if (!geo || !model || finished) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      t += dt;
      const g = geo;
      let x: number;
      let y: number;
      let dir: number;
      let assemble = 1;
      let flapTarget = 1;
      let scaleTarget = g.unit;
      let trailF = 0;
      if (t < T_APPEAR) {
        // The crane forms out of drifting dots above the first ring and flies down into it.
        const k = t / T_APPEAR;
        const p0 = g.trail.at(0);
        const e = 1 - Math.pow(1 - k, 2);
        x = g.start.x + (p0.x - g.start.x) * e;
        y = g.start.y + (p0.y - g.start.y) * e;
        dir = Math.atan2(p0.y - g.start.y, p0.x - g.start.x) * (1 - e) + p0.dir * e;
        assemble = Math.min(1.1, k * 1.35);
        if (k > 0.7) hit(0);
      } else if (t < T_APPEAR + T_PATH) {
        hit(0);
        const k = (t - T_APPEAR) / T_PATH;
        let lo = 0;
        let hi = g.time.length - 1;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          if (g.time[mid] < k) lo = mid;
          else hi = mid;
        }
        const f = (k - g.time[lo]) / (g.time[hi] - g.time[lo] || 1);
        const s = g.trail.s[lo] + (g.trail.s[hi] - g.trail.s[lo]) * f;
        const p = g.trail.at(s);
        x = p.x;
        y = p.y;
        dir = p.dir;
        trailF = s / g.trail.total;
        g.markLen.forEach((m, i) => s >= m - 2 && hit(i));
        const near = Math.min(...g.markLen.map((m) => Math.abs(s - m)));
        // wing-beats out of each ring, a glide across the open stretches
        flapTarget = near < 140 ? 1 : 0.35;
        scaleTarget = g.unit * Math.min(1, Math.max(0.74, clearance(g, x, y) / (g.unit * 1.1)));
      } else if (t < T_APPEAR + T_PATH + T_EXIT) {
        g.markLen.forEach((_, i) => hit(i));
        trailF = 1;
        const k = (t - T_APPEAR - T_PATH) / T_EXIT;
        const e = 1 - Math.pow(1 - k, 2.2);
        const p = g.exit.at(e * g.exit.total);
        x = p.x;
        y = p.y;
        dir = k > 0.97 ? g.final.heading : p.dir;
        flapTarget = k < 0.45 ? 1 : 0;
        scaleTarget = g.final.scale * smooth(0, 0.8, k) + g.unit * 0.8 * (1 - smooth(0, 0.8, k));
      } else {
        finished = true;
        paintFinal();
        return;
      }
      setTrail(Math.max(0, trailF - 0.004));

      // Heading eases toward the direction of flight; the bird rolls into the turn.
      if (!st.init) {
        st.heading = dir;
        st.scale = scaleTarget;
        st.init = true;
      }
      let dh = dir - st.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      const turnRate = dh * Math.min(1, dt * 9);
      st.heading += turnRate;
      st.bank += (Math.max(-0.55, Math.min(0.55, (turnRate / Math.max(dt, 0.001)) * 0.09)) - st.bank) * Math.min(1, dt * 5);
      st.scale += (scaleTarget - st.scale) * Math.min(1, dt * 4);
      wb.step(dt, flapTarget, 1);

      clear();
      drawCrane(
        ctx,
        model,
        { x, y, heading: st.heading, bank: st.bank, scale: st.scale, alpha: Math.min(1, t * 3), assemble, flap: wb.flap },
        dpr,
        g.lod,
      );
      if (visible) raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf && started && visible && !finished) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const ensureModel = () => {
      if (!model) model = createCrane();
    };

    const startIo = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        startIo.disconnect();
        ensureModel();
        layout();
        root.setAttribute("data-on", "");
        if (finished) paintFinal();
        kick();
      },
      { rootMargin: "0px 0px -28% 0px" },
    );
    const visIo = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    startIo.observe(root);
    visIo.observe(root);

    let pending = 0;
    const ro = new ResizeObserver(() => {
      if (pending) cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        pending = 0;
        if (started || reduce) layout();
      });
    });
    ro.observe(root);
    // Lines move once the brand font arrives.
    document.fonts?.ready.then(() => started && layout());

    return () => {
      startIo.disconnect();
      visIo.disconnect();
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (pending) cancelAnimationFrame(pending);
      root.removeAttribute("data-armed");
      root.removeAttribute("data-on");
      lis.forEach((li) => li.removeAttribute("data-hit"));
    };
  }, [items.length]);

  return (
    <section ref={rootRef} id={id} aria-labelledby={id ? `${id}-title` : undefined} className={styles.section}>
      <svg ref={svgRef} className={styles.trail} aria-hidden focusable="false">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <path ref={maskRef} className={styles.trailMask} pathLength={1} />
          </mask>
        </defs>
        <path ref={trailRef} className={styles.trailDots} mask={`url(#${maskId})`} />
      </svg>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />

      <div className={styles.inner}>
        {/* Letter by letter (2026-11-25): each letter rises out of its word's mask, then a light
            runs along the gold name. Read as one heading (aria-label); the letters are hidden. */}
        <h2 id={id ? `${id}-title` : undefined} data-why-title="" aria-label={heading} className={styles.title}>
          <span data-why-word="" className={styles.mask} aria-hidden>
            <span className={styles.word}>{letters(lead, 0)}</span>
          </span>{" "}
          {name ? (
            <span data-why-word="" className={styles.mask} aria-hidden>
              <span className={`${styles.word} ${styles.gold}`}>{letters(name, lead.replace(/ /g, "").length)}</span>
            </span>
          ) : null}
        </h2>

        <ol className={styles.stage}>
          {items.map((item, i) => (
            <li key={i} data-why-item="" data-side={i % 2 ? "R" : "L"} className={styles.item}>
              <span data-why-mark="" className={styles.mark} aria-hidden>
                <span className={styles.ripple} />
              </span>
              <span data-why-text="" className={styles.num} aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 data-why-text="" className={styles.itemTitle}>
                <span className={styles.titleText}>{item.title}</span>
              </h3>
              <p data-why-text="" className={styles.desc}>
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
