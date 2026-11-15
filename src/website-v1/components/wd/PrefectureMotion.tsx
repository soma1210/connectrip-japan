"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Motion of PrefectureScene. The scroll position inside the section becomes a
 * continuous position along the list, with a short hold on every name:
 *   - the column glides so that position sits on the centre line;
 *   - every name's brightness and size follow its distance from the centre;
 *     the Japanese name shows beside the one at the centre;
 *   - when the centre changes to another prefecture, its three photos rise in
 *     over the previous ones (clip-path curtain from below, each slot a beat
 *     after the other) while their cameras settle from a closer framing.
 * Reduced motion: the names step without gliding and photos simply swap.
 */
export function PrefectureMotion({ targetId, count }: { targetId: string; count: number }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const list = root.querySelector<HTMLElement>("[data-pf-list]");
    const names = [...root.querySelectorAll<HTMLElement>("[data-pf-name]")];
    const counter = root.querySelector<HTMLElement>("[data-pf-count]");
    const slots = [...root.querySelectorAll<HTMLElement>("[data-pf-slot]")];
    if (!list || !names.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let active = -1;
    let z = 1;
    const showPhotos = (i: number) => {
      if (i === active) return;
      const first = active === -1;
      active = i;
      if (counter) counter.textContent = String(i + 1).padStart(2, "0");
      slots.forEach((slot, s) => {
        const photos = [...slot.querySelectorAll<HTMLElement>("[data-pf-photo]")];
        const next = photos[i];
        if (!next) return;
        const prev = photos.filter((p) => p !== next && p.hasAttribute("data-on"));
        next.setAttribute("data-on", "");
        next.style.zIndex = String(++z);
        if (first || reduced) {
          prev.forEach((p) => p.removeAttribute("data-on"));
          return;
        }
        gsap.killTweensOf(next);
        gsap.fromTo(
          next,
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.15,
            delay: s * 0.09,
            ease: "expo.inOut",
            onComplete: () => prev.forEach((p) => p.removeAttribute("data-on")),
          },
        );
        const cam = next.querySelector("[data-pf-cam]");
        if (cam) gsap.fromTo(cam, { scale: 1.3, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 1.6, delay: s * 0.09, ease: "expo.out" });
      });
    };

    let itemH = 0;
    const measure = () => {
      itemH = names[0].offsetHeight;
    };
    const place = (c: number) => {
      gsap.set(list, { y: -c * itemH - itemH / 2 });
      names.forEach((name, i) => {
        const d = Math.abs(c - i);
        name.style.opacity = String(Math.max(0.14, 1 - d * 0.72).toFixed(3));
        name.style.transform = `scale(${(1 - Math.min(d, 2.5) * 0.07).toFixed(3)})`;
        const kanji = name.querySelector<HTMLElement>("[data-pf-kanji]");
        if (kanji) kanji.style.opacity = String(Math.max(0, 1 - d * 2.5).toFixed(3));
      });
      showPhotos(Math.round(c));
    };

    measure();
    place(0);
    const st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onRefresh: measure,
      onUpdate: (self) => {
        const raw = self.progress * (count - 1);
        const i = Math.min(count - 1, Math.floor(raw));
        const f = raw - i;
        // Hold on each name; glide in the middle third of the way to the next.
        const t = reduced ? (f > 0.5 ? 1 : 0) : gsap.parseEase("power2.inOut")(Math.min(1, Math.max(0, (f - 0.3) / 0.4)));
        place(i + t);
      },
    });
    return () => {
      st.kill();
      gsap.set(list, { clearProps: "transform" });
    };
  }, [targetId, count]);

  return null;
}
