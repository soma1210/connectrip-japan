import Image from "next/image";
import type { HomeContent } from "@/contracts";
import { HERO_MOSAIC_CENTER, heroMeta } from "../../assets/heroImages";
import { CtaLink } from "../CtaLink";
import { katomadoPath } from "./katomado";
import { AwardHeroMotion } from "./AwardHeroMotion";
import s from "./AwardHero.module.css";

/**
 * Award Home · Hero (2026-11-22, built from scratch).
 *
 * First screen: white paper. The headline is set huge and interrupted by a
 * katomado (temple window) in the middle: "Experience [window] Kansai", with
 * "Like a Local." below. Kansai scenes play inside the window; three small
 * photos float around it and follow the pointer at different depths.
 *
 * Scroll (pinned, AwardHeroMotion): the words part to both sides and the
 * window widens until Osaka Castle fills the screen, its camera easing back,
 * then the page moves on (the 3 × 3 mosaic was removed, Human instruction
 * 2026-11-22).
 */
const FLOATS = [1, 7, 9] as const;
const SLIDES = [0, 2, 4, 1, 5] as const;

export function AwardHero({ hero }: { hero: HomeContent["hero"] }) {
  const photos = hero.images.status === "TBD" ? [] : hero.images.value;
  const words = hero.headline.status === "TBD" ? [] : hero.headline.value.split(" ");
  // "Experience" | window | "Kansai" — then "Like a Local."
  const left = words[0] ?? "";
  const right = words[1] ?? "";
  const rest = words.slice(2).join(" ");
  const slides = SLIDES.map((i) => photos[i]).filter(Boolean);

  return (
    <section id="home-hero" data-header-tone="ink" aria-label={hero.headline.status === "TBD" ? "Hero" : hero.headline.value} className={s.hero}>
      {/* The window's shape, morphed by AwardHeroMotion (first paint: a centred window). */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <clipPath id="aw-hero-window" clipPathUnits="objectBoundingBox">
            <path data-hero-window d={katomadoPath({ cx: 0.5, w: 0.19, ys: 0.35, y1: 0.81 })} />
          </clipPath>
        </defs>
      </svg>

      <div data-hero-stage className={s.stage}>
        {/* The window: Osaka Castle, with Kansai scenes playing in it at the top; it opens to the full screen with the scroll. */}
        <div data-hero-frame className={s.frame}>
          <div data-hero-cam className={s.cam}>
            <Image src={HERO_MOSAIC_CENTER.src} alt={HERO_MOSAIC_CENTER.alt} fill priority sizes="100vw" className="object-cover" style={{ objectPosition: HERO_MOSAIC_CENTER.focus }} />
            {slides.map((p, j) => (
              <div key={p.src} data-hero-slide={j} className={s.slide} aria-hidden>
                <Image src={p.src} alt="" fill sizes="60vw" className="object-cover" style={{ objectPosition: heroMeta(p.src)?.focus }} />
              </div>
            ))}
          </div>
          <div data-hero-shade aria-hidden className={s.shade} />
          {/* A band of light passes across the window now and then. */}
          <div aria-hidden className={s.sheen} />
        </div>

        {/* Small photos floating around the window (pointer parallax). */}
        {FLOATS.map((i, k) =>
          photos[i] ? (
            <div key={photos[i].src} data-hero-float={k} className={`${s.float} ${s[`float${k}`]}`} aria-hidden>
              <Image src={photos[i].src} alt="" fill sizes="14vw" className="object-cover" style={{ objectPosition: heroMeta(photos[i].src)?.focus }} />
            </div>
          ) : null,
        )}

        {/* The headline, interrupted by the window. */}
        <div className={s.type} aria-hidden>
          <span data-hero-word="left" className={s.wordLeft}>
            <span className={s.mask}>
              <span data-hero-rise>{left}</span>
            </span>
          </span>
          <span data-hero-word="right" className={s.wordRight}>
            <span className={s.mask}>
              <span data-hero-rise>{right}</span>
            </span>
          </span>
          <span data-hero-word="rest" className={s.wordRest}>
            <span className={s.mask}>
              <span data-hero-rise>{rest}</span>
            </span>
          </span>
        </div>
        <h1 className="sr-only">{hero.headline.status === "TBD" ? "" : hero.headline.value}</h1>

        {/* Place of the scene in the window, under it. */}
        <p data-hero-place className={s.place} aria-live="off">
          <span data-hero-place-text>{heroMeta(photos[SLIDES[0]]?.src ?? "")?.location ?? ""}</span>
        </p>

        <div data-hero-ctas className={s.ctas}>
          <CtaLink cta={hero.primaryCta} pair />
          {hero.secondaryCta ? <CtaLink cta={hero.secondaryCta} pair /> : null}
        </div>

      </div>
      <AwardHeroMotion targetId="home-hero" places={slides.map((p) => heroMeta(p.src)?.location ?? "")} />
    </section>
  );
}
