import type { HomeContent } from "@/contracts";
import { PRIVATE_DAY_DESCRIPTION } from "../../content/home";
import { V1_PREVIEW } from "../../config";
import { CtaLink } from "../CtaLink";
import { TbdImage, TbdText } from "../Tbd";
import { TypeWindowMotion } from "./TypeWindowMotion";

/**
 * Home · Private Guide as a "type window" (taken from the V3 award Home,
 * Human instruction 2026-11-22). Pinned. The night-street photo lies under a
 * black sheet; the heading is cut out of the sheet (multiply blend: white
 * letters let the photo through), so at first the street is seen only through
 * the giant letters. Scrolling, the letters grow until the sheet dissolves and
 * the whole photo is there; then the copy, the choices and the CTA rise on it.
 * Same heading, copy, choices and CTA as before. PC and phones alike.
 */
export function TypeWindow({ section, options }: { section: HomeContent["privateGuide"]; options: { label: string; items: string[] }[] }) {
  // Choices are made in the request form, not here: the CTA opens it directly.
  const cta = { ...section.cta, href: `${section.cta.href}#request` };
  // Public mode: no photo while its licence is undecided; the letters then open onto the dark page.
  const showPhoto = V1_PREVIEW || section.image.status !== "TBD";
  const heading = section.heading.status === "TBD" ? "" : section.heading.value;
  // Two lines at the sentence break ("Your Kansai." / "Your Way.").
  const lines = heading.split(/(?<=\.)\s+/);
  return (
    <section id="private-guide" className="relative h-[320svh] bg-navy">
      <div data-tw-stage className="sticky top-0 h-svh overflow-hidden bg-navy">
        <div data-tw-photo className="absolute inset-0">
          {showPhoto ? <TbdImage value={section.image} slot="Private Guide photo" sizes="100vw" className="object-cover object-[60%_center]" /> : null}
          {/* Wide screens: the photo fades into black on the text side. Phones: an even veil under the text. */}
          <div data-tw-shade className="absolute inset-0 bg-navy/60 md:bg-transparent md:bg-gradient-to-r md:from-navy/85 md:via-navy/40 md:to-transparent" />
        </div>

        {/* The black sheet with the heading cut out of it. */}
        <div data-tw-sheet aria-hidden className="absolute inset-0 flex flex-col items-center justify-center bg-navy mix-blend-multiply will-change-transform">
          {lines.map((line, i) => (
            <span key={i} className="block font-heading-en text-[clamp(3.6rem,15vw,17rem)] font-semibold leading-[0.86] tracking-[-0.035em] whitespace-nowrap text-white">
              {line}
            </span>
          ))}
        </div>

        {/* On the photo, once the sheet has gone. */}
        <div data-tw-copy className="relative z-[2] mx-auto flex h-full w-full max-w-[1440px] flex-col justify-center px-5 md:px-[5vw]">
          <div className="max-w-xl">
            <h2 data-tw-item className="font-heading-en text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[1] tracking-[-0.02em] text-cream">
              {heading}
            </h2>
            {section.supporting ? (
              <div data-tw-item className="mt-5">
                <TbdText value={section.supporting} slot="Private Guide supporting copy" as="p" className="text-base text-cream/85" />
              </div>
            ) : null}
            <p data-tw-item className="mt-2 text-sm leading-relaxed text-cream/75">
              {PRIVATE_DAY_DESCRIPTION}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5">
              {options.map((group, i) => (
                <div key={group.label} data-tw-item className={i < 2 ? "col-span-2" : ""}>
                  <dt className="font-heading-en text-[11px] font-medium tracking-[0.26em] text-gold">{group.label}</dt>
                  <dd className="mt-1.5 border-t border-cream/20 pt-2 text-sm leading-relaxed text-cream">
                    {/* A line breaks only between choices ("8 Hours" stays whole). */}
                    {group.items.map((item, j) => (
                      <span key={item}>
                        {j > 0 ? " · " : null}
                        <span className="whitespace-nowrap">{item}</span>
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <div data-tw-item className="mt-10 flex flex-wrap gap-3">
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
