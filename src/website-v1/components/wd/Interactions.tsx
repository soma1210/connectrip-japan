"use client";

import { useEffect, useRef } from "react";

/**
 * Site-wide pointer and scroll feedback:
 * - Scroll progress: a thin gold line across the top of the screen grows with
 *   the page (scaleX from the scroll position).
 * - Tilt: cards marked `data-wd-tilt` lean towards the pointer in 3D (CSS
 *   `rotate` / `scale`, so scroll animations on `transform` are kept) and a
 *   soft light follows the pointer across them.
 * - Magnetic CTAs: the paired buttons are pulled a little towards the pointer
 *   and spring back when it leaves (CSS `translate`, so no transform clashes).
 * Mouse devices with motion only for tilt / magnetic; the progress line shows everywhere.
 */
export function Interactions() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const line = bar.current;
    let frame = 0;
    const progress = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      line?.style.setProperty("transform", `scaleX(${max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0})`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(progress);
    };
    progress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
    let tilted: HTMLElement | null = null;
    let pulled: HTMLElement | null = null;
    const reset = (el: HTMLElement | null, kind: "tilt" | "pull") => {
      if (!el) return;
      if (kind === "tilt") {
        el.style.removeProperty("rotate");
        el.style.removeProperty("scale");
        el.removeAttribute("data-wd-tilting");
      } else el.style.removeProperty("translate");
    };
    const move = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const card = t?.closest<HTMLElement>("[data-wd-tilt]") ?? null;
      if (card !== tilted) {
        reset(tilted, "tilt");
        tilted = card;
      }
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        // CSS `rotate` (axis + angle) and `scale` sit beside any GSAP transform on the card; the parent gives the depth.
        card.parentElement?.style.setProperty("perspective", "1000px");
        card.setAttribute("data-wd-tilting", "");
        card.style.setProperty("rotate", `${(-py).toFixed(3)} ${px.toFixed(3)} 0 ${(Math.hypot(px, py) * 22).toFixed(2)}deg`);
        card.style.setProperty("scale", "1.025");
        card.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
      }
      const cta = t?.closest<HTMLElement>("a[data-cta-id]") ?? null;
      if (cta !== pulled) {
        reset(pulled, "pull");
        pulled = cta;
      }
      if (cta) {
        const r = cta.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        cta.style.setProperty("translate", `${(dx * 0.22).toFixed(1)}px ${(dy * 0.32).toFixed(1)}px`);
      }
    };
    const leave = () => {
      reset(tilted, "tilt");
      reset(pulled, "pull");
      tilted = pulled = null;
    };
    if (fine) {
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
      leave();
    };
  }, []);

  return <div ref={bar} aria-hidden className="wd-progress" />;
}
