import type { HomeContent } from "@/contracts";
import { PRIVATE_DAY_DESCRIPTION } from "../../content/home";
import { CtaLink } from "../CtaLink";
import { TbdImage, TbdText } from "../Tbd";
import { TypeWindowMotion } from "./TypeWindowMotion";

/**
 * Award Home · Private Guide as a "type window" (2026-11-22).
 * Pinned. The night-street photo lies under a white sheet; the heading is cut
 * out of the sheet (screen blend: black letters let the photo through), so at
 * first the street is seen only through the giant letters. Scrolling, the
 * letters grow until the sheet dissolves and the whole photo is there; then
 * the copy, the four choices and the CTA rise on it, in the night palette.
 * Same heading, copy, choices and CTA.
 */
export function TypeWindow({ section, options }: { section: HomeContent["privateGuide"]; options: { label: string; items: string[] }[] }) {
  const cta = { ...section.cta, href: `${section.cta.href}#request` };
  const heading = section.heading.status === "TBD" ? "" : section.heading.value;
  // Two lines at the sentence break ("Your Kansai." / "Your Way.").
  const lines = heading.split(/(?<=\.)\s+/);
  return (
    <section id="private-guide" className="relative h-[320svh] bg-paper">
      <div data-tw-stage className="theme-dark sticky top-0 h-svh overflow-hidden bg-ink-deep">
        <div data-tw-photo className="absolute inset-0">
          <TbdImage value={section.image} slot="Private Guide photo" sizes="100vw" className="object-cover object-[60%_center]" />
          <div data-tw-shade className="absolute inset-0 bg-gradient-to-r from-ink-deep/85 via-ink-deep/40 to-transparent" />
        </div>

        {/* The white sheet with the heading cut out of it. */}
        <div data-tw-sheet aria-hidden className="absolute inset-0 flex flex-col items-center justify-center bg-paper mix-blend-multiply will-change-transform">
          {lines.map((line, i) => (
            <span key={i} className="block font-display text-[clamp(3.6rem,15vw,17rem)] leading-[0.86] tracking-[-0.035em] whitespace-nowrap text-white">
              {line}
            </span>
          ))}
        </div>

        {/* On the photo, once the sheet has gone. */}
        <div data-tw-copy className="relative z-[2] mx-auto flex h-full w-full max-w-[1440px] flex-col justify-center px-5 md:px-[5vw]">
          <div className="max-w-xl">
            <h2 data-tw-item className="font-display text-[clamp(2.6rem,5vw,5rem)] leading-[1] tracking-[-0.02em] text-snow">
              {heading}
            </h2>
            {section.supporting ? (
              <div data-tw-item className="mt-5">
                <TbdText value={section.supporting} slot="Private Guide supporting copy" as="p" className="text-base text-snow/85" />
              </div>
            ) : null}
            <p data-tw-item className="mt-2 text-[15px] leading-relaxed text-snow/75">
              {PRIVATE_DAY_DESCRIPTION}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5">
              {options.map((group, i) => (
                <div key={group.label} data-tw-item className={i < 2 ? "col-span-2" : ""}>
                  <dt className="font-sans text-[11px] font-medium tracking-[0.26em] text-snow/55">{group.label}</dt>
                  <dd className="mt-1.5 border-t border-snow/20 pt-2 text-[15px] leading-relaxed text-snow">
                    {group.items.join(" · ")}
                  </dd>
                </div>
              ))}
            </dl>
            <div data-tw-item className="mt-10 flex flex-wrap gap-3">
              <CtaLink cta={cta} pair />
              {section.learnMore ? <CtaLink cta={section.learnMore} /> : null}
            </div>
          </div>
        </div>
      </div>
      <TypeWindowMotion targetId="private-guide" />
    </section>
  );
}
