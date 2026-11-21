"use client";

import { useEffect } from "react";
import { gsap } from "../wd/gsap";

/**
 * Shared motion of the award Home (one controller, attributes in the markup):
 *   [data-aw-chars]     characters rise out of their masks, 0.025 s apart (once)
 *   [data-aw-reveal]    the box opens upward like a curtain (clip-path), its photo settles from 1.3×
 *   [data-aw-parallax]  the photo inside drifts against the scroll (yPercent ±10, value = strength)
 *   [data-aw-group]     its [data-aw-item] children rise one after another (once)
 * Motion tokens: out = expo.out 1.2 s; in-out = power4.inOut 1.2 s; stagger 0.08.
 * Reduced motion: nothing moves.
 */
export function AwardMotion({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      root.querySelectorAll<HTMLElement>("[data-aw-chars]").forEach((h) => {
        if (h.closest("#home-hero")) return;
        gsap.fromTo(
          h.querySelectorAll("[data-aw-char]"),
          { yPercent: 115, rotate: 6 },
          { yPercent: 0, rotate: 0, duration: 1.2, ease: "expo.out", stagger: 0.025, scrollTrigger: { trigger: h, start: "top 88%", once: true } },
        );
      });
      root.querySelectorAll<HTMLElement>("[data-aw-reveal]").forEach((box) => {
        const img = box.querySelector("img");
        const tl = gsap.timeline({ scrollTrigger: { trigger: box, start: "top 85%", once: true } });
        tl.fromTo(box, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "power4.inOut" });
        if (img) tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: "expo.out" }, 0.1);
      });
      root.querySelectorAll<HTMLElement>("[data-aw-parallax]").forEach((el) => {
        const k = Number(el.dataset.awParallax || 10);
        gsap.fromTo(el, { yPercent: -k }, { yPercent: k, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } });
      });
      // Big titles: their words drift apart in opposite directions with the scroll.
      root.querySelectorAll<HTMLElement>("[data-aw-drift]").forEach((h) => {
        const words = [...h.children] as HTMLElement[];
        words.forEach((w, i) => {
          gsap.fromTo(w, { x: () => (i % 2 ? 1 : -1) * window.innerWidth * 0.06 }, { x: () => (i % 2 ? -1 : 1) * window.innerWidth * 0.05, ease: "none", scrollTrigger: { trigger: h, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true } });
        });
      });

      // Ruled tables draw in row by row, left to right.
      root.querySelectorAll<HTMLElement>("[data-aw-rows]").forEach((t) => {
        gsap.fromTo(
          t.children,
          { clipPath: "inset(0% 100% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power4.inOut", stagger: 0.08, scrollTrigger: { trigger: t, start: "top 88%", once: true } },
        );
      });
      root.querySelectorAll<HTMLElement>("[data-aw-group]").forEach((g) => {
        gsap.fromTo(
          g.querySelectorAll("[data-aw-item]"),
          { y: 24, autoAlpha: 0, filter: "blur(8px)" },
          { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.5, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: g, start: "top 85%", once: true } },
        );
      });
    });
    return () => mm.revert();
  }, [rootId]);
  return null;
}
