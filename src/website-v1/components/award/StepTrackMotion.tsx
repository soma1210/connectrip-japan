"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "../wd/gsap";

/**
 * Motion of StepTrack. The section is made exactly as tall as the sideways
 * distance (plus one screen), so scrolling down 1 px moves the track 1 px
 * left. As each step card passes the centre of the screen, its outlined
 * number fills with ink from the bottom; the progress bar follows the scroll.
 * Reduced motion: the track becomes a row you can swipe.
 */
export function StepTrackMotion({ targetId }: { targetId: string }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    const track = root?.querySelector<HTMLElement>("[data-st-track]");
    const stage = root?.querySelector<HTMLElement>("[data-st-stage]");
    const bar = root?.querySelector<HTMLElement>("[data-st-bar]");
    if (!root || !track || !stage) return;
    const cards = [...root.querySelectorAll<HTMLElement>("[data-st-card]")];
    const fills = cards.map((c) => c.querySelector<HTMLElement>("[data-st-fill]"));
    const photos = cards.map((c) => c.querySelector<HTMLElement>("[data-st-photo]"));
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth);
      const size = () => {
        root.style.height = `${distance() + stage.clientHeight}px`;
      };
      size();
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefreshInit: size,
          onUpdate: (self) => {
            if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
            const mid = window.innerWidth / 2;
            cards.forEach((card, i) => {
              const r = card.getBoundingClientRect();
              const k = Math.min(1, Math.max(0, (mid + r.width * 0.6 - r.left) / (r.width * 1.2)));
              const fill = fills[i];
              if (fill) fill.style.clipPath = `inset(${((1 - k) * 100).toFixed(1)}% 0 0 0)`;
              // Depth: the photo drifts against the track (±14% of the card).
              // Coverflow: cards turn towards the centre in 3D and settle as they pass it.
              const o = Math.max(-1.4, Math.min(1.4, (r.left + r.width / 2 - mid) / window.innerWidth));
              card.style.transform = `perspective(1400px) rotateY(${(-o * 16).toFixed(2)}deg) scale(${(1 - Math.abs(o) * 0.06).toFixed(3)})`;
              const photo = photos[i];
              if (photo) {
                const off = (r.left + r.width / 2 - mid) / window.innerWidth;
                const shift = Math.max(-0.17, Math.min(0.17, -off * 0.28)) * r.width;
                photo.style.transform = `translate3d(${shift.toFixed(1)}px,0,0)`;
              }
            });
          },
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(track, { clearProps: "transform" });
        root.style.height = "";
      };
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      stage.style.overflowX = "auto";
      fills.forEach((f) => f && (f.style.clipPath = "none"));
    });
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("orientationchange", onResize);
    return () => {
      mm.revert();
      window.removeEventListener("orientationchange", onResize);
    };
  }, [targetId]);
  return null;
}
