"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { OPENING_ATTR } from "../opening/openingBoot";
import styles from "./CinematicHero.module.css";
import { heroDirection, moveVars, type HeroArrival } from "./heroDirection";

export type HeroSlide = { src: string; alt: string; focus?: string; focusMobile?: string; location: string };

/** One motion timeline: a scene arrives (1.5 s), is held, then the next arrives over it. */
const TRANSITION_MS = 1500;
const HOLD_MS = 5500;
/** After a pause, never switch sooner than this. */
const MIN_RESUME_MS = 1200;
const SWIPE_MIN_PX = 48;

/** A photo layer. Layers stack: a new scene is added on top and the ones below are dropped once it has arrived. */
type Layer = { id: number; index: number; arrival: HeroArrival | "none" };

const openingActive = () => ["pending", "play", "reduced", "reduced-out"].includes(document.documentElement.getAttribute(OPENING_ATTR) ?? "");

/**
 * Twelve-scene cinematic slider for the Home Hero: photo layers, the location
 * label and a small pause button. The headline and CTAs are server HTML in
 * HomeView and never move.
 *
 * - Loading: only the scene on screen is loaded at first; the next and the
 *   previous one are fetched shortly after the start (hidden), so an arrival
 *   never shows an empty frame.
 * - Rotation waits for the Opening overlay, stops while the Hero is off screen
 *   or the tab is hidden, and can be paused (which also freezes the camera).
 * - ← / → keys and a horizontal swipe change scenes. A change during a
 *   transition is safe: the new scene is laid over whatever is showing.
 */
export function CinematicHeroSlider({ slides, heroId }: { slides: HeroSlide[]; heroId: string }) {
  const count = slides.length;
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, index: 0, arrival: "none" }]);
  /** False while the Opening overlay is up: scene 1 is held still and nothing rotates. */
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(true);
  /** Held while the Home mosaic has pulled the camera back (HeroMosaicMotion sends hero:hold / hero:release). */
  const [holding, setHolding] = useState(false);
  const [preload, setPreload] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const seq = useRef(0);
  const settle = useRef(0);
  /** Time the scene on top (layer id) has been on screen so far, kept across pauses. */
  const held = useRef({ id: 0, ms: 0 });

  const top = layers[layers.length - 1];
  const index = top.index;
  const topId = top.id;

  const go = useCallback(
    (to: number, arrival: HeroArrival) => {
      if (count < 2) return;
      const target = ((to % count) + count) % count;
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      setLayers((current) => {
        if (current[current.length - 1].index === target) return current;
        // Keep at most the two newest layers under the new one: enough to cover the frame, bounded when keys are held down.
        return [...current.slice(-2), { id: ++seq.current, index: target, arrival: mobile ? "crossfade" : arrival }];
      });
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => setLayers((current) => current.slice(-1)), TRANSITION_MS + 100);
    },
    [count],
  );
  const next = useCallback(() => go(index + 1, heroDirection(slides[index].src).next), [go, slides, index]);
  const prev = useCallback(() => go(index - 1, "crossfade"), [go, index]);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  // Start with the end of the Opening overlay (or at once when it does not play); respect reduced motion.
  useEffect(() => {
    const begin = () => {
      setStarted(true);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
    };
    if (!openingActive()) {
      begin();
      return;
    }
    const observer = new MutationObserver(() => {
      if (!openingActive()) {
        observer.disconnect();
        begin();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [OPENING_ATTR] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const id = window.setTimeout(() => setPreload(true), 1200);
    return () => window.clearTimeout(id);
  }, [started]);

  // Crop focus follows the screen shape: portrait screens (phones, upright tablets) use the narrow focus.
  useEffect(() => {
    const query = window.matchMedia("(max-aspect-ratio: 1/1)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Hero on screen? Horizontal swipe on the Hero.
  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    io.observe(hero);
    let x = 0;
    let y = 0;
    const onStart = (e: TouchEvent) => {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x;
      const dy = e.changedTouches[0].clientY - y;
      // Clearly horizontal only, so vertical page scrolling is never taken over.
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      hero.dispatchEvent(new CustomEvent(dx < 0 ? "hero:next" : "hero:prev"));
    };
    hero.addEventListener("touchstart", onStart, { passive: true });
    hero.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      io.disconnect();
      hero.removeEventListener("touchstart", onStart);
      hero.removeEventListener("touchend", onEnd);
    };
  }, [heroId]);

  // Swipe events and ← / → (while the Hero is on screen and no field is being typed in).
  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;
    const onKey = (e: KeyboardEvent) => {
      if (!inView || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    const hold = () => setHolding(true);
    const release = () => setHolding(false);
    hero.addEventListener("hero:next", next);
    hero.addEventListener("hero:prev", prev);
    hero.addEventListener("hero:hold", hold);
    hero.addEventListener("hero:release", release);
    window.addEventListener("keydown", onKey);
    return () => {
      hero.removeEventListener("hero:next", next);
      hero.removeEventListener("hero:prev", prev);
      hero.removeEventListener("hero:hold", hold);
      hero.removeEventListener("hero:release", release);
      window.removeEventListener("keydown", onKey);
    };
  }, [heroId, inView, next, prev]);

  // Rotation. One timer per scene; a pause keeps the time already held, so the camera (frozen by CSS) and the timer resume together.
  useEffect(() => {
    if (!started || !playing || !inView || holding || count < 2) return;
    let id = 0;
    let since = 0;
    if (held.current.id !== topId) held.current = { id: topId, ms: 0 };
    const arm = () => {
      window.clearTimeout(id);
      if (document.hidden) return;
      since = performance.now();
      const total = TRANSITION_MS + HOLD_MS;
      id = window.setTimeout(next, Math.max(MIN_RESUME_MS, total - held.current.ms));
    };
    const disarm = () => {
      if (since && held.current.id === topId) held.current.ms += performance.now() - since;
      since = 0;
      window.clearTimeout(id);
    };
    const onVisibility = () => (document.hidden ? disarm() : arm());
    arm();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disarm();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [started, playing, inView, holding, count, next, topId]);

  const running = started && playing && inView && !holding;
  const neighbours = preload ? [(index + 1) % count, (index - 1 + count) % count].filter((i) => !layers.some((l) => l.index === i)) : [];
  const focusOf = (slide: HeroSlide) => (narrow ? (slide.focusMobile ?? slide.focus) : slide.focus);

  return (
    <>
      {/* Layers: parallax (scroll) > layer (arrival) > shift (depth) > motion (camera) > photo. */}
      <div className={cn(`absolute inset-x-0 -top-[4%] -bottom-[12%] -z-10 ${styles.parallax}`, started && !running && styles.paused)}>
        {layers.map((layer, depth) => {
          const slide = slides[layer.index];
          const direction = heroDirection(slide.src);
          const isTop = depth === layers.length - 1;
          return (
            <div
              key={layer.id}
              aria-hidden={!isTop}
              style={{ zIndex: depth + 1 }}
              className={cn(styles.layer, layer.arrival !== "none" && styles[layer.arrival], started && styles.rolling)}
            >
              <div className={styles.shift}>
                <div
                  className={styles.motion}
                  style={{ ...moveVars(direction), transformOrigin: `${direction.origin[0]}% ${direction.origin[1]}%` } as CSSProperties}
                >
                  <Image
                    src={slide.src}
                    alt={isTop ? slide.alt : ""}
                    fill
                    sizes="100vw"
                    quality={85}
                    priority={layer.id === 0}
                    loading={layer.id === 0 ? undefined : "eager"}
                    className="object-cover"
                    style={{ objectPosition: focusOf(slide) }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {/* Next / previous scene, fetched ahead and kept invisible. */}
        {neighbours.map((i) => (
          <div key={`preload-${slides[i].src}`} className={styles.preload} aria-hidden>
            <Image src={slides[i].src} alt="" fill sizes="100vw" quality={85} loading="eager" className="object-cover" />
          </div>
        ))}
      </div>

      {/* Bottom right: the location of the photo on screen, and a quiet pause / play button. */}
      {count > 1 ? (
        <div data-hero-label className="pointer-events-none absolute inset-x-0 bottom-4 z-10 mx-auto flex w-full max-w-(--container-app) items-center justify-end gap-3 px-5 md:bottom-7 md:px-12">
          <p className="font-heading-en text-[11px] tracking-[0.38em] text-cream/75 md:text-xs" aria-live={playing ? "off" : "polite"}>
            <span key={top.id} className={styles.label}>
              {slides[index].location}
            </span>
            <span className="sr-only">: {slides[index].alt}</span>
          </p>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause background photos" : "Play background photos"}
            aria-pressed={!playing}
            className="pointer-events-auto -mr-2.5 inline-flex h-11 w-11 items-center justify-center text-cream/55 transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-gold"
          >
            {playing ? <Pause className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> : <Play className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
          </button>
        </div>
      ) : null}
    </>
  );
}
