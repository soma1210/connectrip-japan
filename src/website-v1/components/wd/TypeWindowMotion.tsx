"use client";

import { useEffect } from "react";
import { gsap } from "./gsap";

/**
 * Motion of TypeWindow (scrubbed over the pinned section):
 *   0.00–0.45 the sheet (with the cut-out heading) grows 1 → 9× from the
 *             centre and dissolves; the photo underneath eases back 1.25 → 1
 *   0.26–0.40 the paper of KansaiMap (seen through the letters) gives way to
 *             the dark map; 0.34–0.70 its rivers and rails draw, its places
 *             come in
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
    const leaf = root.querySelector<HTMLElement>("[data-km-leaf]");
    const lines = root.querySelectorAll<SVGPathElement>("[data-km-line]");
    const stops = root.querySelectorAll<SVGElement>("[data-km-stop]");
    const swash = root.querySelector<SVGPathElement>("[data-tw-swash]");
    const rules = root.querySelectorAll<HTMLElement>("[data-tw-rule]");
    const chips = root.querySelectorAll<HTMLElement>("[data-tw-chip]");
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.8 } });
      tl.fromTo(sheet, { scale: 1 }, { scale: 9, ease: "power2.in", duration: 0.45 }, 0)
        .to(sheet, { autoAlpha: 0, duration: 0.12 }, 0.33)
        .fromTo(photo, { scale: 1.25 }, { scale: 1, duration: 0.55 }, 0)
        .fromTo(leaf, { autoAlpha: 1 }, { autoAlpha: 0, ease: "power1.inOut", duration: 0.14 }, 0.26)
        .fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0.34)
        .fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "power2.inOut", stagger: 0.02, duration: 0.3, immediateRender: true }, 0.34)
        .fromTo(stops, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power3.out", stagger: 0.02, duration: 0.08, immediateRender: true }, 0.42)
        .fromTo(swash, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "power2.inOut", duration: 0.12, immediateRender: true }, 0.5)
        .fromTo(items, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power3.out", stagger: 0.05, duration: 0.12 }, 0.42)
        // Right column (2026-11-23): the gold rules draw from the left, then the choices come in one by one.
        .fromTo(rules, { scaleX: 0 }, { scaleX: 1, ease: "power2.inOut", duration: 0.1, immediateRender: true }, 0.46)
        .fromTo(chips, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: "power3.out", stagger: 0.004, duration: 0.06, immediateRender: true }, 0.48)
        .to({}, { duration: 0.15 });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set([sheet, leaf], { display: "none" });
    });
    return () => mm.revert();
  }, [targetId]);
  return null;
}
