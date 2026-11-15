"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./gsap";

/**
 * Photo trail (Naked City Films footer, Codrops 2026-01-19): moving the mouse
 * over the section leaves a trail of the site's own Kansai photos that pop up
 * under the pointer, tilt with the direction of travel and fall away.
 * Decorative (aria-hidden); mouse devices with motion only. A pool of image
 * elements is reused; nothing is created while the pointer is still.
 */
export function ImageTrail({ targetId, images }: { targetId: string; images: string[] }) {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.getElementById(targetId);
    const el = layer.current;
    if (!root || !el || images.length === 0) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const pool = [...el.querySelectorAll<HTMLElement>("[data-trail]")];
    let next = 0;
    let z = 1;
    let last: { x: number; y: number } | null = null;
    const STEP = 90;

    const move = (e: PointerEvent) => {
      const box = root.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;
      if (!last) {
        last = { x, y };
        return;
      }
      const dx = x - last.x;
      const dy = y - last.y;
      if (Math.hypot(dx, dy) < STEP) return;
      last = { x, y };
      const img = pool[next];
      next = (next + 1) % pool.length;
      gsap.killTweensOf(img);
      gsap
        .timeline()
        .set(img, { x: x - dx * 0.4, y: y - dy * 0.4, xPercent: -50, yPercent: -50, zIndex: z++, autoAlpha: 1, scale: 0.4, rotate: gsap.utils.clamp(-18, 18, dx * 0.12) })
        .to(img, { x, y, scale: 1, duration: 0.5, ease: "expo.out" })
        .to(img, { autoAlpha: 0, scale: 0.6, y: y + 60, duration: 0.7, ease: "power3.in" }, 0.55);
    };
    const leave = () => (last = null);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(pool);
    };
  }, [targetId, images]);

  return (
    <div ref={layer} aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {Array.from({ length: Math.min(10, images.length * 2) }).map((_, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- small decorative pool, already-optimised site photos
        <img
          key={i}
          data-trail
          src={`/_next/image?url=${encodeURIComponent(images[i % images.length])}&w=384&q=75`}
          alt=""
          loading="lazy"
          className="invisible absolute top-0 left-0 aspect-[4/5] w-[13vw] max-w-[220px] min-w-[140px] rounded-md object-cover shadow-[0_24px_60px_rgba(5,11,24,0.55)]"
        />
      ))}
    </div>
  );
}
