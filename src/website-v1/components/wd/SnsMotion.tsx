"use client";

import { useEffect } from "react";
import { gsap, MQ_DESKTOP_MOTION } from "./gsap";

/**
 * SNS deck (Home).
 *
 * Wide screens: the account cards start scattered and turned away — tossed
 * across the section, tilted and spun in 3D — and fly into their places in the
 * grid as the section scrolls in (scrubbed, so scrolling back scatters them
 * again). The pointer then tilts each card (data-wd-tilt, components/wd/Interactions).
 *
 * Phones (2026-11-21): a fanned hand of cards (wd.css "SNS fan"). As the deck
 * scrolls in, the cards gather in the centre, then the pile opens into the fan;
 * scrolling back closes it again. Only two CSS numbers on the deck change
 * (--g gather, --p open); the cards follow with transform and opacity. Links
 * take taps once the fan is open. Reduced motion / no JavaScript: the fan
 * stands open (CSS defaults).
 */
export function SnsMotion() {
  useEffect(() => {
    const root = document.getElementById("sns");
    const deck = root?.querySelector<HTMLElement>("[data-sns-deck]");
    const cards = root?.querySelectorAll<HTMLElement>("[data-sns-card]");
    if (!root || !deck || !cards?.length) return;
    const mm = gsap.matchMedia();
    mm.add(MQ_DESKTOP_MOTION, () => {
      const scatter = [
        { x: -260, y: 160, r: -24, ry: 60 },
        { x: -60, y: 260, r: 14, ry: -40 },
        { x: 120, y: 220, r: -10, ry: 50 },
        { x: 300, y: 140, r: 22, ry: -60 },
      ];
      cards.forEach((card, i) => {
        const s = scatter[i % scatter.length];
        gsap.fromTo(
          card,
          { x: s.x, y: s.y, rotate: s.r, rotateY: s.ry, scale: 0.7, autoAlpha: 0 },
          {
            x: 0,
            y: 0,
            rotate: 0,
            rotateY: 0,
            scale: 1,
            autoAlpha: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: root, start: `top ${95 - i * 3}%`, end: "top 20%", scrub: 0.8 },
          },
        );
      });
    });
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      // Driven by where the deck really is on screen (not by ScrollTrigger's
      // measured offsets), so scenes above it that hold or change length can
      // never put the fan out of step with what is on screen.
      // Progress 0 = deck top at 92% of the screen, 1 = deck centre at 48%.
      const state = { t: 0 };
      const ease = { g: gsap.parseEase("power2.out"), p: gsap.parseEase("power2.inOut") };
      const G = 0.42; // the first 42% of the way gathers the cards, the rest opens the fan
      const paint = () => {
        const t = state.t;
        const g = ease.g(Math.min(1, t / G));
        const p = ease.p(Math.max(0, (t - G) / (1 - G)));
        deck.style.setProperty("--g", g.toFixed(4));
        deck.style.setProperty("--p", p.toFixed(4));
        if (t >= 0.995) deck.removeAttribute("data-sns-moving");
        else deck.setAttribute("data-sns-moving", "");
      };
      const target = () => {
        const r = deck.getBoundingClientRect();
        const vh = window.innerHeight;
        const from = 0.92 * vh;
        const to = 0.48 * vh - r.height / 2;
        return gsap.utils.clamp(0, 1, (from - r.top) / (from - to));
      };
      // A short follow (like scrub) keeps the motion soft; scrolling back runs it in reverse.
      const follow = gsap.quickTo(state, "t", { duration: 0.6, ease: "power3.out", onUpdate: paint });
      state.t = target();
      paint();
      // Read the deck once per frame, and only while it is near the screen (iPhone Safari: no work elsewhere).
      let last = state.t;
      const onFrame = () => {
        const t = target();
        if (Math.abs(t - last) > 0.0005) follow((last = t));
      };
      let running = false;
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting === running) return;
        running = entry.isIntersecting;
        if (running) gsap.ticker.add(onFrame);
        else gsap.ticker.remove(onFrame);
      }, { rootMargin: "50% 0px" });
      io.observe(deck);
      return () => {
        io.disconnect();
        gsap.ticker.remove(onFrame);
        deck.removeAttribute("data-sns-moving");
        deck.style.removeProperty("--g");
        deck.style.removeProperty("--p");
      };
    });
    return () => mm.revert();
  }, []);
  return null;
}
