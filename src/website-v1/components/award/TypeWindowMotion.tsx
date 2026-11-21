"use client";

import { useEffect } from "react";
import { gsap } from "../wd/gsap";

/**
 * Motion of TypeWindow (scrubbed over the pinned section):
 *   0.00–0.45 the sheet (with the cut-out heading) grows 1 → 9× from the
 *             centre and dissolves; the photo underneath eases back 1.25 → 1
 *   0.40–0.85 the copy, the choices and the CTA rise on the photo, one by one
 *   0.85–1.00 hold
 * Reduced motion: the sheet is not shown; the copy is simply there.
 */
export function TypeWindowMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const sheet = root.querySelector<HTMLElement>("[data-tw-sheet]");
    const photo = root.querySelector<HTMLElement>("[data-tw-photo]");
    const items = root.querySelectorAll<HTMLElement>("[data-tw-item]");
    const shade = root.querySelector<HTMLElement>("[data-tw-shade]");
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.8 } });
      tl.fromTo(sheet, { scale: 1 }, { scale: 9, ease: "power2.in", duration: 0.45 }, 0)
        .to(sheet, { autoAlpha: 0, duration: 0.12 }, 0.33)
        .fromTo(photo, { scale: 1.25, filter: "brightness(1.9) saturate(1.25)" }, { scale: 1, filter: "brightness(1) saturate(1)", duration: 0.55 }, 0)
        .fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0.34)
        .fromTo(items, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power3.out", stagger: 0.05, duration: 0.12 }, 0.42)
        .to({}, { duration: 0.15 });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(sheet, { display: "none" });
    });
    return () => mm.revert();
  }, [targetId]);
  return null;
}
