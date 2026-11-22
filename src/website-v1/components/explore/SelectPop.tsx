"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import p from "./SelectPop.module.css";

/**
 * Decoration for the cream "Connectrip Japan Select" slide (Human instruction 2026-11-22:
 * make it pop, after award-winning editorial sites). The article strips themselves are
 * untouched; these pieces sit around them:
 *   - SelectHead: a pill eyebrow with a live dot, a heavy uppercase headline whose lines rise
 *     out of masks, a vermilion hand-drawn loop that draws itself around "Select", 
 *     (the round badge and stickers were removed on 2026-11-22).
 *   - SelectTape: a tilted vermilion tape of Kansai place names under the strips. It runs on
 *     its own, speeds up with the scroll velocity and turns round when the scroll does.
 *   - A loose white ribbon drawn across the background as the slide comes in.
 * Reduced motion: everything is shown in its final state, the tape and badge stand still.
 */

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      el.getBoundingClientRect().top < innerHeight * 0.85
    ) {
      el.setAttribute("data-on", "");
      return;
    }
    el.setAttribute("data-armed", "");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        el.setAttribute("data-on", "");
        io.disconnect();
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

type Tone = "paper" | "dark";

export function SelectRibbon({ tone = "paper" }: { tone?: Tone }) {
  const ref = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={p.ribbonWrap} data-tone={tone} aria-hidden>
      <svg
        className={p.ribbon}
        viewBox="0 0 1440 1000"
        preserveAspectRatio="none"
      >
        <path
          pathLength={1}
          d="M-40 180C220 120 420 260 560 150S880 -20 1010 90s40 300 210 330 260 -80 300 -40"
        />
        {/* A hairline twin, as a ruled line beside the ribbon (classic touch, 2026-11-22). */}
        <path
          pathLength={1}
          className={p.ribbonRule}
          d="M-40 206C220 146 420 286 560 176S880 6 1010 116s40 300 210 330 260 -80 300 -40"
        />
      </svg>
      <div className={p.grain} />
    </div>
  );
}

export function SelectHead({
  eyebrow,
  title,
  description,
  titleId,
  tone = "paper",
}: {
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
  tone?: Tone;
}) {
  const ref = useInView<HTMLDivElement>();
  // "Connectrip Japan Select" → "Connectrip Japan" / "Select" (the last word gets the loop).
  const words = title.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop()! : "";
  const first = words.join(" ");

  return (
    <div ref={ref} className={p.head} data-tone={tone}>
      <div className={p.copy}>
        <p className={p.pill}>
          <span className={p.dot} aria-hidden />
          {eyebrow}
        </p>
        <h2 id={titleId} className={p.title} aria-label={title}>
          <span className={p.line} aria-hidden>
            <span style={{ "--l": 0 } as CSSProperties} className={p.thin}>
              {first}
            </span>
          </span>
          {last ? (
            <span className={p.line} aria-hidden>
              <span
                style={{ "--l": 1 } as CSSProperties}
                className={p.loopWord}
              >
                {last}
                <svg
                  className={p.loop}
                  viewBox="0 0 400 140"
                  preserveAspectRatio="none"
                >
                  <path
                    pathLength={1}
                    d="M352 28C300 8 150 4 66 30 12 47 8 92 52 112c62 28 214 26 290 4 52-15 62-58 22-80-30-17-90-22-150-20"
                  />
                </svg>
              </span>
              <span className={p.sparkle} aria-hidden>
                ✺
              </span>
            </span>
          ) : null}
        </h2>
      </div>
      <p className={p.desc}>{description}</p>

      {/* The round badge and its stickers were removed (Human instruction 2026-11-22). */}
    </div>
  );
}

export function SelectTape({
  words,
  tone = "paper",
}: {
  words: string[];
  tone?: Tone;
}) {
  const ref = useInView<HTMLDivElement>();
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let x = 0;
    let dir = -1;
    let boost = 0;
    let lastY = scrollY;
    let last = 0;
    let raf = 0;
    let visible = false;
    const half = () => el.scrollWidth / 2;

    const frame = (t: number) => {
      const dt = last ? Math.min(t - last, 50) : 16;
      last = t;
      const y = scrollY;
      const dy = y - lastY;
      lastY = y;
      if (dy !== 0) dir = dy > 0 ? -1 : 1;
      boost += (Math.min(Math.abs(dy), 80) * 0.6 - boost) * 0.12;
      x += dir * (0.06 + boost * 0.02) * dt;
      const w = half();
      if (w > 0) {
        if (x <= -w) x += w;
        if (x > 0) x -= w;
      }
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${(-dir * Math.min(boost, 30) * 0.25).toFixed(2)}deg)`;
      raf = visible ? requestAnimationFrame(frame) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible && !raf) {
        last = 0;
        lastY = scrollY;
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(el.parentElement ?? el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, []);

  const run = words.flatMap((w) => [w, "✺"]);
  return (
    <div ref={ref} className={p.tapeWrap} data-tone={tone} aria-hidden>
      <div className={p.tape}>
        <div ref={track} className={p.tapeTrack}>
          {[0, 1].map((k) => (
            <span key={k} className={p.tapeRun}>
              {[...run, ...run].map((w, i) => (
                <span key={i} className={w === "✺" ? p.tapeStar : p.tapeWord}>
                  {w}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
