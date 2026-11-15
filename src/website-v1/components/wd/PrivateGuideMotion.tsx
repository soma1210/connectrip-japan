"use client";

import { useEffect } from "react";
import { gsap, MQ_DESKTOP_MOTION } from "./gsap";

/**
 * Private Guide scene (Home). Wide screens: the section is 240svh tall and its
 * stage is held while one scrubbed timeline runs (white-desert.com "OUR CAMPS":
 * a photo cut into strips):
 *   0.00–0.42 the night street assembles from seven vertical strips that rise
 *             (odd ones) and fall (even ones) into place, out of step
 *   0.05–0.95 the camera inside every strip eases back as one picture
 *   0.25–0.90 the description, then each option group: a gold rule is drawn
 *             across and the group slides in under it; the CTA comes last
 * Phones: text rises once as it scrolls in (the photo is the section background).
 */
export function PrivateGuideMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const strips = root.querySelectorAll<HTMLElement>("[data-pg-strip]");
    const cams = root.querySelectorAll<HTMLElement>("[data-pg-cam]");
    const items = [...root.querySelectorAll<HTMLElement>("[data-pg-item]")];
    const mm = gsap.matchMedia();

    mm.add(MQ_DESKTOP_MOTION, () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.7, invalidateOnRefresh: true },
      });
      // Strips start just before the stage locks, so the picture is already moving as it arrives.
      strips.forEach((strip, i) => {
        tl.fromTo(strip, { yPercent: i % 2 ? -101 : 101 }, { yPercent: 0, ease: "power3.out", duration: 0.3 }, [0, 0.06, 0.02, 0.1, 0.04, 0.12, 0.08][i % 7]);
      });
      tl.fromTo(cams, { scale: 1.45 }, { scale: 1, duration: 0.95 }, 0);
      items.forEach((item, i) => {
        const line = item.querySelector("[data-pg-line]");
        const at = 0.25 + i * 0.1;
        if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: "power2.inOut", duration: 0.1, immediateRender: true }, at);
        // The group is written in from the left under its rule.
        tl.fromTo(
          item,
          { clipPath: "inset(-10% 100% -10% 0%)", x: -40 },
          { clipPath: "inset(-10% 0% -10% 0%)", x: 0, ease: "power3.out", duration: 0.14, immediateRender: true },
          at + 0.02,
        );
      });
      tl.to({}, { duration: 0.05 });
    });
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      items.forEach((item) => gsap.from(item, { y: 36, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: item, start: "top 92%" } }));
    });
    return () => mm.revert();
  }, [targetId]);
  return null;
}
