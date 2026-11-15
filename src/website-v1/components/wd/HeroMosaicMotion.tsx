"use client";

import { useEffect } from "react";
import { gsap, MQ_DESKTOP_MOTION } from "./gsap";

/**
 * Scroll choreography of the Home Hero mosaic (HeroMosaic.module.css).
 * One scrubbed timeline over the whole component (400svh):
 *   0.00–0.75  headline + CTAs fade, blur and drift up; the photo shading lifts;
 *              the featured photo narrows from full screen to half the width, so
 *              the camera seems to pull back and the mosaic appears around it;
 *              each neighbour photo eases back from a closer framing
 *   0.75–0.95  the whole mosaic settles to the bottom of the screen
 * Wide screens with motion only; phones and reduced motion keep the full-screen Hero.
 */
export function HeroMosaicMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const q = (s: string) => root.querySelector<HTMLElement>(s);
    const featured = q("[data-mosaic-featured]");
    const layout = q("[data-mosaic-layout]");
    const content = q("[data-mosaic-copy]");
    const shade = q("[data-mosaic-shade]");
    const neighbours = root.querySelectorAll<HTMLElement>("[data-mosaic-neighbour]");
    if (!featured || !layout || !content) return;

    const mm = gsap.matchMedia();
    let held = false;
    mm.add(MQ_DESKTOP_MOTION, () => {
      // The resting translateY(50%) lives in CSS; hand it to GSAP (as yPercent) so it can be animated.
      gsap.set(layout, { y: 0, yPercent: 50 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          // The slider holds its scene while the camera is pulled back, so the mosaic never repeats a photo mid-change.
          onUpdate: (self) => {
            const hold = self.progress > 0.03;
            if (hold !== held) root.dispatchEvent(new CustomEvent(hold ? "hero:hold" : "hero:release"));
            held = hold;
          },
        },
      });
      tl.to(content, { autoAlpha: 0, y: -70, filter: "blur(12px)", ease: "power3.out", duration: 0.45 }, 0)
        .to(shade, { opacity: 0, duration: 0.5 }, 0)
        .to(featured, { width: "50%", duration: 0.75 }, 0)
        .fromTo(neighbours, { scale: 1.35 }, { scale: 1, duration: 0.75 }, 0)
        .to(layout, { bottom: "0%", yPercent: 0, y: -16, duration: 0.2 }, 0.75);
      return () => {
        gsap.set(layout, { clearProps: "transform,bottom" });
        if (held) root.dispatchEvent(new CustomEvent("hero:release"));
        held = false;
      };
    });
    return () => mm.revert();
  }, [targetId]);

  return null;
}
