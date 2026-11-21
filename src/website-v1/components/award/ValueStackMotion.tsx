"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "../wd/gsap";

/**
 * Motion of ValueStack. One ScrollTrigger over the held section turns the
 * scroll into the current value (0 … n-1); each change plays a timed
 * transition: background cross-fade with a slow push-in, title words rise
 * in / out, description sharpens from a blur, numeral rolls, index lights up.
 * The progress line under the current index item follows the scroll inside
 * that value. Reduced motion: the values swap without movement.
 */
export function ValueStackMotion({ targetId, count }: { targetId: string; count: number }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const bgs = [...root.querySelectorAll<HTMLElement>("[data-vs-bg]")];
    const items = [...root.querySelectorAll<HTMLElement>("[data-vs-item]")];
    const tabs = [...root.querySelectorAll<HTMLElement>("[data-vs-tab]")];
    const numbers = root.querySelector<HTMLElement>("[data-vs-numbers]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = -1;

    items.forEach((it) => gsap.set(it.querySelectorAll("[data-vs-word]"), { yPercent: 110 }));
    gsap.set(root.querySelectorAll("[data-vs-desc]"), { autoAlpha: 0 });

    const show = (i: number) => {
      if (i === current) return;
      const prev = current;
      current = i;
      const d = reduced ? 0 : 1;
      // Background.
      bgs.forEach((bg, j) => {
        if (j === i) {
          gsap.to(bg, { opacity: 1, duration: 1.2 * d, ease: "power2.inOut", overwrite: true });
          const cam = bg.querySelector("[data-vs-cam]");
          if (cam && !reduced) gsap.fromTo(cam, { scale: 1.18 }, { scale: 1.02, duration: 7, ease: "power1.out", overwrite: true });
        } else gsap.to(bg, { opacity: 0, duration: 1.2 * d, ease: "power2.inOut", overwrite: true });
      });
      // Title and description.
      const out = items[prev];
      if (out) {
        out.setAttribute("aria-hidden", "true");
        gsap.to(out.querySelectorAll("[data-vs-word]"), { yPercent: -110, duration: 0.6 * d, ease: "power3.in", stagger: 0.03, overwrite: true });
        gsap.to(out.querySelector("[data-vs-desc]"), { autoAlpha: 0, filter: "blur(6px)", duration: 0.4 * d, overwrite: true });
      }
      const inn = items[i];
      if (inn) {
        inn.removeAttribute("aria-hidden");
        gsap.fromTo(inn.querySelectorAll("[data-vs-word]"), { yPercent: 110 }, { yPercent: 0, duration: 1.1 * d, ease: "expo.out", stagger: 0.06, delay: 0.25 * d, overwrite: true });
        gsap.fromTo(inn.querySelector("[data-vs-desc]"), { autoAlpha: 0, filter: "blur(10px)", y: 14 }, { autoAlpha: 1, filter: "blur(0px)", y: 0, duration: 1.2 * d, ease: "expo.out", delay: 0.5 * d, overwrite: true });
      }
      if (numbers) gsap.to(numbers, { yPercent: (-100 * i) / count, duration: 1 * d, ease: "expo.inOut", overwrite: true });
      tabs.forEach((t, j) => t.toggleAttribute("data-on", j === i));
    };

    const st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const x = self.progress * count;
        const i = Math.min(count - 1, Math.floor(x));
        show(i);
        tabs.forEach((t, j) => {
          const bar = t.querySelector<HTMLElement>("[data-vs-progress]");
          if (bar) bar.style.transform = `scaleX(${j < i ? 1 : j > i ? 0 : Math.min(1, x - i).toFixed(3)})`;
        });
      },
    });
    show(0);
    return () => st.kill();
  }, [targetId, count]);
  return null;
}
