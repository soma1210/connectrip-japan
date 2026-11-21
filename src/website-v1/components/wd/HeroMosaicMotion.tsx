"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Scroll choreography of the Home Hero mosaic (HeroMosaic.module.css), every
 * screen size. One scrubbed timeline over the whole component:
 *
 *   0.00–0.30 headline + CTAs fade, blur and drift up; the photo shading and the
 *             location label lift; Osaka Castle settles into the centre cell
 *   0.00–0.80 the camera pulls back: the 3 × 3 grid (laid out large) scales
 *             down until all nine photos fit on the screen; each neighbour's own
 *             camera eases back from a closer framing
 *   0.80–1.00 the full mosaic holds; only then does the page scroll on
 *
 * Layout maths (on load and resize): the final cell size is the largest 16:11
 * (phones 4:5) cell for which the 3 × 3 grid plus margins fits the screen; the
 * large layout is that grid multiplied by the scale at which the centre cell
 * covers the screen. The slider holds its scene while the camera is back.
 * Reduced motion: nothing moves (one full-screen photo).
 */
export function HeroMosaicMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const q = (s: string) => root.querySelector<HTMLElement>(s);
    const grid = q("[data-mosaic-grid]");
    const stage = q("[data-mosaic-stage]");
    const copy = q("[data-mosaic-copy]");
    const shade = q("[data-mosaic-shade]");
    const castle = q("[data-mosaic-castle]");
    const label = q("[data-hero-label]");
    const neighbours = root.querySelectorAll<HTMLElement>("[data-mosaic-neighbour]");
    const bigWords = root.querySelectorAll<HTMLElement>("[data-big-word]");
    const veil = q("[data-mosaic-veil]");
    if (!grid || !stage) return;

    let endScale = 0.3;
    const measure = () => {
      const vw = stage.clientWidth;
      const vh = stage.clientHeight;
      const phone = vw < 768;
      const aspect = phone ? 4 / 5 : 16 / 11;
      const pad = phone ? 14 : Math.max(28, vw * 0.03);
      const gap = phone ? 8 : 14;
      const w = Math.min((vw - 2 * pad - 2 * gap) / 3, ((vh - 2 * pad - 2 * gap) / 3) * aspect);
      const h = w / aspect;
      const cover = Math.max(vw / w, vh / h) * 1.002;
      root.style.setProperty("--cw", `${(w * cover).toFixed(2)}px`);
      root.style.setProperty("--ch", `${(h * cover).toFixed(2)}px`);
      root.style.setProperty("--gap", `${(gap * cover).toFixed(2)}px`);
      root.style.setProperty("--radius", `${(6 * cover).toFixed(2)}px`);
      endScale = 1 / cover;
    };

    let held = false;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      measure();
      gsap.set(grid, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
          // The slider holds its scene while the camera is pulled back.
          onUpdate: (self) => {
            const hold = self.progress > 0.02;
            if (hold !== held) root.dispatchEvent(new CustomEvent(hold ? "hero:hold" : "hero:release"));
            held = hold;
          },
        },
      });
      tl.to(copy, { autoAlpha: 0, y: -70, filter: "blur(12px)", ease: "power2.in", duration: 0.3 }, 0)
        .to(shade, { opacity: 0, duration: 0.3 }, 0)
        .to(label, { autoAlpha: 0, duration: 0.1 }, 0)
        .fromTo(castle, { opacity: 0 }, { opacity: 1, duration: 0.16 }, 0.02)
        .to(grid, { scale: () => endScale, ease: "power2.inOut", duration: 0.8 }, 0)
        .fromTo(neighbours, { scale: 1.3 }, { scale: 1, ease: "power1.out", duration: 0.8 }, 0)
        // The headline comes back huge across the finished mosaic, word by word.
        .fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.7)
        .fromTo(bigWords, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, ease: "power3.out", stagger: 0.025, duration: 0.12 }, 0.72)
        .to({}, { duration: 0.16 });
      return () => {
        gsap.set(grid, { clearProps: "transform" });
        if (held) root.dispatchEvent(new CustomEvent("hero:release"));
        held = false;
      };
    });
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("orientationchange", onResize);
      mm.revert();
    };
  }, [targetId]);

  return null;
}
