"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Cinematic depth for the stacked Home slides (Human instruction 2026-11-22, after the
 * stacking-card scroll of award sites such as Studio Freight's and Oaksun Studio's): while
 * the next slide slides up over a held one, the held one sinks back — it shrinks a little,
 * its corners round and it darkens — like a card laid under the next. Scrubbed with the
 * scroll; wide screens only, nothing with reduced motion. Writes --depth (0 → 1) on the
 * slide underneath; wd.css draws it.
 *   Select            ← Kansai Travel Updates
 *   Explore Kansai    ← Our Value
 *   Our Value         ← SNS
 */
const PAIRS: [under: string, over: string][] = [
  ['[data-slide="select"]', '[data-slide="updates"]'],
  ['[data-home-section="travelGuide"] > [data-home-stack-layer]', '[data-home-section="whyConnectrip"]'],
  ['[data-home-section="whyConnectrip"] > [data-home-stack-layer]', '[data-home-section="sns"]'],
];

export function StackDepth() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const made: ScrollTrigger[] = [];
      const touched: HTMLElement[] = [];
      for (const [u, o] of PAIRS) {
        const under = document.querySelector<HTMLElement>(u);
        const over = document.querySelector<HTMLElement>(o);
        if (!under || !over) continue;
        under.setAttribute("data-depth", "");
        touched.push(under);
        made.push(
          ScrollTrigger.create({
            trigger: over,
            start: "top bottom",
            end: "top top",
            scrub: true,
            onUpdate: (self) => under.style.setProperty("--depth", self.progress.toFixed(3)),
            onLeaveBack: () => under.style.setProperty("--depth", "0"),
          }),
        );
      }
      return () => {
        made.forEach((t) => t.kill());
        touched.forEach((el) => {
          el.removeAttribute("data-depth");
          el.style.removeProperty("--depth");
        });
      };
    });
    return () => mm.revert();
  }, []);
  return null;
}
