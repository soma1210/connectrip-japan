"use client";

import { useEffect } from "react";
import { gsap } from "../wd/gsap";
import { KATOMADO_FULL, katomadoPath } from "./katomado";

/**
 * Motion of PortalCta (scrubbed over the pinned section):
 *   0.00–0.50 the window opens to full bleed; the camera inside eases back
 *   0.10–0.50 the two heading lines glide in to meet at the centre, ink → white
 *   0.50–0.70 the photo dims a little, copy and CTAs rise
 * Reduced motion: the gate is open, everything is in place.
 */
export function PortalCtaMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const path = root.querySelector<SVGPathElement>("[data-portal-window]");
    const cam = root.querySelector<HTMLElement>("[data-portal-cam]");
    const dim = root.querySelector<HTMLElement>("[data-portal-dim]");
    const lines = root.querySelectorAll<HTMLElement>("[data-portal-line]");
    const after = root.querySelector<HTMLElement>("[data-portal-after]");
    if (!path) return;
    const start = () => {
      const phone = window.innerWidth < 768;
      return katomadoPath({ cx: 0.5, w: phone ? 0.42 : 0.2, ys: phone ? 0.4 : 0.36, y1: phone ? 0.74 : 0.8 });
    };
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true } });
      tl.fromTo(path, { attr: { d: start } }, { attr: { d: KATOMADO_FULL }, ease: "power2.inOut", duration: 0.5 }, 0)
        .fromTo(cam, { scale: 1.35 }, { scale: 1, duration: 0.6 }, 0)
        .fromTo(lines, { y: (i) => (i ? 1 : -1) * window.innerHeight * 0.27, color: "#eee8de" }, { y: 0, color: "#f5f3ee", ease: "power2.inOut", duration: 0.4 }, 0.1)
        .fromTo(dim, { opacity: 0 }, { opacity: 0.45, duration: 0.2 }, 0.45)
        .fromTo(after, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, ease: "power3.out", duration: 0.2 }, 0.5)
        .to({}, { duration: 0.3 });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      path.setAttribute("d", KATOMADO_FULL);
      gsap.set(lines, { y: 0, color: "#f5f3ee" });
      gsap.set(dim, { opacity: 0.45 });
    });
    return () => mm.revert();
  }, [targetId]);
  return null;
}
