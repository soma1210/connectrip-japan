import Image from "next/image";
import type { HowItWorksFlows } from "@/contracts";
import { CtaLink } from "../CtaLink";
import { TbdText, textOr } from "../Tbd";
import { SectionLabel, SplitChars } from "./Split";
import { StepTrackMotion } from "./StepTrackMotion";

/**
 * Photos for the step cards, in step order (existing site photos only).
 * Ready-made: the tour, Kyoto at night, Dotonbori, Osaka Castle.
 * Private Guide: the night street, Kinkaku-ji, Arashiyama, Nachi Falls.
 */
const STEP_PHOTOS = {
  ready_made: [
    "/images/v1/experiences/osaka-tenmangu-gate.webp",
    "/images/v1/hero/kyoto/kyoto-yasaka-pagoda-night.jpg",
    "/images/v1/hero/osaka/osaka-dotonbori.jpg",
    "/images/v1/hero/osaka/osaka-castle.jpg",
  ],
  private_guide: [
    "/images/v1/sections/your-kansai-night-street.webp",
    "/images/v1/hero/kyoto/kyoto-kinkakuji.jpg",
    "/images/v1/hero/kyoto/kyoto-arashiyama-boat.jpg",
    "/images/v1/hero/wakayama/wakayama-nachi-falls.jpg",
  ],
} as const;

/**
 * Award Home · How It Works as a cinematic track (2026-11-22, second pass).
 * Pinned; scrolling down moves a long row sideways: the title, then for each
 * flow a kon (navy) flow card with its name and CTA, followed by its steps —
 * each a tall photo card. Inside every card the photo drifts against the
 * movement (depth), a giant numeral fills with light as the card crosses the
 * centre, and the step title sits at its foot. Thin progress bar below.
 * Same flows, step titles and CTAs (content/howItWorks.ts).
 */
export function StepTrack({ id, heading, flows }: { id: string; heading: string; flows: HowItWorksFlows }) {
  const list = [flows.readyMade, flows.privateGuide] as const;
  return (
    <section id={id} data-st className="relative bg-paper text-ink">
      <div data-st-stage className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1440px] px-5 md:px-[5vw]">
          <SectionLabel index="04">{null}</SectionLabel>
        </div>
        <div data-st-track className="mt-8 flex w-max items-stretch gap-4 px-5 will-change-transform md:gap-6 md:px-[5vw]">
          {/* Title card. */}
          <div className="flex w-[82vw] shrink-0 flex-col justify-end pr-6 md:w-[34vw]">
            <SplitChars text={heading} className="font-display text-[clamp(3.4rem,9vw,9.5rem)] leading-[0.88] tracking-[-0.04em] text-ink" />
          </div>
          {list.map((flow) => (
            <FlowCards key={flow.key} flow={flow} />
          ))}
          <div className="w-[8vw] shrink-0" aria-hidden />
        </div>
        <div className="mx-auto mt-8 w-full max-w-[1440px] px-5 md:px-[5vw]">
          <div aria-hidden className="h-px w-full bg-ink/12">
            <div data-st-bar className="h-full w-full origin-left scale-x-0 bg-enji" />
          </div>
        </div>
      </div>
      <StepTrackMotion targetId={id} />
    </section>
  );
}

function FlowCards({ flow }: { flow: HowItWorksFlows["readyMade"] | HowItWorksFlows["privateGuide"] }) {
  const photos = STEP_PHOTOS[flow.key];
  return (
    <>
      <div className="theme-dark relative flex h-[min(70svh,640px)] w-[78vw] shrink-0 flex-col justify-between overflow-hidden rounded-[6px] bg-kon p-7 md:w-[24vw] md:p-9">
        <span aria-hidden className="block h-2 w-2 rounded-full bg-enji" />
        <div className="relative">
          <TbdText value={flow.title} slot="Flow title" as="h3" className="font-display text-[clamp(2.2rem,3.2vw,3.4rem)] leading-[1] text-snow" />
          {flow.summary ? <TbdText value={flow.summary} slot="Flow summary" as="p" className="mt-3 text-sm text-snow/70" /> : null}
          {flow.note && flow.note.status !== "TBD" ? <TbdText value={flow.note} slot="Flow note" as="p" className="mt-3 text-xs text-snow/60" /> : null}
          <div className="mt-8">
            <CtaLink cta={flow.cta} pair />
          </div>
        </div>
      </div>
      {flow.steps.map((step, i) => (
        <div key={step.key} data-st-card data-ripple className="theme-dark group relative h-[min(70svh,640px)] w-[72vw] shrink-0 overflow-hidden rounded-[6px] bg-ink-deep md:w-[25vw]">
          {/* Photo wider than the card; it drifts against the track (StepTrackMotion). */}
          <div data-st-photo className="absolute inset-y-0 -left-[20%] w-[140%] will-change-transform">
            <Image src={photos[i] ?? photos[0]} alt="" fill sizes="(min-width: 768px) 35vw, 100vw" className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.25,1,.5,1)] group-hover:scale-105" />
          </div>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/80" />
          <div className="relative flex h-full flex-col justify-between p-7 md:p-8">
            <span className="font-sans text-[11px] font-medium tracking-[0.3em] text-snow/70 uppercase">{textOr(flow.title, "")}</span>
            <span aria-hidden className="relative block font-display text-[clamp(7rem,12vw,12rem)] leading-[0.8] tracking-[-0.06em]">
              <span className="text-transparent [-webkit-text-stroke:1.2px_rgba(245,241,232,0.7)]">{String(i + 1).padStart(2, "0")}</span>
              <span data-st-fill className="absolute inset-0 text-snow [clip-path:inset(100%_0_0_0)]">
                {String(i + 1).padStart(2, "0")}
              </span>
            </span>
            <h4 className="font-display text-[clamp(1.6rem,2.3vw,2.5rem)] leading-[1.05] text-snow">
              <TbdText value={step.title} slot="Step title" />
            </h4>
          </div>
        </div>
      ))}
    </>
  );
}
