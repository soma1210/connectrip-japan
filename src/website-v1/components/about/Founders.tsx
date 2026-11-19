"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FOUNDERS_PHOTO } from "../../content/officers";

/**
 * About Us: the founders (2026-11-16). One photo of both founders, as
 * supplied (not cropped), with their names underneath in photo order (left,
 * right). Navy, a gold hairline frame, no card background.
 *
 * Motion: the photo rises and fades in when it comes into view, the names
 * follow. Very light zoom on hover, only with a fine pointer. Reduced motion:
 * shown at once, no zoom. `data-wd-skip` keeps the page-wide motion layer
 * (curtain + drift on photos) off this photo.
 */
export function Founders({ photo }: { photo: typeof FOUNDERS_PHOTO }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // IntersectionObserver is in every browser v1 supports (same assumption as the lazy map).
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const rise = "transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none";
  const state = shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0";

  return (
    <figure ref={ref} data-wd-skip className="group mx-auto w-full max-w-[19rem] sm:max-w-[22rem] md:max-w-[26rem]">
      <div className={`${rise} ${state}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-navy-light">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            loading="lazy"
            sizes="(min-width: 768px) 416px, (min-width: 640px) 352px, 304px"
            className="object-cover transition-[scale] duration-[1400ms] ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-gold/20 ring-inset" />
        </div>
      </div>
      {/* Names in photo order: left, right. */}
      <figcaption className={`mt-6 grid grid-cols-2 gap-4 ${rise} ${state}`} style={{ transitionDelay: "250ms" }}>
        {photo.names.map((name, i) => (
          <p key={name} className={`font-heading-en text-base tracking-[0.08em] text-cream md:text-lg ${i === 0 ? "text-left" : "text-right"}`}>
            {name}
          </p>
        ))}
      </figcaption>
    </figure>
  );
}
