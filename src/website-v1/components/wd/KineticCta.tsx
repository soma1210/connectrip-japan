"use client";

import { useEffect, useRef } from "react";
import { gsap, MQ_MOTION } from "./gsap";

/**
 * Kinetic heading for the closing scene: the heading's words are set very
 * large on their own staggered lines and slide in from alternating sides with
 * the scroll, leaning into their motion, then settle (Noxediem-style footer
 * type). Same words in the same order; the h2 carries the full text for
 * screen readers.
 */
export function KineticCta({ text, className = "" }: { text: string; className?: string }) {
  const root = useRef<HTMLHeadingElement>(null);
  const words = text.split(" ");
  // Two or three words per line, so the lines stay big but readable.
  const lines: string[][] = [];
  for (let i = 0; i < words.length; ) {
    const take = words[i].length > 7 ? 1 : 2;
    lines.push(words.slice(i, i + take));
    i += take;
  }

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const rows = el.querySelectorAll<HTMLElement>("[data-k-row]");
    const mm = gsap.matchMedia();
    mm.add(MQ_MOTION, () => {
      rows.forEach((row, i) => {
        const from = i % 2 ? 1 : -1;
        gsap.fromTo(
          row,
          { xPercent: from * 70, skewX: from * -14, autoAlpha: 0 },
          {
            xPercent: 0,
            skewX: 0,
            autoAlpha: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: `top ${92 - i * 4}%`, end: "top 35%", scrub: 0.6 },
          },
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <h2 ref={root} aria-label={text} className={className}>
      {lines.map((line, i) => (
        <span key={i} data-k-row aria-hidden className={`block whitespace-nowrap ${i % 2 ? "md:pl-[12%]" : "md:pr-[12%]"}`}>
          {line.join(" ")}
        </span>
      ))}
    </h2>
  );
}
