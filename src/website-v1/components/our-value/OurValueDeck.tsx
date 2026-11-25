"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap, MQ_DESKTOP_MOTION, MQ_MOTION } from "../wd/gsap";
import styles from "./OurValueDeck.module.css";

/**
 * OUR VALUE · photo bento (Human instruction 2026-11-25: the pinned index took six
 * scrolls; the slide must pass in about two scrolls and show all six values at once, at a
 * very high finish).
 *
 * One screen, no pin. Wide screens: the heading block holds the left column; the six
 * values are photo tiles, three across and two down, each with its number, title and line
 * always readable on a deep shade at the foot of the photo. Tablets: heading on top, tiles
 * 3 × 2. Phones: tiles 2 × 3.
 *
 * Motion (none with reduced motion, and everything is visible without JavaScript):
 * - as the slide arrives, the heading rises, its gold rule draws, and the tiles wipe up one
 *   after another while their photos settle from a slow zoom and the words follow;
 * - wide screens: the photos drift gently against the scroll (parallax) — this adds no
 *   scroll length;
 * - hover: the photo leans in, a gold passe-partout appears and a gold line draws under
 *   the title.
 * Earlier versions (card deck, editorial index) are kept in .claude/backups.
 */

export type OurValueCard = {
  title: string;
  description: string;
  image: { src: string; alt: string };
};

export function OurValueDeck({
  id,
  heading,
  supporting,
  cards,
}: {
  id?: string;
  heading: string;
  /** One line under the heading ("Discover six reasons…"). */
  supporting?: string;
  cards: OurValueCard[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const last = String(cards.length).padStart(2, "0");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends Element>(sel: string) => [...root.querySelectorAll<T>(sel)];
    const tiles = q<HTMLElement>("[data-ov-tile]");
    if (!tiles.length) return;

    const mm = gsap.matchMedia();

    // ---- Arrival (any screen, motion allowed): plays once, adds no scroll length. ----
    mm.add(MQ_MOTION, () => {
      const head = q<HTMLElement>("[data-ov-rise]");
      const rule = q<HTMLElement>("[data-ov-rule]");
      const zooms = q<HTMLElement>("[data-ov-zoom]");
      const copies = q<HTMLElement>("[data-ov-copy]");
      const nums = q<HTMLElement>("[data-ov-num]");

      gsap.set(head, { yPercent: 60, autoAlpha: 0 });
      gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(tiles, { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(zooms, { scale: 1.32 });
      gsap.set([...copies, ...nums], { y: 22, autoAlpha: 0 });

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power4.out" },
      });
      tl.to(head, { yPercent: 0, autoAlpha: 1, duration: 1.1, stagger: 0.12 }, 0)
        .to(rule, { scaleX: 1, duration: 1.2, ease: "power3.inOut" }, 0.25)
        .to(tiles, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.25, ease: "expo.inOut", stagger: 0.09 }, 0.15)
        .to(zooms, { scale: 1, duration: 2, ease: "power3.out", stagger: 0.09 }, 0.35)
        .to(nums, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.09 }, 0.85)
        .to(copies, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.09 }, 0.95);

      const st = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 72%", once: true, onEnter: () => tl.play() },
      });

      return () => {
        st.scrollTrigger?.kill();
        st.kill();
        tl.kill();
        gsap.set([...head, ...rule, ...tiles, ...zooms, ...copies, ...nums], { clearProps: "all" });
      };
    });

    // ---- Wide screens: the photos drift against the scroll. ----
    mm.add(MQ_DESKTOP_MOTION, () => {
      const layers = q<HTMLElement>("[data-ov-px]");
      const tweens = layers.map((el, i) =>
        gsap.fromTo(
          el,
          { yPercent: -5 - (i % 3) * 1.5 },
          {
            yPercent: 5 + (i % 3) * 1.5,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        ),
      );
      return () => {
        tweens.forEach((t) => {
          t.scrollTrigger?.kill();
          t.kill();
        });
        gsap.set(layers, { clearProps: "all" });
      };
    });

    return () => mm.revert();
  }, [cards.length]);

  return (
    <section ref={rootRef} id={id} aria-labelledby={id ? `${id}-title` : undefined} className={styles.section}>
      <div className={styles.grid}>
        <header className={styles.head}>
          <div className={styles.headTop}>
            <h2 id={id ? `${id}-title` : undefined} className={styles.title}>
              {/* As the Featured Tour title: the lead word(s) in gold. */}
              {heading.includes(" ") ? (
                <>
                  <span data-ov-rise="" className={styles.titleLine}>
                    <span className={styles.gold}>{heading.slice(0, heading.lastIndexOf(" "))}</span>
                  </span>{" "}
                  <span data-ov-rise="" className={styles.titleLine}>
                    {heading.slice(heading.lastIndexOf(" ") + 1)}
                  </span>
                </>
              ) : (
                <span data-ov-rise="" className={styles.titleLine}>
                  {heading}
                </span>
              )}
            </h2>
            <span data-ov-rule="" className={styles.rule} aria-hidden />
            {supporting ? (
              <p data-ov-rise="" className={styles.lead}>
                {supporting}
              </p>
            ) : null}
          </div>
          <div className={styles.headFoot}>
            <p data-ov-rise="" className={styles.range} aria-hidden>
              <span>01</span>
              <span className={styles.rangeRule} />
              <span>{last}</span>
            </p>
          </div>
        </header>

        <ol className={styles.tiles}>
          {cards.map((card, i) => (
            <li key={i} className={styles.cell} style={{ "--i": i } as CSSProperties}>
              <article data-ov-tile="" className={styles.tile}>
                <div className={styles.media}>
                  <div data-ov-px="" className={styles.px}>
                    <div data-ov-zoom="" className={styles.zoom}>
                      {card.image.src ? (
                        <Image
                          src={card.image.src}
                          alt={card.image.alt}
                          fill
                          sizes="(min-width: 1100px) 26vw, (min-width: 768px) 33vw, 50vw"
                          className={styles.img}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
                <span className={styles.shade} aria-hidden />
                <span className={styles.passe} aria-hidden />
                <span data-ov-num="" className={styles.num} aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                  <span className={styles.numRule} />
                </span>
                <div data-ov-copy="" className={styles.copy}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <span className={styles.line} aria-hidden />
                  <p className={styles.desc}>{card.description}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
