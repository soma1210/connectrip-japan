"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "../wd/gsap";
import styles from "./OurValueDeck.module.css";

/**
 * OUR VALUE · card deck (Human instruction 2026-11-22: after the Services page of
 * lxlcreative.co.uk). A pale cream stage with tilted, rounded cards in alternating
 * colours, each with a small inset photo, a heavy uppercase title, a short line and a
 * vermilion arrow.
 *
 * Wide screens, motion allowed: the stage stays pinned (CSS sticky) while the scroll
 * deals the cards in two hands of three. Each card flies up from below the frame with a
 * strong spin and lands in its tilted slot of a loose fan; the first hand is then thrown
 * off the top while the second is dealt into the same slots. Hovering a card straightens
 * and lifts it.
 * Phones: a single column of overlapping tilted cards, each one tossed in as it scrolls
 * into view. Reduced motion: the same column, no animation.
 */

export type OurValueCard = {
  title: string;
  description: string;
  image: { src: string; alt: string };
};

// One hand: all six cards are dealt by a single scroll (Human instruction 2026-11-22).
const HAND = 6;
// Resting pose of each slot on wide screens: 3 across × 2 down, loosely tilted
// (x in card widths, y in card heights, r in degrees).
const SLOTS = [
  { x: -1.04, y: -0.52, r: -3.5 },
  { x: 0, y: -0.6, r: 2.5 },
  { x: 1.04, y: -0.5, r: -2 },
  { x: -1.0, y: 0.54, r: 2.5 },
  { x: 0.04, y: 0.5, r: -3 },
  { x: 1.06, y: 0.56, r: 3.5 },
];
const SECOND_TILT = SLOTS.map((s) => -s.r);
// Resting tilt of each card in the phone column.
const PHONE_TILT = [-3, 2.5, -2, 3, -2.5, 2];
// Ice, wine, ink / blush, sage, ink: every card stands off the cream stage.
const THEMES = ["ice", "wine", "ink", "blush", "sage", "indigo"] as const;

export function OurValueDeck({
  id,
  heading,
  cards,
}: {
  id?: string;
  heading: string;
  cards: OurValueCard[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const hands = Math.max(1, Math.ceil(cards.length / HAND));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>("[data-ovd-card]")];
    const track = root.querySelector<HTMLElement>("[data-ovd-track]");
    if (!items.length || !track) return;

    const mm = gsap.matchMedia();

    // ---- Wide screens: pinned stage, scroll deals the hands. ----
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      root.setAttribute("data-deck", "");
      const cardW = () => items[0].offsetWidth;
      const cardH = () => items[0].offsetHeight;
      const vh = () => window.innerHeight;

      // Everything starts below the frame, spun.
      items.forEach((el, i) => {
        gsap.set(el, {
          xPercent: -50,
          yPercent: -50,
          x: () => SLOTS[i % HAND].x * cardW() * 0.6,
          y: () => vh() * 0.95,
          rotation: i % 2 ? 22 : -26,
          scale: 0.92,
        });
      });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.9,
          invalidateOnRefresh: true,
        },
      });

      for (let h = 0; h < hands; h++) {
        const hand = items.slice(h * HAND, h * HAND + HAND);
        const at = h * 2.2;
        if (h > 0) {
          // Throw the previous hand off the top.
          const prev = items.slice((h - 1) * HAND, h * HAND);
          prev.forEach((el, k) => {
            tl.to(
              el,
              {
                y: () => -vh() * 1.05,
                x: () => (SLOTS[k].x * 1.25 - 0.3) * cardW(),
                rotation: k % 2 ? -18 : 16,
                duration: 1,
                ease: "power2.in",
              },
              at - 0.6 + k * 0.12,
            );
          });
        }
        hand.forEach((el, k) => {
          const slot = SLOTS[k];
          tl.to(
            el,
            {
              x: () => slot.x * cardW(),
              y: () => slot.y * cardH() * 1.04,
              rotation: h % 2 ? SECOND_TILT[k] : slot.r,
              scale: 1,
              duration: 1,
            },
            at + k * 0.16,
          );
        });
      }
      tl.to({}, { duration: 0.6 }); // last hand rests before the pin releases

      return () => {
        root.removeAttribute("data-deck");
        gsap.set(items, { clearProps: "all" });
      };
    });

    // ---- Phones: each card is tossed into the column. ----
    mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
      items.forEach((el, i) => {
        gsap.from(el, {
          y: 140,
          x: i % 2 ? 50 : -50,
          rotation: i % 2 ? 16 : -16,
          opacity: 0,
          duration: 1.1,
          ease: "back.out(1.3)",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      });
      return () => gsap.set(items, { clearProps: "all" });
    });

    return () => mm.revert();
  }, [cards.length, hands]);

  return (
    <section
      ref={rootRef}
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={styles.section}
      style={{ "--hands": hands } as CSSProperties}
    >
      <div data-ovd-track="" className={styles.track}>
        <div className={styles.stage}>
          <svg className={styles.ribbon} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <path
              d="M520 -20C640 40 820 10 1040 0c90 120 -20 260 -60 400s20 300 220 300c140 0 220 -60 300 -130"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </svg>
          <header className={styles.head}>
            <h2 id={id ? `${id}-title` : undefined} className={styles.title}>
              {/* Classic + pop: the first word thin, the last bold (Human instruction 2026-11-22). */}
              {heading.includes(" ") ? (
                <>
                  <span className={styles.thin}>{heading.slice(0, heading.lastIndexOf(" "))}</span>{" "}
                  {heading.slice(heading.lastIndexOf(" ") + 1)}
                </>
              ) : (
                heading
              )}
            </h2>
            {/* The lead line and the 01–06 counter were removed (Human instruction 2026-11-22). */}
          </header>

          <ol className={styles.deck}>
            {cards.map((card, i) => (
              <li
                key={i}
                data-ovd-card=""
                className={styles.item}
                style={{ zIndex: i + 1, "--tilt": `${PHONE_TILT[i % PHONE_TILT.length]}deg` } as CSSProperties}
              >
                <article className={styles.card} data-theme-card={THEMES[i % THEMES.length]}>
                  <div className={styles.photo} style={{ "--ptilt": `${i % 2 ? 2 : -2.5}deg` } as CSSProperties}>
                    {card.image.src ? (
                      <Image
                        src={card.image.src}
                        alt={card.image.alt}
                        fill
                        sizes="(min-width: 768px) 200px, 50vw"
                        className={styles.img}
                      />
                    ) : null}
                  </div>
                  <div className={styles.body}>
                    <div className={styles.row}>
                      <h3 className={styles.cardTitle}>{card.title}</h3>
                      <span className={styles.arrow} aria-hidden>
                        <svg viewBox="0 0 28 16" width="28" height="16" fill="none">
                          <path d="M1 8h25M19 1.5 26 8l-7 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                    <p className={styles.desc}>{card.description}</p>
                  </div>
                  <span className={styles.num} aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
