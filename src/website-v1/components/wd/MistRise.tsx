"use client";

import { useEffect, useRef } from "react";
import { gsap, MQ_MOTION } from "./gsap";

/**
 * Scene change by mist (white-desert.com `mist-transition`): a layer of navy
 * mist stands up from its bottom edge (rotateX 90° → 0°) and drifts sideways as
 * the next scene scrolls in, swallowing the end of the scene before.
 * Placed at the top of the next scene; it reaches up over the one before.
 * The mist is a generated, decorative image (public/images/v1/motion/mist-navy.png).
 */
export function MistRise({ height = "60svh" }: { height?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const [back, front] = el.querySelectorAll<HTMLElement>("[data-mist]");
    const mm = gsap.matchMedia();
    mm.add(MQ_MOTION, () => {
      // Starts as the scene before lets go of the screen; stands fully as its end passes the middle.
      const st = { trigger: el, start: "top 45%", end: "top -15%", scrub: 0.8 };
      gsap.fromTo(front, { rotateX: 90, autoAlpha: 0, xPercent: -4 }, { rotateX: 0, autoAlpha: 1, xPercent: 0, ease: "power1.out", scrollTrigger: st });
      gsap.fromTo(back, { rotateX: 75, autoAlpha: 0, xPercent: 6, scaleY: 1.3 }, { rotateX: 0, autoAlpha: 0.75, xPercent: 0, scaleY: 1, ease: "none", scrollTrigger: st });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={root} aria-hidden className="wd-mist" style={{ height, marginTop: `calc(${height} * -1)` }}>
      <span data-mist className="wd-mist__layer wd-mist__layer--back" />
      <span data-mist className="wd-mist__layer" />
    </div>
  );
}
