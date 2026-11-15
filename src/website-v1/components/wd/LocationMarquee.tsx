"use client";

import { useEffect, useRef } from "react";
import { getLenis } from "./SmoothScroll";

/**
 * A band of giant place names (the Hero's location labels) drifting sideways
 * in two rows, the second against the first. Scrolling pushes them: the
 * faster the scroll, the faster they run and the more they lean, then they
 * ease back to a slow drift. Outlined letters; the row under the pointer fills
 * with gold. Decorative (aria-hidden): the same names are on the Hero.
 * Runs only while on screen; still with reduced motion.
 */
export function LocationMarquee({ words }: { words: string[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = [...el.querySelectorAll<HTMLElement>("[data-row]")];
    const pos = rows.map(() => 0);
    let raf = 0;
    let visible = false;
    let lastY = window.scrollY;
    let skew = 0;

    const loop = () => {
      const lenisV = getLenis()?.velocity;
      const v = lenisV ?? window.scrollY - lastY;
      lastY = window.scrollY;
      skew += (Math.max(-12, Math.min(12, v * 0.35)) - skew) * 0.12;
      rows.forEach((row, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        const half = row.scrollWidth / 2 || 1;
        pos[i] += dir * (0.6 + Math.abs(v) * 0.45);
        if (pos[i] <= -half) pos[i] += half;
        if (pos[i] > 0) pos[i] -= half;
        row.style.transform = `translate3d(${pos[i].toFixed(1)}px,0,0) skewX(${(-skew * dir).toFixed(2)}deg)`;
      });
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const line = [...words, ...words];
  return (
    <div ref={root} aria-hidden className="wd-marquee">
      {[0, 1].map((r) => (
        <div key={r} className="wd-marquee__track">
          <div data-row className="wd-marquee__row">
            {(r === 0 ? line : [...line].reverse()).map((w, i) => (
              <span key={i} className="wd-marquee__word">
                {w}
                <span className="wd-marquee__dot">✦</span>
              </span>
            ))}
            {(r === 0 ? line : [...line].reverse()).map((w, i) => (
              <span key={`b${i}`} className="wd-marquee__word">
                {w}
                <span className="wd-marquee__dot">✦</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
