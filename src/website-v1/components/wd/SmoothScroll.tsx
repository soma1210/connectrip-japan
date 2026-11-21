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

    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, allowNestedScroll: true, anchors: { offset: -96 } });
    lenis.on("scroll", ScrollTrigger.update);
    // Scroll speed as a CSS variable (--wd-v, eased): `.wd-skew` elements lean with fast scrolling.
    const root = document.documentElement;
    let v = 0;
    let last = "";
    const lean = () => {
      const target = Math.max(-1, Math.min(1, (lenis?.velocity ?? 0) / 40));
      v += (target - v) * 0.12;
      const next = Math.abs(v) < 0.001 ? "0" : v.toFixed(3);
      if (next !== last) root.style.setProperty("--wd-v", (last = next));
    };
    gsap.ticker.add(lean);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Hold still while the Opening overlay or the full-screen menu is on screen.
    const sync = () => (openingActive() || document.documentElement.hasAttribute("data-menu-open") ? lenis?.stop() : lenis?.start());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [OPENING_ATTR, "data-menu-open"] });

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      gsap.ticker.remove(lean);
      root.style.removeProperty("--wd-v");
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
