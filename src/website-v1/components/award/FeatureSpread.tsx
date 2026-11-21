import Image from "next/image";
import type { HomeContent } from "@/contracts";
import { V1_PREVIEW } from "../../config";
import { getFeaturedTour } from "../../content/featuredTour";
import { CtaLink } from "../CtaLink";
import { TbdText } from "../Tbd";
import { RotatingBadge } from "./RotatingBadge";
import { SectionLabel, SplitChars } from "./Split";

/**
 * Award Home · Featured Experiences as a magazine spread (2026-11-22).
 * A giant two-line title; below, a tall photo framed in a katomado (the site's
 * window) that opens like a curtain while its camera drifts; beside it the
 * tour, its facts as a ruled table, and the two CTAs. Same tour and copy.
 */
export function FeatureSpread({ section }: { section: HomeContent["featuredExperiences"] }) {
  const tour = getFeaturedTour();
  return (
    <section id="experiences" className="relative bg-paper py-[14svh] text-ink">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-[5vw]">
        <SectionLabel index="01">{null}</SectionLabel>
        {section.heading.status === "TBD" ? (
          <TbdText value={section.heading} slot="Featured Experiences heading" as="h2" />
        ) : (
          <SplitChars drift text={section.heading.value} className="mt-10 max-w-[12ch] font-display text-[clamp(3.2rem,11vw,11.5rem)] leading-[0.88] tracking-[-0.03em] text-ink" />
        )}
        {section.supporting ? (
          <div data-aw-group className="mt-8 md:ml-[42%] md:max-w-xl">
            <TbdText value={section.supporting} slot="Featured Experiences supporting copy" as="p" className="text-base leading-relaxed text-ink/70" />
          </div>
        ) : null}

        <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-12 md:gap-8">
          {/* The tour photo, in the katomado window. */}
          <div className="relative md:col-span-5">
            <RotatingBadge
              className="absolute -top-10 -right-1 z-[2] h-28 w-28 text-ink md:-right-14 md:h-44 md:w-44"
              text={`${tour.facts.find((f) => /type/i.test(f.label))?.value ?? ""} · ${tour.facts.find((f) => /area/i.test(f.label))?.value ?? ""} · `}
            />
            <div data-aw-reveal data-ripple data-cursor="photo">
              <div className="relative aspect-[3/4] w-full overflow-hidden" style={{ clipPath: "url(#aw-kato)" }}>
                <div data-aw-parallax="8" className="absolute -inset-y-[10%] inset-x-0">
                  <Image src={tour.image.src} alt={tour.image.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" style={{ objectPosition: tour.imagePosition }} />
                </div>
              </div>
            </div>
          </div>

          {/* The tour. */}
          <div data-aw-group className="flex flex-col md:col-span-6 md:col-start-7 md:justify-end">
            <p data-aw-item className="font-sans text-[11px] font-medium tracking-[0.3em] text-enji uppercase">
              {tour.facts.find((f) => /type/i.test(f.label))?.value ?? ""}
            </p>
            <h3 data-aw-item className="mt-4 font-display text-[clamp(2rem,3.4vw,3.4rem)] leading-[1.08] tracking-[-0.01em] text-ink">
              {tour.title}
            </h3>
            <p data-aw-item className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink/70 md:text-base">
              {tour.summary}
            </p>
            <dl data-aw-rows className="mt-10 border-t border-ink/15">
              {tour.facts.map((f) => (
                <div key={f.label} className="grid grid-cols-[9rem_1fr] items-baseline gap-4 border-b border-ink/15 py-3.5">
                  <dt className="font-sans text-[11px] font-medium tracking-[0.22em] text-ink/45 uppercase">{f.label}</dt>
                  <dd className="text-[15px] text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div data-aw-item className="mt-10 flex flex-col flex-wrap gap-3 sm:flex-row">
              <CtaLink cta={tour.detailCta} pair />
              <CtaLink cta={tour.bookingCta} pair />
            </div>
            {V1_PREVIEW ? (
              <p data-aw-item className="mt-4 text-[11px] text-ink/45">
                Preview: booking requests for this tour are not open yet, so the booking button is inactive.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
