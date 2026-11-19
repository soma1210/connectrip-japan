"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { exploreUpdatesHref } from "../../routes";
import { gsap, MQ_MOTION } from "../wd/gsap";
import { cn } from "@/lib/cn";
import type {
  ExploreNewsCard,
  ExploreSlideCard,
  getExploreHomeSlides,
} from "../../content/explore/home";
import s from "./ExploreKansaiSlides.module.css";

type Data = ReturnType<typeof getExploreHomeSlides>;

/**
 * Home "Explore Kansai" as two cinematic slides (2-Slide Redesign V1,
 * 2026-11-15): Connectrip Japan Select (floating cards) and Kansai Travel
 * Updates (glass cards on a horizontal rail).
 *
 * Scrolling is never taken over. One background stage stays pinned
 * (position: sticky) behind both slides, and its two photos cross-fade as
 * the second slide comes up (--mix, from one passive scroll listener). The
 * slides' content is ordinary page flow: links are crawlable, and touch
 * scrolling stays native.
 */
export function ExploreKansaiSlides({
  data,
  id = "explore-kansai",
}: {
  data: Data;
  id?: string;
}) {
  const root = useRef<HTMLElement>(null);
  const second = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const two = second.current;
    if (!el || !two || typeof IntersectionObserver === "undefined") return;

    // Entrance: arm (hide) only what is still below the screen, then reveal each slide once.
    const slides = [...el.querySelectorAll<HTMLElement>("[data-slide]")];
    slides.forEach((sl) => {
      if (sl.getBoundingClientRect().top < innerHeight * 0.8)
        sl.setAttribute("data-in", "");
    });
    el.classList.add(s.armed);
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute("data-in", "");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -22% 0px" },
    );
    slides
      .filter((sl) => !sl.hasAttribute("data-in"))
      .forEach((sl) => io.observe(sl));

    // Background cross-fade: 0 while slide 2 is below the screen, 1 once its top reaches the upper third.
    let raf = 0;
    const update = () => {
      raf = 0;
      const top = two.getBoundingClientRect().top;
      const vh = innerHeight;
      const mix = Math.min(1, Math.max(0, (vh - top) / (vh * 0.7)));
      el.style.setProperty("--mix", mix.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      el.classList.remove(s.armed);
    };
  }, []);

  const { select, updates, backgrounds } = data;
  return (
    <section
      ref={root}
      id={id}
      aria-label="Explore Kansai"
      className="relative isolate bg-navy-dark"
    >
      {/* Background stage: pinned behind both slides while the section is on screen. The absolute wrapper is the
          section's height, so the sticky stage never travels past the section's end (no bleed into the next one). */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div className={cn(s.layer, s.layerSelect)}>
            <div className={s.camera}>
              <Image
                src={backgrounds.select.src}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className={cn(s.layer, s.layerUpdates)}>
            <div className={s.camera}>
              <Image
                src={backgrounds.updates.src}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
          {/* Brand navy: from the left behind the headings, and top / bottom so the scenes before and after blend in. */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/90 via-navy-dark/55 via-50% to-navy-dark/35 max-md:from-navy-dark/70 max-md:to-navy-dark/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-dark via-navy-dark/20 via-25% to-navy-dark/85" />
        </div>
      </div>

      {/* Slide 1 — Connectrip Japan Select */}
      <div
        data-slide="select"
        className="relative flex min-h-[100svh] items-center"
      >
        <div className="mx-auto w-full max-w-(--container-app) px-5 py-24 md:px-10 md:py-20">
          <SlideHeading
            eyebrow={select.eyebrow}
            title={select.title}
            description={select.description}
            titleId={`${id}-select`}
          />
          {/* Large screens (≥1024 px): strip accordion (the hovered / current guide opens wide, the rest stay narrow strips). */}
          <div data-anim="fade" style={{ "--d": "300ms" } as CSSProperties} className="mt-10 hidden lg:block">
            <SelectStrips cards={select.cards} />
          </div>
          {/* Phones and tablets: swipe cards. */}
          <ul className={cn(s.rail, "-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-6 md:-mx-10 md:scroll-px-10 md:px-10 lg:hidden")}>
            {select.cards.map((c, i) => (
              <li key={c.id} data-anim="rise" style={{ "--i": Math.min(i, 3), "--d": "320ms" } as CSSProperties} className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-[38%]">
                <SelectCard card={c} />
              </li>
            ))}
          </ul>
          {/* The Osaka Map card was taken off this slide (Human instruction 2026-11-15); the map page and its data stay. */}
          <div className="mt-8 md:mt-10">
            <MoreLink {...select.more} />
          </div>
        </div>
      </div>

      {/* Slide 2 — Kansai Travel Updates */}
      <div
        ref={second}
        data-slide="updates"
        className="relative flex min-h-[100svh] items-center"
      >
        <div className="mx-auto w-full max-w-(--container-app) px-5 py-24 md:px-10 md:py-28">
          <NewsRail data={updates} titleId={`${id}-updates`} />
          <MoreLink {...updates.more} />
        </div>
      </div>
    </section>
  );
}

function SlideHeading({
  eyebrow,
  title,
  description,
  titleId,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  titleId: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p
          data-anim="fade"
          className="font-heading-en text-xs tracking-[0.28em] text-gold uppercase md:text-sm"
        >
          {eyebrow}
        </p>
        <h2
          id={titleId}
          data-anim="fade"
          style={{ "--d": "120ms" } as CSSProperties}
          className="mt-3 font-heading-en text-[clamp(2.3rem,9vw,3.2rem)] leading-[1.04] tracking-[0.01em] text-cream drop-shadow-[0_2px_24px_rgba(5,11,24,0.55)] md:text-[clamp(3rem,4.6vw,4.6rem)]"
        >
          {title}
        </h2>
        <p
          data-anim="fade"
          style={{ "--d": "240ms" } as CSSProperties}
          className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/80 md:text-base"
        >
          {description}
        </p>
      </div>
      {aside}
    </div>
  );
}

function Flags({ flags }: { flags: string[] }) {
  return flags.map((f) => (
    <span
      key={f}
      className="border border-cream/35 px-1.5 text-[10px] tracking-[0.12em] text-cream/70"
    >
      {f}
    </span>
  ));
}

/**
 * Connectrip Japan Select as a strip accordion (Human instruction 2026-11-15,
 * from the screen recording of the studio site's ALL WORKS): every guide is a
 * tall strip with a soft, darkened photo and its number, topic and area set
 * vertically; the current one opens wide, the photo sharpens and the title,
 * summary and link rise in. Hover or keyboard focus opens a strip; when the
 * pointer is elsewhere the strips open one after another on their own (with a
 * thin timer line). The strips grow up from the floor as the section arrives.
 * Any number of guides: the open strip keeps ~45% of the row; past what fits,
 * the row scrolls sideways.
 */
function SelectStrips({ cards }: { cards: ExploreSlideCard[] }) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hover = useRef(false);
  const n = cards.length;
  const grow = Math.max(5, 0.82 * (n - 1));
  const AUTO_MS = 4800;

  // Auto-advance while on screen and not being pointed at.
  useEffect(() => {
    const el = root.current;
    if (!el || n < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const id = window.setInterval(() => {
      if (visible && !hover.current && !el.contains(document.activeElement)) setActive((a) => (a + 1) % n);
    }, AUTO_MS);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [n]);

  // Entrance: the strips grow up from the floor, one after another.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MQ_MOTION, () => {
      gsap.fromTo(
        el.querySelectorAll("[data-strip]"),
        { clipPath: "inset(100% 0% 0% 0%)", y: 60 },
        { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.3, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: el, start: "top 85%" } },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      ref={root}
      onMouseEnter={() => (hover.current = true)}
      onMouseLeave={() => (hover.current = false)}
      className={cn(s.rail, "flex h-[min(68svh,640px)] gap-1.5 overflow-x-auto")}
    >
      {cards.map((c, i) => {
        const on = i === active;
        return (
          <Link
            key={c.id}
            href={c.href}
            data-strip
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            aria-label={`${c.title} (${c.category} · ${c.area})`}
            className="group relative min-w-[54px] overflow-hidden rounded-[4px] bg-navy transition-[flex-grow] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            style={{ flexGrow: on ? grow : 1, flexBasis: 0 }}
          >
            {c.image ? (
              <Image
                src={c.image.src}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 1px"
                className={cn(
                  "object-cover transition-[filter,transform] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  on ? "scale-100" : "scale-125 blur-[5px] brightness-[0.5] saturate-[0.7]",
                )}
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(201,164,92,0.18),rgba(13,31,54,0.2))]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,24,0.55)_0%,transparent_28%,transparent_52%,rgba(5,11,24,0.9)_100%)]" />

            {/* Closed strip: number, topic and area, set vertically. */}
            <span
              className={cn(
                "absolute top-5 left-1/2 -translate-x-1/2 font-heading-en text-[11px] tracking-[0.24em] whitespace-nowrap text-cream/85 uppercase transition-opacity duration-500 [writing-mode:vertical-rl]",
                on ? "opacity-0" : "opacity-100",
              )}
              aria-hidden
            >
              {String(i + 1).padStart(2, "0")} · {c.category} · {c.area}
            </span>

            {/* Open strip: the guide. */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 p-7 transition-[opacity,transform] duration-700 lg:p-9",
                on ? "translate-y-0 opacity-100 delay-200" : "pointer-events-none translate-y-6 opacity-0",
              )}
            >
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-heading-en text-[11px] tracking-[0.18em] text-gold uppercase">
                <span>
                  {String(i + 1).padStart(2, "0")} · {c.category} · {c.area}
                </span>
                <Flags flags={c.flags} />
              </p>
              <h3 className="mt-3 max-w-[30rem] font-heading-en text-[clamp(1.6rem,2.4vw,2.4rem)] leading-[1.15] text-cream">{c.title}</h3>
              {c.summary ? <p className="mt-3 line-clamp-2 max-w-[30rem] text-sm leading-relaxed text-cream/80">{c.summary}</p> : null}
              <span className="mt-5 inline-flex items-center gap-2 font-heading-en text-xs tracking-[0.14em] text-gold uppercase">
                Read the guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </div>
            {/* Timer line of the auto-advance. */}
            {on ? <span key={`t${active}`} aria-hidden className={s.timer} style={{ "--t": `${AUTO_MS}ms` } as CSSProperties} /> : null}
          </Link>
        );
      })}
    </div>
  );
}

function SelectCard({ card }: { card: ExploreSlideCard }) {
  return (
    <Link
      href={card.href}
      className={cn(
        s.float,
        "group block overflow-hidden rounded-xl border border-gold/25 bg-navy-dark/70 shadow-[0_24px_60px_-28px_rgba(3,8,20,0.9)] hover:border-gold/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-navy md:aspect-[16/10]">
        {card.image ? (
          <>
            <Image
              src={card.image.src}
              alt={card.image.alt}
              fill
              sizes="(min-width: 768px) 30vw, 78vw"
              className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]"
            />
            {card.image.unverified ? (
              <span className="absolute top-2 left-2 bg-navy-dark/85 px-2 py-0.5 text-[10px] tracking-wide text-gold/90">
                Preview · rights not verified
              </span>
            ) : null}
          </>
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(201,164,92,0.18),rgba(13,31,54,0.2))]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-navy-dark/80 to-transparent" />
      </div>
      <div className="p-5 md:p-6">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-heading-en text-[11px] tracking-[0.16em] text-gold uppercase">
          <span>
            {card.category} · {card.area}
          </span>
          <Flags flags={card.flags} />
        </p>
        <h3 className="mt-2 font-heading-en text-xl leading-snug text-cream transition-colors group-hover:text-gold md:text-[1.4rem]">
          {card.title}
        </h3>
        <span className="mt-4 inline-flex items-center gap-2 font-heading-en text-xs tracking-[0.14em] text-gold/90 uppercase">
          Read the guide{" "}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}

/**
 * Kansai Travel Updates: the cards run from right to left on an endless loop
 * (the list is drawn twice and the track slides by exactly one copy). Speed
 * follows the number of cards, so more articles never run faster; the loop
 * pauses while the pointer or keyboard focus is on it. Reduced motion: a
 * plain horizontal rail that can be swiped.
 */
function NewsRail({
  data,
  titleId,
}: {
  data: Data["updates"];
  titleId: string;
}) {
  const cards = data.cards;
  return (
    <>
      <SlideHeading
        eyebrow={data.eyebrow}
        title={data.title}
        description={data.description}
        titleId={titleId}
      />
      {cards.length === 0 ? (
        <p
          data-anim="rise"
          className={cn(
            s.glass,
            "mt-10 max-w-2xl rounded-xl border border-cream/15 p-6 text-sm leading-relaxed text-cream/80",
          )}
        >
          {data.empty}
        </p>
      ) : (
        <div data-anim="fade" style={{ "--d": "300ms" } as CSSProperties} className={cn(s.loop, "-mx-5 mt-10 md:-mx-10 md:mt-12")}>
          <div className={s.loopTrack} style={{ "--loop-duration": `${Math.max(24, cards.length * 7)}s` } as CSSProperties}>
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-label={copy === 0 ? data.title : undefined}
                aria-hidden={copy === 1 || undefined}
                className="flex shrink-0 gap-4 pr-4 md:gap-6 md:pr-6"
              >
                {cards.map((c) => (
                  <li key={`${copy}-${c.id}`} className="flex w-[78vw] shrink-0 sm:w-[340px] md:w-[360px]">
                    <NewsCard card={c} hidden={copy === 1} />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function NewsCard({ card, hidden = false }: { card: ExploreNewsCard; hidden?: boolean }) {
  const body = (
    <>
      {card.image ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl">
          <Image src={card.image.src} alt={hidden ? "" : card.image.alt} fill sizes="(min-width: 768px) 360px, 78vw" className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/70 via-transparent to-transparent" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-heading-en text-[11px] tracking-[0.16em] text-gold uppercase">
          <span>
            {card.category} · {card.area}
          </span>
          <Flags flags={card.flags} />
        </p>
        <h3 className="mt-3 font-heading-en text-lg leading-snug text-cream transition-colors group-hover:text-gold md:text-[1.25rem]">{card.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-xs tracking-[0.06em] text-cream/65">{card.date ?? ""}</span>
          <ArrowRight className="h-5 w-5 text-gold transition-transform group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
        </div>
      </div>
    </>
  );
  const cls = cn(s.glass, "group flex w-full flex-col rounded-xl border border-cream/15 hover:border-gold/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold");
  // Placeholder updates have no page yet: they open the updates hub.
  return (
    <Link href={card.href ?? exploreUpdatesHref()} tabIndex={hidden ? -1 : undefined} className={cls}>
      {body}
    </Link>
  );
}

function MoreLink({ href, label }: { href: string; label: string }) {
  return (
    <p
      data-anim="fade"
      style={{ "--d": "700ms" } as CSSProperties}
      className="mt-8 md:mt-10"
    >
      <Link
        href={href}
        className="inline-flex items-center gap-2 font-heading-en text-sm tracking-[0.1em] text-gold hover:text-cream"
      >
        {label} <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </p>
  );
}
