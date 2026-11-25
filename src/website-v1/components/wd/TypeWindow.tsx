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
 * and the CTA rise in a column on the right — all in one screen. Since
 * 2026-11-23 the settled state is dressed like the Featured Tour slide: light
 * gold / cream type, an N° index line, gold hairlines and a gold-outline CTA. Same heading,
 * copy, choices and CTA as before. PC and phones alike.
 */
export function TypeWindow({ section, options }: { section: HomeContent["privateGuide"]; options: { label: string; items: string[] }[] }) {
  // Choices are made in the request form, not here: the CTA opens it directly.
  const cta = { ...section.cta, href: `${section.cta.href}#request` };
  const heading = section.heading.status === "TBD" ? "" : section.heading.value;
  // Two lines at the sentence break ("Your Kansai." / "Your Way.") for the cut-out letters.
  const lines = heading.split(/(?<=\.)\s+/);
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
          {/* Dressed like the Featured Tour slide (Human instruction 2026-11-23: elegant, not pop):
              the heading in two light lines, "Your Kansai." in gold and "Your Way." in cream with a
              gold hairline drawn under it. The "N°02 ── PRIVATE GUIDE" index line was removed
              (Human instruction 2026-11-24). */}
          <h2 aria-label={heading} className="font-heading-en text-[min(13vw,4.2rem)] leading-[1.02] font-light tracking-[-0.02em] text-cream md:text-[min(8.4vw,15svh)]">
            {lines.map((line, i) => (
              <span key={line} data-tw-item aria-hidden className={i === 0 ? "block text-[#cfa95f]" : "relative block w-fit"}>
                {line}
                {i === lines.length - 1 ? (
                  <svg aria-hidden viewBox="0 0 300 4" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-[0.06em] left-[0.03em] h-[2px] w-full overflow-visible">
                    <path data-tw-swash="" pathLength={1} d="M0 2H300" fill="none" stroke="#cfa95f" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                  </svg>
                ) : null}
              </span>
            ))}
          </h2>

          {/* Right column (wide screens), below the heading on phones. On wide screens it now runs from
              the top of the heading to the bottom of the screen and sits in the middle of that space,
              set larger (Human instruction 2026-11-23: the upper half was empty). */}
          <div className="mt-6 md:absolute md:top-[clamp(5.25rem,11svh,7rem)] md:right-[4vw] md:bottom-[clamp(1.5rem,5svh,3.5rem)] md:mt-0 md:flex md:w-[min(44vw,660px)] md:flex-col md:justify-center">
            {section.supporting ? (
              <div data-tw-item className="flex items-center gap-3 md:gap-4">
                <span aria-hidden data-tw-rule className="h-px w-8 shrink-0 origin-left bg-[#cfa95f] md:w-12" />
                <TbdText value={section.supporting} slot="Private Guide supporting copy" as="p" className="font-heading-en text-[clamp(0.72rem,0.9vw,0.82rem)] leading-[1.5] font-medium tracking-[0.28em] text-[#cfa95f] uppercase md:text-[clamp(0.8rem,min(1.05vw,2svh),0.98rem)]" />
              </div>
            ) : null}
            <p data-tw-item className="mt-3 text-sm leading-[1.75] font-light text-cream/85 md:mt-[clamp(0.75rem,2svh,1.25rem)] md:text-[clamp(1.05rem,min(1.6vw,3svh),1.5rem)] md:leading-[1.5]">
              {PRIVATE_DAY_DESCRIPTION}
            </p>
            <div data-tw-item aria-hidden className="mt-5 md:mt-[clamp(1rem,3svh,2rem)]">
              <div data-tw-rule className="h-px origin-left bg-gradient-to-r from-[#cfa95f]/80 to-cream/10" />
            </div>
            <dl className="mt-4 space-y-3 md:mt-[clamp(0.9rem,2.6svh,1.75rem)] md:space-y-[clamp(0.6rem,1.8svh,1.1rem)]">
              {options.map((group, gi) => (
                <div key={group.label} data-tw-item className="md:grid md:grid-cols-[clamp(8.5rem,11vw,10.5rem)_1fr] md:items-start md:gap-4">
                  <dt className="flex items-baseline gap-2.5 font-heading-en text-[10px] font-medium tracking-[0.3em] text-[#cfa95f] md:pt-[0.6rem] md:text-[clamp(0.68rem,0.8vw,0.78rem)]">
                    <span className="font-semibold tracking-[0.12em] text-[#e0532f]">{String(gi + 1).padStart(2, "0")}</span>
                    {group.label}
                  </dt>
                  {/* Each choice is a hairline tag ("8 Hours" stays whole); on hover gold fills it from the left. */}
                  <dd className="mt-1.5 flex flex-wrap gap-1.5 md:mt-0 md:gap-2">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        data-tw-chip
                        className="rounded-[2px] border border-[#cfa95f]/40 bg-[linear-gradient(#cfa95f,#cfa95f)] bg-[length:0%_100%] bg-no-repeat px-3 py-[0.2rem] text-[12px] font-light tracking-[0.04em] whitespace-nowrap text-cream transition-[background-size,color,border-color] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:border-[#cfa95f] hover:bg-[length:100%_100%] hover:text-[#15120f] md:px-[clamp(0.8rem,1vw,1.1rem)] md:py-[clamp(0.3rem,0.9svh,0.5rem)] md:text-[clamp(0.82rem,min(1vw,1.9svh),0.98rem)]"
                      >
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <div data-tw-item className="mt-6 flex flex-wrap gap-3 md:mt-[clamp(1.25rem,4svh,2.5rem)]">
              <CtaLink cta={cta} pair variant="secondary" className="max-md:w-full" />
              {section.learnMore ? <CtaLink cta={section.learnMore} /> : null}
            </div>
          </div>
        </div>
      </div>
      <TypeWindowMotion targetId="private-guide" />
    </section>
  );
}
