"use client";

import { useEffect, useRef } from "react";
import { getLenis } from "../wd/SmoothScroll";

/**
 * A band of the six prefectures (their English and kanji names), set huge in
 * outline, drifting sideways in two rows that run against each other. Fast
 * scrolling pushes the rows faster and leans them; hovering a row fills it
 * with ivory. Decorative (aria-hidden): the names are in the prefecture scene.
 */
export function PlaceMarquee({ names }: { names: { name: string; kanji: string }[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = [...el.querySelectorAll<HTMLElement>("[data-row]")];
    const pos = rows.map(() => 0);
    let raf = 0;
    let visible = false;
    let lastY = window.scrollY;
    let lean = 0;
    const loop = () => {
      const v = getLenis()?.velocity ?? window.scrollY - lastY;
      lastY = window.scrollY;
      lean += (Math.max(-10, Math.min(10, v * 0.3)) - lean) * 0.1;
      rows.forEach((row, i) => {
        const dir = i % 2 ? 1 : -1;
        const half = row.scrollWidth / 2 || 1;
        pos[i] += dir * (0.7 + Math.abs(v) * 0.5);
        if (pos[i] <= -half) pos[i] += half;
        if (pos[i] > 0) pos[i] -= half;
        row.style.transform = `translate3d(${pos[i].toFixed(1)}px,0,0) skewX(${(-lean * dir).toFixed(2)}deg)`;
      });
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const line = names.flatMap((n) => [n.name, n.kanji]);
  return (
    <div ref={root} aria-hidden className="aw-marquee">
      {[0, 1].map((r) => {
        const words = r ? [...line].reverse() : line;
        return (
          <div key={r} className="aw-marquee__track">
            <div data-row className="aw-marquee__row">
              {[...words, ...words].map((w, i) => (
                <span key={i} className={`aw-marquee__word ${/[　-鿿]/.test(w) ? "aw-marquee__word--jp" : ""}`}>
                  {w}
                  <span className="aw-marquee__dot" />
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
