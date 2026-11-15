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
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
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
          <ul
            className={cn(
              s.rail,
              "-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-6 md:mx-0 md:mt-9 md:grid md:grid-cols-3 md:items-start md:gap-7 md:overflow-visible md:px-0 md:pb-0",
            )}
          >
            {select.cards.map((c, i) => (
              <li
                key={c.id}
                data-anim="rise"
                style={{ "--i": i, "--d": "320ms" } as CSSProperties}
                className={cn(
                  "w-[78%] shrink-0 snap-start sm:w-[46%] md:w-auto",
                  i === 1 && s.offset1,
                  i === 2 && s.offset2,
                )}
              >
                <SelectCard card={c} />
              </li>
            ))}
            {select.map ? (
              <li
                data-anim="rise"
                style={
                  {
                    "--i": select.cards.length,
                    "--d": "320ms",
                  } as CSSProperties
                }
                className={cn(
                  "w-[78%] shrink-0 snap-start sm:w-[46%] md:w-auto",
                  select.cards.length === 1 && s.offset1,
                  select.cards.length === 2 && s.offset2,
                )}
              >
                <MapFloatCard {...select.map} />
              </li>
            ) : null}
          </ul>
          <MoreLink {...select.more} />
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

function MapFloatCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        s.float,
        s.glass,
        "group flex min-h-[260px] flex-col justify-between rounded-xl border border-gold/30 p-6 hover:border-gold/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold md:min-h-[290px] md:p-7",
      )}
    >
      <span className="inline-flex w-fit items-center gap-1.5 bg-gold px-2.5 py-1 font-heading-en text-[10px] tracking-[0.18em] text-navy uppercase">
        <MapPin className="h-3 w-3" aria-hidden /> Map
      </span>
      <div>
        <h3 className="font-heading-en text-2xl leading-snug text-cream group-hover:text-gold">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-cream/75">
          {description}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 font-heading-en text-xs tracking-[0.14em] text-gold/90 uppercase">
          Open the map{" "}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}

function NewsRail({
  data,
  titleId,
}: {
  data: Data["updates"];
  titleId: string;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const check = () =>
      setEdges({
        start: el.scrollLeft <= 4,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      });
    check();
    el.addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      removeEventListener("resize", check);
    };
  }, []);

  const go = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const step =
      card.getBoundingClientRect().width +
      parseFloat(getComputedStyle(el).columnGap || "0");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  };

  const arrows =
    data.cards.length > 1 ? (
      <div
        data-anim="fade"
        style={{ "--d": "300ms" } as CSSProperties}
        className="flex gap-3 max-md:hidden"
      >
        <RailButton
          label="Previous updates"
          disabled={edges.start}
          onClick={() => go(-1)}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </RailButton>
        <RailButton
          label="Next updates"
          disabled={edges.end}
          onClick={() => go(1)}
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </RailButton>
      </div>
    ) : null;

  return (
    <>
      <SlideHeading
        eyebrow={data.eyebrow}
        title={data.title}
        description={data.description}
        titleId={titleId}
        aside={arrows}
      />
      {data.samples ? (
        <p
          data-anim="fade"
          className="mt-6 inline-block border border-dashed border-gold/40 px-3 py-1.5 text-[11px] tracking-wide text-gold/85"
        >
          Preview · no travel updates are published yet. The cards below are
          layout samples, not news.
        </p>
      ) : null}
      {data.cards.length === 0 ? (
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
        <ul
          ref={rail}
          aria-label={data.title}
          className={cn(
            s.rail,
            "-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-4 md:mx-0 md:mt-10 md:gap-5 md:scroll-px-0 md:px-0",
          )}
        >
          {data.cards.map((c, i) => (
            <li
              key={c.id}
              data-anim="right"
              style={{ "--i": i, "--d": "360ms" } as CSSProperties}
              className="flex w-[82%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
            >
              <NewsCard card={c} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function NewsCard({ card }: { card: ExploreNewsCard }) {
  const body = (
    <>
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-heading-en text-[11px] tracking-[0.16em] text-gold uppercase">
        <span>
          {card.category} · {card.area}
        </span>
        <Flags flags={card.flags} />
      </p>
      <h3
        className={cn(
          "mt-3 font-heading-en text-xl leading-snug md:text-[1.35rem]",
          card.sample
            ? "text-cream/60 italic"
            : "text-cream transition-colors group-hover:text-gold",
        )}
      >
        {card.title}
      </h3>
      <div className="mt-auto flex items-center justify-between pt-6">
        <span className="text-xs tracking-[0.06em] text-cream/65">
          {card.date ?? ""}
        </span>
        {card.href ? (
          <ArrowRight
            className="h-5 w-5 text-gold transition-transform group-hover:translate-x-1"
            strokeWidth={1.5}
            aria-hidden
          />
        ) : null}
      </div>
    </>
  );
  const cls = cn(
    s.glass,
    "flex min-h-[210px] w-full flex-col rounded-xl border p-6 md:min-h-[230px] md:p-7",
  );
  return card.href ? (
    <Link
      href={card.href}
      className={cn(
        cls,
        s.float,
        "group border-cream/15 hover:border-gold/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={cn(cls, "border-dashed border-cream/25")}>{body}</div>
  );
}

function RailButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold transition-colors hover:bg-gold hover:text-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:border-cream/20 disabled:text-cream/30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
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
