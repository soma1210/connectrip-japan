"use client";

import { useEffect } from "react";
import { gsap, MQ_DESKTOP_MOTION } from "./gsap";

/**
 * Featured Experiences "showreel" scene (Home). Wide screens: the section is
 * 320svh tall and its stage is held on screen while one scrubbed timeline runs:
 *
 *   before   the giant title assembles letter by letter as the section arrives
 *   0.00–0.38 a small rounded window behind the title opens to the full screen
 *             (clip-path inset, white-desert.com showreel band); the camera
 *             inside eases back; the camera passes through the title (it grows,
 *             blurs and dissolves)
 *   0.38–0.52 the full-screen photo holds, drifting
 *   0.52–0.78 the photo slides into the left half; the tour panel arrives from
 *             the right, line by line
 *   0.78–1.00 hold
 *
 * Phones: the same markup in normal flow; title letters, photo and lines rise once.
 * Markup: [data-showreel] with [data-sr-title] (letters [data-sr-l]),
 * [data-sr-photo] > [data-sr-cam], [data-sr-panel] with [data-sr-item].
 */
export function ShowreelMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const title = root.querySelector<HTMLElement>("[data-sr-title]");
    const letters = root.querySelectorAll<HTMLElement>("[data-sr-l]");
    const photo = root.querySelector<HTMLElement>("[data-sr-photo]");
    const cam = root.querySelector<HTMLElement>("[data-sr-cam]");
    const items = root.querySelectorAll<HTMLElement>("[data-sr-item]");
    const shade = root.querySelector<HTMLElement>("[data-sr-shade]");
    // Editorial decoration of the tour panel (FeaturedPop).
    const panel = root.querySelector<HTMLElement>("[data-sr-panel]");
    const words = root.querySelectorAll<HTMLElement>("[data-sr-word]");
    const lines = root.querySelectorAll<HTMLElement>("[data-sr-line]");
    const frame = root.querySelector<HTMLElement>("[data-sr-frame]");
    const seal = root.querySelector<HTMLElement>("[data-sr-seal]");
    if (!photo) return;

    const mm = gsap.matchMedia();
    mm.add(MQ_DESKTOP_MOTION, () => {
      if (letters.length) {
        gsap.fromTo(
          letters,
          { yPercent: 120, rotateX: -90, autoAlpha: 0 },
          {
            yPercent: 0,
            rotateX: 0,
            autoAlpha: 1,
            ease: "power3.out",
            stagger: { each: 0.04, from: "center" },
            scrollTrigger: { trigger: root, start: "top 85%", end: "top 5%", scrub: 0.8 },
          },
        );
      }
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.7, invalidateOnRefresh: true },
      });
      tl.fromTo(photo, { clipPath: "inset(31% 35% 31% 35% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 0.38 }, 0)
        .fromTo(cam, { scale: 1.55 }, { scale: 1.06, duration: 0.52 }, 0)
        .to(title, { scale: 2.4, autoAlpha: 0, filter: "blur(18px)", ease: "power2.in", duration: 0.34 }, 0.02)
        .to(cam, { scale: 1, duration: 0.48 }, 0.52)
        .to(photo, { clipPath: "inset(0% 46% 0% 0% round 0px)", ease: "power3.inOut", duration: 0.26 }, 0.52)
        .fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.56)
        .fromTo(items, { x: 120, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power3.out", stagger: 0.035, duration: 0.18 }, 0.6);
      // The panel and its decoration stay out of the opening (they must not sit over the giant title).
      if (panel) tl.fromTo(panel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04, immediateRender: true }, 0.57);
      if (words.length) tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, ease: "power3.out", stagger: 0.008, duration: 0.14, immediateRender: true }, 0.61);
      if (lines.length) tl.fromTo(lines, { scaleX: 0 }, { scaleX: 1, ease: "power2.inOut", stagger: 0.012, duration: 0.14, immediateRender: true }, 0.63);
      if (frame) tl.fromTo(frame, { autoAlpha: 0, scale: 1.03 }, { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 0.16, immediateRender: true }, 0.66);
      if (seal) tl.fromTo(seal, { scale: 1.9, rotation: -14, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, ease: "expo.out", duration: 0.1, immediateRender: true }, 0.74);
    });
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      if (letters.length) gsap.from(letters, { yPercent: 110, autoAlpha: 0, stagger: 0.025, duration: 1, ease: "expo.out", scrollTrigger: { trigger: title, start: "top 88%" } });
      gsap.fromTo(photo, { clipPath: "inset(18% 12% 18% 12% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: photo, start: "top 95%", end: "center 55%", scrub: 0.5 } });
      gsap.fromTo(cam, { scale: 1.35 }, { scale: 1, ease: "none", scrollTrigger: { trigger: photo, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from(items, { y: 40, autoAlpha: 0, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: items[0], start: "top 90%" } });
      if (words.length) gsap.from(words, { yPercent: 115, stagger: 0.03, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: words[0], start: "top 90%" } });
      lines.forEach((l) => gsap.from(l, { scaleX: 0, duration: 1.2, ease: "power2.inOut", scrollTrigger: { trigger: l, start: "top 92%" } }));
      if (seal) gsap.from(seal, { scale: 1.9, rotation: -14, autoAlpha: 0, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: seal, start: "top 85%" } });
    });
    return () => mm.revert();
  }, [targetId]);
  return null;
}
