"use client";

import { useEffect } from "react";
import { gsap, MQ_MOTION } from "./gsap";

/**
 * SNS deck (Home): the account cards start scattered and turned away — tossed
 * across the section, tilted and spun in 3D — and fly into their places in the
 * grid as the section scrolls in (scrubbed, so scrolling back scatters them
 * again). The pointer then tilts each card (data-wd-tilt, components/wd/Interactions).
 */
export function SnsMotion() {
  useEffect(() => {
    const root = document.getElementById("sns");
    const cards = root?.querySelectorAll<HTMLElement>("[data-sns-card]");
    if (!root || !cards?.length) return;
    const mm = gsap.matchMedia();
    mm.add(MQ_MOTION, () => {
      const scatter = [
        { x: -260, y: 160, r: -24, ry: 60 },
        { x: -60, y: 260, r: 14, ry: -40 },
        { x: 120, y: 220, r: -10, ry: 50 },
        { x: 300, y: 140, r: 22, ry: -60 },
      ];
      cards.forEach((card, i) => {
        const s = scatter[i % scatter.length];
        gsap.fromTo(
          card,
          { x: s.x, y: s.y, rotate: s.r, rotateY: s.ry, scale: 0.7, autoAlpha: 0 },
          {
            x: 0,
            y: 0,
            rotate: 0,
            rotateY: 0,
            scale: 1,
            autoAlpha: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: root, start: `top ${95 - i * 3}%`, end: "top 20%", scrub: 0.8 },
          },
        );
      });
    });
    return () => mm.revert();
  }, []);
  return null;
}
