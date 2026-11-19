"use client";

import { useEffect } from "react";

/**
 * Scroll parallax for the Cinematic Hero: sets `--hero-shift` (px) and
 * `--hero-copy-opacity` on the Hero section while it is on screen. The photo
 * moves down at ~30% of the scroll (so it lags behind), the text slightly the
 * other way and fades a little. Passive listener + one rAF per frame: never
 * blocks scrolling. Off for reduced motion and on narrow / touch screens.
 */
export function CinematicHeroParallax({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reduced.matches || !wide.matches) {
        el.style.removeProperty("--hero-shift");
        el.style.removeProperty("--hero-copy-opacity");
        return;
      }
      const height = el.offsetHeight || 1;
      const y = Math.min(Math.max(window.scrollY, 0), height);
      el.style.setProperty("--hero-shift", `${(y * 0.3).toFixed(1)}px`);
      el.style.setProperty("--hero-copy-opacity", (1 - (y / height) * 0.6).toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    reduced.addEventListener("change", onScroll);
    wide.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      reduced.removeEventListener("change", onScroll);
      wide.removeEventListener("change", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [targetId]);
  return null;
}
