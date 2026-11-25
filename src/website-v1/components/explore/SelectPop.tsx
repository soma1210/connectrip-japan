"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import p from "./SelectPop.module.css";

/**
 * Decoration of the Explore Kansai slides (Select and Travel Updates). Since 2026-11-23 it
 * follows the Featured Tour slide (Osaka Tenmangu, components/wd/FeaturedPop): black ground,
 * light cream type with the lead words in gold (the "N°02 ── EXPLORE KANSAI" index line was removed 2026-11-24),
 * gold hairlines and a single vermilion seal (Human instruction 2026-11-23: elegant, not pop).
 * The motion is unchanged:
 *   - SelectHead: the heading lines rise out of masks; a gold hairline draws itself under the
 *     last word (where the vermilion loop used to draw).
 *   - SelectTape: the band of place names runs on its own, speeds up with the scroll and turns
 *     round when the scroll does (now a ruled hairline band instead of a coloured tape).
 *   - SelectRibbon: a fine gold line drawn across the background as the slide comes in.
 * Reduced motion: everything is shown in its final state, the band stands still.
 */

function useInView<T extends HTMLElement>(margin = "0px 0px -18% 0px") {
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
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
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

/** One span per letter (spaces kept as text), numbered from `from` for the stagger (2026-11-25). */
function letters(text: string, from: number) {
  let n = from;
  return [...text].map((ch, i) =>
    ch === " " ? (
      " "
    ) : (
      <span key={i} className={p.ch} style={{ "--c": n++ } as CSSProperties}>
        {ch}
      </span>
    ),
  );
}

export function SelectHead({
  title,
  description,
  titleId,
  tone = "paper",
  seal,
}: {
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
  tone?: Tone;
  /** No longer shown (the index line was removed 2026-11-24); kept so callers need no change. */
  index?: string;
  /** Kanji for a small vermilion hanko seal beside the heading (as 大阪 on the Featured Tour). */
  seal?: string;
}) {
  const ref = useInView<HTMLDivElement>();
  // "Connectrip Japan Select" → "Connectrip Japan" (gold) / "Select" (cream, ruled underneath).
  const words = title.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop()! : "";
  const first = words.join(" ");

  return (
    <div ref={ref} className={p.head} data-tone={tone}>
      <div className={p.copy}>
        {/* The "N°0X ── EYEBROW" index line was removed (Human instruction 2026-11-24). */}
        <h2 id={titleId} className={p.title} aria-label={title}>
          <span className={p.line} aria-hidden>
            <span style={{ "--l": 0 } as CSSProperties} className={p.thin}>
              {letters(first, 0)}
            </span>
          </span>
          {last ? (
            <span className={p.line} aria-hidden>
              <span
                style={{ "--l": 1 } as CSSProperties}
                className={p.loopWord}
              >
                {letters(last, first.replace(/ /g, "").length)}
                <svg
                  className={p.loop}
                  viewBox="0 0 400 10"
                  preserveAspectRatio="none"
                >
                  <path pathLength={1} d="M2 5H398" />
                </svg>
              </span>
              {seal ? (
                <span className={p.seal} aria-hidden>
                  <span className={p.sealInk}>{seal}</span>
                </span>
              ) : null}
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
  size = "base",
}: {
  words: string[];
  tone?: Tone;
  /** "feature": the large edge-to-edge band at the foot of the Updates slide (2026-11-25). */
  size?: "base" | "feature";
}) {
  // The feature band sits at the very foot of its slide (held in place on phones): it comes in as soon as it shows.
  const ref = useInView<HTMLDivElement>(size === "feature" ? "0px" : undefined);
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
    <div ref={ref} className={p.tapeWrap} data-tone={tone} data-size={size} aria-hidden>
      <div className={p.tape}>
        <div ref={track} className={p.tapeTrack}>
          {[0, 1].map((k) => (
            <span key={k} className={p.tapeRun}>
              {[...run, ...run].map((w, i) => (
                w === "✺" ? (
                  <span key={i} className={p.tapeStar} />
                ) : (
                  <span key={i} className={p.tapeWord} data-alt={i % 4 === 2 ? "" : undefined}>
                    {w}
                  </span>
                )
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
