"use client";

import { useEffect } from "react";
import { gsap, MQ_MOTION } from "./gsap";

/**
 * Fixed banner (white-desert.com `fixed-banner` + the inset image that opens to
 * full bleed): the photo is pinned to the screen (position: fixed inside a
 * clip-path window), so the page slides over a still picture. As the section
 * arrives, the window opens from a rounded, inset frame to the full screen;
 * as it leaves, the picture darkens and the text drifts up a little faster.
 *
 * Markup (Home FinalCta): [data-fixed-banner] > [data-fb-frame] > [data-fb-media],
 * [data-fb-dim] inside the media, [data-fb-copy] for the text.
 */
export function FixedBannerMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const frame = root.querySelector<HTMLElement>("[data-fb-frame]");
    const media = root.querySelector<HTMLElement>("[data-fb-media]");
    const dim = root.querySelector<HTMLElement>("[data-fb-dim]");
    const copy = root.querySelector<HTMLElement>("[data-fb-copy]");
    if (!frame) return;
    const mm = gsap.matchMedia();
    mm.add(MQ_MOTION, () => {
      gsap.fromTo(
        frame,
        { clipPath: "inset(12% 9% 12% 9% round 18px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "top 15%", scrub: 0.6 } },
      );
      if (media) gsap.fromTo(media, { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } });
      if (dim) gsap.fromTo(dim, { opacity: 0.55 }, { opacity: 0.92, ease: "none", scrollTrigger: { trigger: root, start: "center center", end: "bottom top", scrub: true } });
      if (copy) gsap.fromTo(copy, { y: 80 }, { y: -80, ease: "none", scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true } });
    });
    return () => mm.revert();
  }, [targetId]);
  return null;
}
