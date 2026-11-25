"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { OPENING_ATTR } from "../opening/openingBoot";
import { gsap, ScrollTrigger } from "./gsap";

let lenis: Lenis | null = null;
/** The running Lenis instance (null on touch-only / reduced-motion devices). */
export const getLenis = () => lenis;

const openingActive = () => ["pending", "play", "reduced", "reduced-out"].includes(document.documentElement.getAttribute(OPENING_ATTR) ?? "");

/**
 * Smooth, weighted scrolling (Lenis), as on white-desert.com. Driven by the
 * GSAP ticker so ScrollTrigger scenes and the scroll stay in the same frame.
 * Not used with reduced motion. Paused while the Home Opening overlay plays.
 * Nested scroll areas (menus, contents lists) keep their own scrolling.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Tuned 2026-11-22 (Human instruction: one flick glided two slides on): a shorter glide (lerp
    // 0.085 → 0.13) and less distance per wheel / trackpad movement (0.95 → 0.7), still smooth.
    lenis = new Lenis({ lerp: 0.13, wheelMultiplier: 0.7, allowNestedScroll: true, anchors: { offset: -96 } });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Hold still while the Opening overlay is on screen.
    const sync = () => (openingActive() || document.documentElement.hasAttribute("data-menu-open") ? lenis?.stop() : lenis?.start());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [OPENING_ATTR, "data-menu-open"] });

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // New page: start at the top (unless an #anchor was asked for), then re-measure every scene.
  useEffect(() => {
    if (!window.location.hash) {
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    }
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
