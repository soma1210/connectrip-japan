"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Scroll choreography of the Home Hero mosaic (HeroMosaic.module.css), every
 * screen size, after white-desert.com/about/founders. One scrubbed timeline
 * while the stage is held (about one screen of scrolling):
 *
 *   0.00–0.30 headline + CTAs fade, blur and drift up; the photo shading and the
 *             location label lift; Osaka Castle settles into the centre cell
 *   0.00–1.00 the camera pulls back from the centre photo until the centre is
 *             ~54% of the screen width (phones ~64%), the sides cut by the screen edges; each neighbour's own camera
 *             eases back from a closer framing
 *
 * It does not wait for the whole mosaic: at the end the sides are cut by the
 * screen edge and the top and bottom rows are partly in view. The stage then
 * lets go and the mosaic scrolls up with the page, bringing the bottom row
 * fully into view (--tail) before the next scene's mist.
 *
 * Layout maths (on load and resize): the large layout is the one whose centre
 * cell (16:11, phones 4:5) covers the screen; the end scale shrinks it to the
 * final centre width; --tail is how far the scaled grid reaches below the
 * stage, plus a margin. The slider holds its scene while the camera is back.
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
    if (!grid || !stage) return;

    let endScale = 0.3;
    const measure = () => {
      const vw = stage.clientWidth;
      const vh = stage.clientHeight;
      const phone = vw < 768;
      // End: the centre always takes the same share of the width (as in the reference);
      // on short, wide windows its frame gets wider instead of the mosaic shrinking,
      // so it is never taller than ~56% of the stage and the top and bottom rows stay in view.
      const endW = vw * (phone ? 0.64 : 0.54);
      const aspect = phone ? 4 / 5 : Math.max(16 / 11, endW / (vh * 0.56));
      // Large layout: the centre cell covers the stage.
      const w = Math.max(vw, vh * aspect) * 1.002;
      const h = w / aspect;
      endScale = endW / w;
      const gapEnd = phone ? 8 : 14;
      // The side photos always run off the screen edges (no empty margins beside the mosaic).
      const sideEnd = Math.max(endW * (phone ? 0.42 : 0.48), (vw * 1.12 - endW) / 2 - gapEnd);
      const side = sideEnd / endScale;
      const row = h * (phone ? 0.7 : 0.8);
      const gap = gapEnd / endScale;
      root.style.setProperty("--cw", `${w.toFixed(2)}px`);
      root.style.setProperty("--ch", `${h.toFixed(2)}px`);
      root.style.setProperty("--side", `${side.toFixed(2)}px`);
      root.style.setProperty("--row", `${row.toFixed(2)}px`);
      root.style.setProperty("--gap", `${gap.toFixed(2)}px`);
      root.style.setProperty("--radius", `${(6 / endScale).toFixed(2)}px`);
      // How far the scaled grid reaches below the stage, plus a margin under the bottom row.
      const gridH = (h + 2 * row + 2 * gap) * endScale;
      const tail = Math.max(0, (gridH - vh) / 2) + vh * (phone ? 0.05 : 0.07);
      root.style.setProperty("--tail", `${tail.toFixed(0)}px`);
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
          // While the stage is held: until the end of the component minus the tail.
          end: () => `bottom-=${parseFloat(root.style.getPropertyValue("--tail")) || 0} bottom`,
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
        .to(grid, { scale: () => endScale, ease: "power2.inOut", duration: 1 }, 0)
        .fromTo(neighbours, { scale: 1.3 }, { scale: 1, ease: "power1.out", duration: 1 }, 0);
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
