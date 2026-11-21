import Image from "next/image";
import type { CSSProperties } from "react";
import type { Prefecture } from "../../content/prefectures";
import { PrefectureMotion } from "./PrefectureMotion";

/**
 * Kansai prefectures scene (Human instruction 2026-11-15, from a screen
 * recording of therealhotels.com): a tall column of prefecture names glides
 * up through the middle of a held screen; the name at the centre lights up
 * (with its Japanese name), the others fade with their distance. Three large
 * photos of the current prefecture frame it — one tall on the left, two on
 * the right — and are replaced by the next prefecture's photos with a rising
 * curtain as its name reaches the centre. Larger photos than the reference.
 * Phones: the left photo becomes the full-screen background behind the names.
 * Data: content/prefectures.ts.
 */
const SLOTS = [
  // left (tall), right top, right bottom
  "max-md:inset-0 md:left-[4vw] md:top-1/2 md:h-[min(70svh,46rem)] md:w-[27vw] md:-translate-y-1/2 md:[clip-path:url(#aw-kato)]",
  "max-md:hidden md:right-[3.5vw] md:top-[11svh] md:h-[34svh] md:w-[24vw]",
  "max-md:hidden md:right-[9vw] md:bottom-[9svh] md:h-[30svh] md:w-[19vw]",
] as const;

export function PrefectureScene({ id, prefectures }: { id: string; prefectures: Prefecture[] }) {
  const n = prefectures.length;
  return (
    <section id={id} aria-label="The prefectures of Kansai" className="relative bg-navy-dark" style={{ height: `${100 + n * 60}svh` } as CSSProperties}>
      <div data-pf-stage className="sticky top-0 isolate h-svh overflow-hidden" style={{ backgroundColor: prefectures[0]?.tint }}>
        {SLOTS.map((slot, s) => (
          <div key={s} data-pf-slot={s} data-ripple className={`wd-skew absolute isolate z-[1] overflow-hidden md:rounded-[4px] ${slot}`}>
            {prefectures.map((p, i) => (
              <div key={p.key} data-pf-photo={i} className="absolute inset-0 invisible data-[on]:visible">
                <div data-pf-cam className="absolute inset-0">
                  <Image
                    src={p.photos[s].src}
                    alt={s === 0 ? p.photos[s].alt : ""}
                    fill
                    sizes={s === 0 ? "(min-width: 768px) 28vw, 100vw" : "(min-width: 768px) 25vw, 1px"}
                    className="object-cover"
                    style={{ objectPosition: p.photos[s].focus }}
                  />
                </div>
              </div>
            ))}
            {/* Phones: the photo is a background; a veil keeps the names readable. */}
            {s === 0 ? <div aria-hidden className="absolute inset-0 z-[999] bg-navy-dark/55 md:hidden" /> : null}
          </div>
        ))}

        {/* The prefecture's name in kanji, vertical and huge, glowing faintly behind everything. */}
        {prefectures.map((p, i) => (
          <span
            key={`k-${p.key}`}
            data-pf-watermark={i}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -z-0 -translate-x-1/2 -translate-y-1/2 font-heading-jp text-[min(20vh,15vw)] leading-[1] font-bold tracking-[0.04em] whitespace-nowrap text-white/[0.07] opacity-0 [writing-mode:vertical-rl]"
          >
            {p.kanji}
          </span>
        ))}

        <p className="absolute top-[7svh] left-1/2 -translate-x-1/2 font-heading-en text-[11px] tracking-[0.34em] whitespace-nowrap text-gold uppercase md:text-xs">
          The prefectures of Kansai
        </p>

        {/* The names: a column that glides up through the centre line. */}
        <div className="absolute inset-x-0 top-[12svh] bottom-[12svh] z-[2] overflow-hidden [mask-image:linear-gradient(transparent,#000_22%,#000_78%,transparent)] md:inset-x-[31vw]">
          <ol data-pf-list className="absolute inset-x-0 top-1/2 will-change-transform">
            {prefectures.map((p, i) => (
              <li key={p.key} data-pf-name={i} className="flex h-[1.25em] items-center justify-center gap-[0.18em] font-heading-en text-[clamp(3rem,13vw,4.4rem)] leading-none whitespace-nowrap text-cream will-change-[opacity,transform] md:text-[clamp(3.4rem,6.4vw,7.4rem)]">
                <span>{p.name}</span>
                <span data-pf-kanji className="font-heading-jp text-[0.2em] leading-[1.1] tracking-[0.2em] text-gold opacity-0 [writing-mode:vertical-rl]">
                  {p.kanji}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p aria-hidden className="absolute bottom-[6svh] left-1/2 -translate-x-1/2 font-heading-en text-xs tracking-[0.3em] text-cream/60">
          <span data-pf-count>01</span> / {String(n).padStart(2, "0")}
        </p>
      </div>
      <PrefectureMotion targetId={id} count={n} tints={prefectures.map((p) => p.tint)} />
    </section>
  );
}
