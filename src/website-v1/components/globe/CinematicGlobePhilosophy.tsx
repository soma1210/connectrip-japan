"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { approachOf, discScale } from "./globeCamera";
import type { GlobeRenderer, GlobeTextures, QuietZone } from "./globeRenderer";
import styles from "./CinematicGlobePhilosophy.module.css";

/**
 * Cinematic Globe Philosophy section (V1.4; started from prototype v1.2). The words and
 * the link are server-rendered HTML; the globe is decoration.
 *
 * Four cuts over the scroll track (progress 0..1, reversible, a pure function of the scroll):
 *   01 Arrival                0.00–0.20  the Earth appears, small and far; the camera starts in; Osaka lights up
 *   02 First Connections      0.20–0.43  a light leaves Osaka for each city of nearby Asia, one after another
 *   03 Global Expansion       0.43–0.76  Asia Pacific, then the world: fifteen lines; the view turns; the words begin
 *   04 Our Philosophy         0.76–1.00  the network settles, the words lead, the link appears; a last slow push in
 *
 * The camera is one lens on a dolly (globeCamera.ts): the globe box is sized
 * by what that lens sees at the current distance, and the renderer draws the
 * Earth from the same distance. Lines that pass behind the words are dimmed
 * (the words' box is measured on resize, not per frame).
 *
 * Modes (data-motion on the section):
 * - none (server HTML / no JS): finished picture, static image, normal flow;
 * - "still": reduced motion, short landscape screens, or the section was
 *   already on screen when the page loaded (no jump while someone reads it):
 *   finished picture, the live globe drawn once without drift;
 * - "on": sticky stage, scroll choreography, drift and Pause Motion.
 *
 * The WebGL renderer is a separate chunk, loaded about one screen before the
 * section. Without WebGL (or on any GL / texture error, or when frames stay
 * slower than ~25 fps after lowering the resolution) the static image stays.
 * The loop runs only while the section is on screen and the tab is visible,
 * and stops when nothing moves.
 */

type Props = {
  eyebrow: string;
  lines: readonly [string, string];
  storyLabel: string;
  storyHref: string;
  fallback: { src: string; width: number; height: number };
  textures: { desktop: GlobeTextures; mobile: GlobeTextures };
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

export function CinematicGlobePhilosophy({ eyebrow, lines, storyLabel, storyHref, fallback, textures }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arcRef = useRef<HTMLCanvasElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    kickRef.current();
  }, [paused]);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const arcCanvas = arcRef.current;
    const eyebrowEl = eyebrowRef.current;
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const cta = ctaRef.current;
    if (!section || !track || !box || !canvas || !arcCanvas || !eyebrowEl || !line1 || !line2 || !cta) return;

    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shortMq = window.matchMedia("(max-height: 520px) and (orientation: landscape)");
    const mobileMq = window.matchMedia("(max-width: 768px)");

    // Already on screen at load (e.g. a reload near the footer): keep the finished picture for this visit.
    const r0 = section.getBoundingClientRect();
    const onScreenAtLoad = r0.top < window.innerHeight && r0.bottom > 0;

    let animate = false;
    let renderer: GlobeRenderer | null = null;
    let loading = false;
    let failed = false;
    let disposed = false;
    let shown = false;
    let visible = false;
    let pageVisible = !document.hidden;
    let raf = 0;
    let target = 1;
    let smooth = 1;
    let lastRendered = -1;
    let time = 0;
    let last = performance.now();
    let dirty = true;
    // Frame-time watchdog: after a warm-up, ~2 s windows; > 40 ms average → lower resolution, then static image.
    // Where the words sit relative to the globe box (px, measured without the scroll transform); refreshed on resize.
    let layoutDirty = true;
    let boxScale = 1;
    let boxRise = 0;
    const layout = { size: 0, x0: 0, y0: 0, x1: 0, y1: 0 };
    const quiet: QuietZone = { x0: 0, y0: 0, x1: 0, y1: 0, k: 0 };
    let warmup = 60;
    let windowSum = 0;
    let windowFrames = 0;
    let lowered = false;

    const progress = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      return clamp(-rect.top / scrollable, 0, 1);
    };

    const setStyle = (el: HTMLElement, t: number, dy: number) => {
      el.style.opacity = t.toFixed(3);
      el.style.transform = `translate3d(0, ${lerp(dy, 0, t).toFixed(1)}px, 0)`;
    };

    // The words' box (eyebrow → link) around the centre of the arcs canvas. Rects are read a few times per resize, never per frame.
    const measure = () => {
      layoutDirty = false;
      const a = arcCanvas.getBoundingClientRect();
      if (a.width < 1) return;
      const cx = a.left + a.width / 2;
      const cy = a.top + a.height / 2 - boxRise;
      const top = eyebrowEl.getBoundingClientRect();
      const mid = [line1.getBoundingClientRect(), line2.getBoundingClientRect()];
      const bottom = cta.getBoundingClientRect();
      const pad = 14;
      layout.size = a.width / boxScale;
      layout.x0 = Math.min(mid[0].left, mid[1].left) - pad - cx;
      layout.x1 = Math.max(mid[0].right, mid[1].right) + pad - cx;
      layout.y0 = top.top - pad - cy;
      layout.y1 = bottom.bottom + pad - cy;
    };
    const quietZone = (p: number) => {
      if (layout.size < 1) return undefined;
      const s = layout.size * boxScale;
      quiet.x0 = 0.5 + layout.x0 / s;
      quiet.x1 = 0.5 + layout.x1 / s;
      quiet.y0 = 0.5 + (layout.y0 - boxRise) / s;
      quiet.y1 = 0.5 + (layout.y1 - boxRise) / s;
      quiet.k = animate ? smoothstep(0.64, 0.84, p) : 1;
      return quiet;
    };

    const clearChoreography = () => {
      boxScale = 1;
      boxRise = 0;
      for (const el of [box, eyebrowEl, line1, line2, cta]) {
        el.style.opacity = "";
        el.style.transform = "";
        el.style.pointerEvents = "";
      }
      section.dataset.cut = "4";
    };

    // V1.4 timings. The Earth starts small and centred, then comes close and settles low in the stage.
    const applyChoreography = (p: number) => {
      section.dataset.cut = p >= 0.76 ? "4" : p >= 0.43 ? "3" : p >= 0.2 ? "2" : "1";
      const emergence = smoothstep(0, 0.12, p);
      // Same camera as the renderer: the box is as large as the lens shows the Earth at this distance.
      boxRise = lerp(-0.17 * window.innerHeight, 0, approachOf(p));
      boxScale = discScale(p);
      box.style.transform = `translate3d(0, ${boxRise.toFixed(1)}px, 0) scale(${boxScale.toFixed(4)})`;
      box.style.opacity = lerp(0.1, 1, emergence).toFixed(3);
      // The words arrive once the network has spread.
      setStyle(eyebrowEl, smoothstep(0.64, 0.72, p), 12);
      setStyle(line1, smoothstep(0.68, 0.78, p), 18);
      setStyle(line2, smoothstep(0.74, 0.84, p), 18);
      const ctaT = smoothstep(0.84, 0.92, p);
      setStyle(cta, ctaT, 12);
      // Not clickable while (nearly) invisible; keyboard focus still reveals it (CSS :focus-within).
      cta.style.pointerEvents = ctaT < 0.5 ? "none" : "";
    };

    const fail = (reason: string) => {
      failed = true;
      renderer?.destroy();
      renderer = null;
      section.dataset.renderer = "fallback";
      section.dataset.rendererReason = reason;
    };

    const watchdog = (dt: number) => {
      if (warmup > 0) {
        warmup -= 1;
        return;
      }
      windowSum += dt;
      windowFrames += 1;
      if (windowSum < 2) return;
      const avg = windowSum / windowFrames;
      windowSum = 0;
      windowFrames = 0;
      if (avg <= 0.04) return;
      if (!lowered && renderer) {
        lowered = true;
        renderer.setLowQuality();
        warmup = 30;
      } else {
        fail("slow-frames");
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (disposed || !visible || !pageVisible) return;
      const elapsed = Math.max(0, (now - last) / 1000);
      const dt = Math.min(0.05, elapsed);
      last = now;
      if (animate) {
        target = progress();
        // Time-based easing (same feel as v1.2's 0.14 per frame at 60 fps), so slow devices never lag behind the scroll.
        const k = 1 - Math.exp(-Math.min(elapsed, 0.25) / 0.11);
        smooth = Math.abs(target - smooth) < 0.0005 ? target : lerp(smooth, target, k);
        applyChoreography(smooth);
      }
      const drifting = animate && !pausedRef.current;
      if (drifting) time += dt;
      const p = animate ? smooth : 1;
      const draw = renderer && (drifting || dirty || p !== lastRendered);
      if (draw && layoutDirty) measure();
      if (draw && renderer?.render(p, time, !animate, quietZone(p))) {
        lastRendered = p;
        dirty = false;
        if (!shown) {
          shown = true;
          section.dataset.renderer = "webgl";
        }
        if (drifting) watchdog(dt);
      }
      // Keep going while the globe drifts or the scroll is still easing; otherwise wait for the next scroll / event.
      if (drifting || (animate && smooth !== target) || dirty) raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (disposed || raf || !visible || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    kickRef.current = kick;

    const load = () => {
      if (loading || failed) return;
      loading = true;
      import("./globeRenderer")
        .then(({ createGlobeRenderer }) => {
          if (disposed || failed) return;
          renderer = createGlobeRenderer({
            canvas,
            arcCanvas,
            textures: mobileMq.matches ? textures.mobile : textures.desktop,
            mobile: mobileMq.matches,
            onReady: () => {
              dirty = true;
              kick();
            },
            onFail: fail,
          });
        })
        .catch(() => fail("chunk-error"));
    };

    const setMode = () => {
      animate = !onScreenAtLoad && !reducedMq.matches && !shortMq.matches;
      section.dataset.motion = animate ? "on" : "still";
      if (animate) {
        target = progress();
        smooth = target;
        applyChoreography(smooth);
      } else {
        clearChoreography();
      }
      layoutDirty = true;
      dirty = true;
      kick();
    };
    setMode();
    // The heading is wider once the web font is in.
    document.fonts?.ready.then(() => {
      if (disposed) return;
      layoutDirty = true;
      dirty = true;
      kick();
    });
    const onResize = () => {
      layoutDirty = true;
      dirty = true;
      kick();
    };
    window.addEventListener("resize", onResize);

    const nearObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          nearObserver.disconnect();
        }
      },
      { rootMargin: "100% 0px 100% 0px" },
    );
    nearObserver.observe(section);

    const visibleObserver = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) {
        dirty = true;
        kick();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    visibleObserver.observe(track);

    const resizeObserver = new ResizeObserver(() => {
      renderer?.resize();
      layoutDirty = true;
      dirty = true;
      kick();
    });
    resizeObserver.observe(box);

    const onScroll = () => kick();
    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) kick();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reducedMq.addEventListener("change", setMode);
    shortMq.addEventListener("change", setMode);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      kickRef.current = () => {};
      nearObserver.disconnect();
      visibleObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMq.removeEventListener("change", setMode);
      shortMq.removeEventListener("change", setMode);
      renderer?.destroy();
      renderer = null;
    };
  }, [textures]);

  return (
    <section ref={sectionRef} id="our-philosophy" className={styles.section} aria-labelledby="our-philosophy-heading">
      <div ref={trackRef} className={styles.track}>
        <div className={styles.stage}>
          <div className={styles.stars} aria-hidden />
          <div className={styles.globeLayer} aria-hidden>
            <div ref={boxRef} className={styles.globeBox}>
              <Image
                className={styles.fallback}
                src={fallback.src}
                width={fallback.width}
                height={fallback.height}
                sizes="(max-width: 768px) 180vw, 1200px"
                alt=""
              />
              <canvas ref={canvasRef} className={styles.canvas} />
              <canvas ref={arcRef} className={styles.arcs} />
            </div>
          </div>
          <div className={styles.vignette} aria-hidden />
          <div className={styles.foreground}>
            <p ref={eyebrowRef} className={styles.eyebrow}>
              {eyebrow}
            </p>
            <h2 id="our-philosophy-heading" className={styles.heading}>
              <span ref={line1Ref} className={styles.line}>
                {lines[0]}
              </span>{" "}
              <span ref={line2Ref} className={styles.line}>
                {lines[1]}
              </span>
            </h2>
            <div ref={ctaRef} className={styles.ctaWrap}>
              <span className={styles.goldLine} aria-hidden />
              <Link href={storyHref} className={styles.storyLink}>
                <span>{storyLabel}</span>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
          <div className={styles.hud}>
            <button type="button" className={styles.motionButton} aria-pressed={paused} onClick={() => setPaused((v) => !v)}>
              {paused ? "Resume Motion" : "Pause Motion"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
