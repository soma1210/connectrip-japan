import type { CSSProperties } from "react";
import type { HomeContent } from "@/contracts";
import { PRIVATE_DAY_DESCRIPTION } from "../../content/home";
import { CtaLink } from "../CtaLink";
import { TbdText } from "../Tbd";
import { KansaiMap } from "./KansaiMap";
import { TypeWindowMotion } from "./TypeWindowMotion";

/**
 * Home · Private Guide as a "type window" (taken from the V3 award Home,
 * Human instruction 2026-11-22). Pinned. A line-drawn map of Kansai
 * (KansaiMap, after sondaven.com; Human instruction 2026-11-22) lies under a
 * black sheet; the heading is cut out of the sheet (multiply blend: white
 * letters let the scene through). At first the giant letters show plain warm
 * paper, so they read clearly; scrolling, they grow until the sheet dissolves,
 * the paper gives way to the dark map, its rivers and rails draw and its
 * places come in. Then the heading settles in two lines on one grid (as
 * sondaven.com's "Where / the Mountains / Speak") and the copy, the choices
 * and the CTA rise in a column on the right — all in one screen. Same heading,
 * copy, choices and CTA as before. PC and phones alike.
 */
const GROUP_COLORS = ["#ff6a45", "#f2c14e", "#5cc6b8"];

export function TypeWindow({ section, options }: { section: HomeContent["privateGuide"]; options: { label: string; items: string[] }[] }) {
  // Choices are made in the request form, not here: the CTA opens it directly.
  const cta = { ...section.cta, href: `${section.cta.href}#request` };
  const heading = section.heading.status === "TBD" ? "" : section.heading.value;
  // Two lines at the sentence break ("Your Kansai." / "Your Way.") for the cut-out letters.
  const lines = heading.split(/(?<=\.)\s+/);
  // "Your Kansai. Your Way." → YOUR / KANSAI. / (your) WAY. Any other wording falls back to its lines.
  const words = heading.split(/\s+/);
  const staggered = words.length === 4;
  return (
    <section id="private-guide" className="relative h-[320svh] bg-navy">
      <div data-tw-stage className="sticky top-0 h-svh overflow-hidden bg-navy">
        <div data-tw-photo className="absolute inset-0">
          <KansaiMap />
          {/* Phones: an even veil under the text. Wide screens: a soft shade behind the right column. */}
          <div data-tw-shade className="absolute inset-0 bg-[#15120f]/60 md:bg-transparent md:bg-gradient-to-l md:from-[#15120f]/85 md:via-[#15120f]/20 md:via-45% md:to-transparent" />
        </div>

        {/* The black sheet with the heading cut out of it. */}
        <div data-tw-sheet aria-hidden className="absolute inset-0 flex flex-col items-center justify-center bg-black mix-blend-multiply will-change-transform">
          {lines.map((line, i) => (
            <span key={i} className="block font-heading-en text-[clamp(3.6rem,15vw,17rem)] font-bold leading-[0.88] tracking-[-0.03em] whitespace-nowrap text-white">
              {line}
            </span>
          ))}
        </div>

        {/* On the map, once the sheet has gone. */}
        <div data-tw-copy className="relative z-[2] mx-auto h-full w-full max-w-[1600px] px-5 pt-[clamp(5.25rem,11svh,7rem)] md:px-[4vw]">
          {/* Two lines on one grid: "KANSAI." and "WAY." share a left edge; the small "YOUR" sits in the
              space under the large one, on the baseline of "WAY." (after sondaven.com's "The Mountains"). */}
          <h2 aria-label={heading} className="font-heading-en text-[min(14.2vw,4.6rem)] leading-[0.9] font-light tracking-[-0.045em] text-[#d6c29a] uppercase md:text-[min(10vw,17svh)]">
            {staggered ? (
              <span aria-hidden className="grid w-fit grid-cols-[auto_auto] items-baseline gap-x-[0.24em]">
                {/* Pop (Human instruction 2026-11-23): thin "YOUR", heavy cream "KANSAI." with a
                    spinning ✺, a tilted vermilion "YOUR" tag, and "WAY." in vermilion with a gold
                    hand-drawn swash under it. */}
                <span data-tw-item>{words[0]}</span>
                <span data-tw-item className="relative font-extrabold tracking-[-0.05em] text-cream">
                  {words[1]}
                  <span aria-hidden className="absolute -top-[0.08em] -right-[0.32em] inline-block animate-[spin_9s_linear_infinite] text-[0.26em] text-[#f2c14e] motion-reduce:animate-none">
                    ✺
                  </span>
                </span>
                <span data-tw-item className="justify-self-end self-center">
                  <span className="inline-block -rotate-6 rounded-full bg-red px-[0.75em] py-[0.35em] text-[0.15em] leading-none font-bold tracking-[0.3em] text-cream shadow-[0_12px_24px_-12px_rgb(224_83_47/0.9)]">
                    {words[2]}
                  </span>
                </span>
                <span data-tw-item className="relative font-extrabold tracking-[-0.05em] text-red">
                  {words[3]}
                  <svg aria-hidden viewBox="0 0 300 40" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-[0.12em] left-[0.02em] h-[0.22em] w-[96%] overflow-visible">
                    <path data-tw-swash="" pathLength={1} d="M4 26C60 10 120 8 170 16S260 34 296 12" fill="none" stroke="#f2c14e" strokeWidth="7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                </span>
              </span>
            ) : (
              lines.map((line) => (
                <span key={line} data-tw-item aria-hidden className="block">
                  {line}
                </span>
              ))
            )}
          </h2>

          {/* Right column (wide screens), below the heading on phones. */}
          <div className="mt-6 md:absolute md:right-[4vw] md:bottom-[clamp(1.5rem,5svh,3.5rem)] md:mt-0 md:w-[min(42vw,600px)]">
            {section.supporting ? (
              <div data-tw-item className="flex items-center gap-3">
                <span aria-hidden className="h-[3px] w-8 shrink-0 rounded-full bg-red" />
                <TbdText value={section.supporting} slot="Private Guide supporting copy" as="p" className="font-heading-en text-[clamp(0.95rem,1.45vw,1.3rem)] leading-[1.35] font-bold tracking-[0.16em] text-cream uppercase" />
              </div>
            ) : null}
            <p data-tw-item className="mt-2 text-sm leading-relaxed text-cream/70 md:mt-3">
              {PRIVATE_DAY_DESCRIPTION}
            </p>
            <div data-tw-item aria-hidden className="mt-5 h-px bg-[#d6c29a]/20 md:mt-6" />
            <dl className="mt-4 space-y-3 md:mt-5 md:space-y-2.5">
              {options.map((group, gi) => (
                <div
                  key={group.label}
                  data-tw-item
                  // One pop colour per group: vermilion, saffron, jade (Human instruction 2026-11-23).
                  style={{ "--g": GROUP_COLORS[gi % GROUP_COLORS.length] } as CSSProperties}
                  className="md:grid md:grid-cols-[8.5rem_1fr] md:items-start md:gap-4"
                >
                  <dt className="flex items-center gap-2 font-heading-en text-[10px] font-semibold tracking-[0.3em] text-(--g) md:pt-[0.45rem]">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-(--g)" />
                    {group.label}
                  </dt>
                  {/* Each choice is a hairline pill ("8 Hours" stays whole). */}
                  <dd className="mt-1.5 flex flex-wrap gap-1.5 md:mt-0">
                    {group.items.map((item) => (
                      <span key={item} className="rounded-full border border-[color-mix(in_srgb,var(--g)_45%,transparent)] bg-[color-mix(in_srgb,var(--g)_8%,transparent)] px-3 py-[0.2rem] text-[12px] font-normal tracking-[0.02em] whitespace-nowrap text-cream/90 transition-[background-color,color,border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-(--g) hover:bg-(--g) hover:text-[#15120f] md:text-[12.5px]">
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <div data-tw-item className="mt-6 flex flex-wrap gap-3 md:mt-7">
              <CtaLink cta={cta} pair className="max-md:w-full" />
              {section.learnMore ? <CtaLink cta={section.learnMore} /> : null}
            </div>
          </div>
        </div>
      </div>
      <TypeWindowMotion targetId="private-guide" />
    </section>
  );
}
