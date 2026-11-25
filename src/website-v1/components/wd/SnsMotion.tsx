"use client";

import { useEffect } from "react";
import { gsap, MQ_DESKTOP_MOTION, ScrollTrigger } from "./gsap";

/**
 * SNS deck (Home).
 *
 * Wide screens (2026-11-25): a 3D card reveal scrubbed by the scroll — stack,
 * spread, flip, align — after Lusion's "Area of Expertise" (see below). The
 * pointer then tilts each card (data-wd-tilt, components/wd/Interactions).
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
      // 3D card reveal (Human instruction 2026-11-25, after Lusion's "Area of Expertise"):
      // Stack → Spread → Flip → Align, scrubbed by the scroll, with a short pin of the section.
      //   Stack  the four cards lie as one deck in the middle of the row, face down, each a little
      //          deeper and turned a little differently; the deck rises as the section arrives.
      //   Spread the deck fans out like a hand thrown into the air: every card on its own path,
      //          lifted, brought forward in depth and tilted (left cards left, right cards right).
      //   Flip   one after another, left to right, each card turns over on its Y axis (with a
      //          touch of X and Z) from its dark back to its face.
      //   Align  the cards settle into the existing grid; every transform ends at zero, so the
      //          final state is exactly the static design.
      // Scrolling back plays it in reverse. Only transform is animated (GPU); nothing is
      // re-laid out. The back is a plain dark card with the gold hairline frame and ring
      // (data-sns-back, wd.css "SNS 3D").
      const items = [...cards];
      const n = items.length;
      deck.setAttribute("data-sns-3d", "");

      // Where each card has to travel to reach the deck centre (layout positions, transforms ignored).
      const offset = (card: HTMLElement) => {
        const cx = card.offsetLeft + card.offsetWidth / 2;
        const cy = card.offsetTop + card.offsetHeight / 2;
        return { x: deck.offsetWidth / 2 - cx, y: deck.offsetHeight / 2 - cy };
      };
      const k = (i: number) => i - (n - 1) / 2; // −1.5 … 1.5
      const STACK = (i: number) => ({
        x: () => offset(items[i]).x + k(i) * 3,
        y: () => offset(items[i]).y - i * 3 + 150,
        z: -i * 26,
        rotateX: 38,
        rotateY: 180,
        rotate: k(i) * 2.2,
        scale: 0.94,
      });

      const tl = gsap.timeline({ defaults: { ease: "none" } });
      items.forEach((card, i) => {
        const fan = k(i);
        // Approach (0 → 4): the deck rises into place, still face down.
        tl.fromTo(
          card,
          STACK(i),
          { y: () => offset(card).y - i * 3, rotateX: 16, scale: 1, ease: "power2.out", duration: 4 },
          0,
        );
        // Spread (4 → ~6.6): fan out, lifted and forward, each card a beat after the previous.
        const s0 = 4 + i * 0.22;
        tl.to(card, { x: () => offset(card).x * 0.42 + fan * 26, duration: 2.2, ease: "power3.inOut" }, s0)
          .to(card, { y: () => offset(card).y * 0.4 - 46 + fan * fan * 12, duration: 2.2, ease: "power2.inOut" }, s0)
          .to(card, { z: 90 + i * 14, rotate: fan * 7.5, rotateX: 8, duration: 2.2, ease: "power2.inOut" }, s0);
        // Flip (from ~5.6, staggered left → right): over on the Y axis, with a lean of X and Z.
        const f0 = 5.6 + i * 0.55;
        tl.to(card, { rotateY: 0, duration: 2.1, ease: "power2.inOut" }, f0)
          .to(card, { rotateX: -6, duration: 1.05, ease: "sine.out" }, f0)
          .to(card, { rotateX: 0, duration: 1.05, ease: "sine.in" }, f0 + 1.05);
        // Align (after its flip has passed half way): into its place in the grid.
        const a0 = f0 + 0.9;
        tl.to(card, { x: 0, y: 0, duration: 2.4, ease: "power3.inOut" }, a0)
          .to(card, { z: 0, rotate: 0, scale: 1, duration: 2.4, ease: "power3.inOut" }, a0);
      });

      // Face-up cards get their frame drawn and a light across them (wd.css), and lose it again in reverse.
      const faces = () =>
        items.forEach((card) => {
          const up = Math.abs(Number(gsap.getProperty(card, "rotateY"))) < 25;
          if (up !== card.hasAttribute("data-sns-dealt")) card.toggleAttribute("data-sns-dealt", up);
        });

      // Settled: the 3D space is switched off (wd.css), so the cards render exactly as the static
      // design (text antialiasing included); scrolling back switches it on again.
      const settle = (progress: number) => {
        const done = progress > 0.999;
        if (done === deck.hasAttribute("data-sns-settled")) return;
        deck.toggleAttribute("data-sns-settled", done);
        if (done) items.forEach((card) => gsap.set(card, { clearProps: "transform" }));
      };

      // A short pin: the section holds while the cards spread, flip and settle (≈ 0.8 screen of scroll).
      const pin = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: () => "+=" + Math.round(window.innerHeight * 0.8),
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      });
      // The pin's spacer shows below the (shorter than a screen) section: give it the section's ground.
      const spacer = root.parentElement;
      if (spacer?.classList.contains("pin-spacer")) spacer.style.background = "#141210";

      const scrub = ScrollTrigger.create({
        trigger: root,
        start: "top 88%",
        end: () => pin.end,
        scrub: 0.9,
        animation: tl,
        invalidateOnRefresh: true,
        refreshPriority: -1,
        onUpdate: (self) => {
          faces();
          settle(self.progress);
        },
        onRefresh: (self) => {
          faces();
          settle(self.progress);
        },
      });

      return () => {
        scrub.kill();
        pin.kill();
        tl.kill();
        deck.removeAttribute("data-sns-3d");
        deck.removeAttribute("data-sns-settled");
        items.forEach((card) => {
          card.removeAttribute("data-sns-dealt");
          gsap.set(card, { clearProps: "all" });
        });
      };
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
        if (t >= 0.995) {
          deck.removeAttribute("data-sns-moving");
          // Once the fan is open the first time, a light passes over each card in turn.
          cards.forEach((card) => card.setAttribute("data-sns-dealt", ""));
        } else deck.setAttribute("data-sns-moving", "");
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
        cards.forEach((card) => card.removeAttribute("data-sns-dealt"));
        deck.style.removeProperty("--g");
        deck.style.removeProperty("--p");
      };
    });
    return () => mm.revert();
  }, []);
  return null;
}
