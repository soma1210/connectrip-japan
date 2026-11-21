"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import styles from "./OurValueCinematicSection.module.css";

/**
 * OUR VALUE · Cinematic Section (Human instruction 2026-11-15). A 1:1 port of the approved
 * stand-alone prototype (prototypes/our-value-cinematic).
 *
 * Wide screens (≥768 px, motion allowed): the stage is pinned with CSS `position: sticky` and
 * the scroll position inside the section drives a continuous deck position `p` (0 = card 01 in
 * front … N-1 = last card in front). Each frame places every card from its distance to the
 * front (d = i - p):
 *   d < 0   leaving: lifts up out of the frame with a slight clockwise tilt
 *   0..1    next in line: waits just below and behind, rises and grows into place
 *   1..2    further back: a thin edge of the stack, fading out
 * Phones and reduced motion: a plain list, each card rising once as it scrolls in.
 *
 * Self-contained: no library, no shared motion state. It does not use the Home reveal
 * attributes (`data-reveal-*`), so RevealObserver never touches it. Everything it adds
 * (listeners, observers, rAF, inline styles) is removed on unmount, so a remount in Strict
 * Mode or after client navigation starts clean.
 */

export type OurValueCard = {
  title: string;
  description: string;
  image: { src: string; alt: string };
};

const START_HOLD = 0.3; // the first card rests a moment after the pin starts
const END_HOLD = 0.9; // the last card stays readable before the pin releases
const DWELL = 0.12; // share of each step (each end) where the card rests in place
const SMOOTH = 0.085; // seconds; scrub smoothing (like a short GSAP scrub)
const PINNED_QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

export function OurValueCinematicSection({
  id,
  heading,
  lead,
  cards,
}: {
  id?: string;
  heading: string;
  lead?: string;
  cards: OurValueCard[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const n = cards.length;
  const steps = Math.max(0, n - 1);
  const units = START_HOLD + steps + END_HOLD;
  const total = String(n).padStart(2, "0");
  // "OUR VALUE" → two lines, each rising out of its own mask.
  const lines = heading.trim().split(/\s+/);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!section || !track || !stage || n === 0 || typeof IntersectionObserver === "undefined") return;

    const items = [...section.querySelectorAll<HTMLElement>("[data-ov-card]")];
    const shades = items.map((el) => el.querySelector<HTMLElement>("[data-ov-shade]"));
    const reel = reelRef.current;
    const bar = barRef.current;
    const pinnedQuery = window.matchMedia(PINNED_QUERY);

    let pinned = false;
    let target = 0;
    let current = 0;
    let rafId = 0;
    let lastTime = 0;
    let trackTop = 0;
    let range = 1;
    let cardH = 0;
    let exitDist = 0;
    let settleTimer = 0;

    // ---- Entrance (both modes) ----
    // Already on screen when the effect runs (reload, back, #value): show at once, no animation.
    const alreadyIn = section.getBoundingClientRect().top < window.innerHeight * 0.7;
    if (alreadyIn) {
      section.setAttribute("data-in", "");
      section.setAttribute("data-settled", "");
      items.forEach((el) => el.setAttribute("data-in", ""));
    }
    section.setAttribute("data-armed", "");

    const introObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        section.setAttribute("data-in", "");
        introObserver.disconnect();
        // After the deck entrance, drop the card transition so scrolling never lags behind it.
        settleTimer = window.setTimeout(() => section.setAttribute("data-settled", ""), 1700);
      },
      { threshold: 0, rootMargin: "0px 0px -30% 0px" },
    );
    if (!alreadyIn) introObserver.observe(section);

    // List mode: each card rises once when it scrolls in.
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-in", "");
          cardObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    // ---- Pinned deck ----
    const measure = () => {
      const rect = track.getBoundingClientRect();
      trackTop = rect.top + window.scrollY;
      range = Math.max(1, track.offsetHeight - stage.offsetHeight);
      cardH = items[0].offsetHeight; // layout size; transforms do not change it
      // Far enough that a leaving card (with its tilt) has fully cleared the top of the stage.
      exitDist = stage.offsetHeight / 2 + cardH * 0.62 + 40;
    };

    const readTarget = () => {
      const u = clamp((window.scrollY - trackTop) / range, 0, 1) * units - START_HOLD;
      if (u <= 0) return 0;
      if (u >= steps) return steps;
      const k = Math.floor(u);
      const f = clamp((u - k - DWELL) / (1 - DWELL * 2), 0, 1);
      return k + easeInOut(f);
    };

    const render = (p: number) => {
      const peek = cardH * 0.075;
      for (let i = 0; i < n; i++) {
        const d = i - p;
        let y = 0;
        let s = 1;
        let r = 0;
        let shade = 0;
        let visible = true;
        if (d < 0) {
          // Leaving: up and out, a little tilt as it goes.
          const t = Math.min(-d, 1);
          y = -t * exitDist;
          r = t * 4.5;
          visible = -d < 1;
        } else if (d <= 1) {
          // Next in line: rises from just below and behind.
          y = d * peek;
          s = 1 - d * 0.06;
          shade = d * 0.45;
        } else {
          // Further back: only an edge of the stack shows, then nothing.
          const b = Math.min(d - 1, 1);
          y = peek + b * peek * 0.75;
          s = 0.94 - b * 0.045;
          shade = 0.45 + b * 0.3;
          visible = d < 2.6;
        }
        const el = items[i];
        el.style.transform = `translate3d(0,${y.toFixed(2)}px,0) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;
        el.style.visibility = visible ? "" : "hidden";
        const sh = shades[i];
        if (sh) sh.style.opacity = shade.toFixed(3);
      }
      if (reel) reel.style.transform = `translate3d(0,${(-(p / n) * 100).toFixed(3)}%,0)`;
      if (bar) bar.style.transform = `scaleX(${((p + 1) / n).toFixed(4)})`;
      section.setAttribute("data-active", String(Math.round(p) + 1));
    };

    const tick = (now: number) => {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
      lastTime = now;
      const diff = target - current;
      if (Math.abs(diff) < 0.0005) {
        current = target;
        render(current);
        rafId = 0;
        lastTime = 0;
        return;
      }
      current += diff * (1 - Math.exp(-dt / SMOOTH));
      render(current);
      rafId = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (!pinned) return;
      target = readTarget();
      if (!rafId) rafId = window.requestAnimationFrame(tick);
    };

    const onResize = () => {
      if (!pinned) return;
      measure();
      target = readTarget();
      current = target;
      render(current);
    };

    const clearInline = () => {
      items.forEach((el, i) => {
        el.style.transform = "";
        el.style.visibility = "";
        const sh = shades[i];
        if (sh) sh.style.opacity = "";
      });
      if (reel) reel.style.transform = "";
      if (bar) bar.style.transform = "";
      section.removeAttribute("data-active");
    };

    const setMode = () => {
      pinned = pinnedQuery.matches;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      lastTime = 0;
      if (pinned) {
        cardObserver.disconnect();
        items.forEach((el) => {
          el.setAttribute("data-in", "");
          // The whole stack is on screen; avoid a late decode mid-scroll.
          const img = el.querySelector("img");
          if (img) img.loading = "eager";
        });
        measure();
        target = readTarget();
        current = target; // start where the page is (reload / back), no catch-up animation
        render(current);
      } else {
        clearInline();
        items.forEach((el) => {
          if (!el.hasAttribute("data-in")) cardObserver.observe(el);
        });
      }
    };

    // Layout above the section can change after mount (fonts, images, other sections' content).
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onResize);
    resizeObserver?.observe(document.body);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    pinnedQuery.addEventListener("change", setMode);
    setMode();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      pinnedQuery.removeEventListener("change", setMode);
      resizeObserver?.disconnect();
      introObserver.disconnect();
      cardObserver.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer);
      clearInline();
      section.removeAttribute("data-armed");
      section.removeAttribute("data-in");
      section.removeAttribute("data-settled");
      items.forEach((el) => el.removeAttribute("data-in"));
    };
  }, [n, steps, units]);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={styles.section}
      style={{ "--units": units } as CSSProperties}
    >
      <div ref={trackRef} className={styles.track}>
        <div ref={stageRef} className={styles.stage}>
          <div className={styles.intro}>
            <span className={styles.rule} aria-hidden />
            <h2 id={id ? `${id}-title` : undefined} className={styles.title}>
              {lines.map((line, i) => (
                <span key={i} className={styles.line}>
                  <span>{line}</span>
                </span>
              ))}
            </h2>
            {lead ? <p data-wd-highlight className={styles.lead}>{lead}</p> : null}
            <div className={styles.counter} aria-hidden>
              <span className={styles.reelWindow}>
                <span ref={reelRef} className={styles.reel}>
                  {cards.map((_, i) => (
                    <span key={i}>{String(i + 1).padStart(2, "0")}</span>
                  ))}
                </span>
              </span>
              <span className={styles.total}>/ {total}</span>
            </div>
            <div className={styles.progress} aria-hidden>
              <span ref={barRef} className={styles.bar} />
            </div>
          </div>

          <div className={styles.deck}>
            <ol className={styles.cards}>
              {cards.map((card, i) => (
                // Card 01 in front, the rest stacked behind in order (only matters in the pinned deck).
                <li key={i} data-ov-card="" className={styles.item} style={{ zIndex: n - i }}>
                  <article className={styles.card}>
                    {card.image.src ? (
                      <Image
                        src={card.image.src}
                        alt={card.image.alt}
                        fill
                        sizes="(min-width: 1440px) 780px, (min-width: 768px) 55vw, 100vw"
                        loading={i < 2 ? "eager" : "lazy"}
                        className={styles.photo}
                      />
                    ) : null}
                    <span className={styles.grad} aria-hidden />
                    <div className={styles.text}>
                      <p className={styles.num}>{String(i + 1).padStart(2, "0")}</p>
                      <h3 className={styles.cardTitle}>{card.title}</h3>
                      <p className={styles.desc}>{card.description}</p>
                    </div>
                    <span className={styles.shade} aria-hidden data-ov-shade="" />
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
