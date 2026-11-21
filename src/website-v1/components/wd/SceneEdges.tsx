"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, MQ_MOTION } from "./gsap";

/**
 * Dark scenes open like a window onto the night (award redesign 2026-11-22):
 * a section marked `data-wd-inset` arrives as a rounded panel inset from the
 * sides of the white page and widens to full bleed as it scrolls into place.
 */
export function SceneEdges() {
  const pathname = usePathname();
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ_MOTION, () => {
      document.querySelectorAll<HTMLElement>("[data-wd-inset]").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0% 4% 0% 4% round 36px 36px 0px 0px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 25%", scrub: 0.6 } },
        );
      });
    });
    return () => mm.revert();
  }, [pathname]);
  return null;
}
