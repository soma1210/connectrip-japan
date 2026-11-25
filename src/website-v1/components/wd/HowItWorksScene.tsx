import type { CSSProperties } from "react";
import type { HowItWorksFlows } from "@/contracts";
import { CtaLink } from "../CtaLink";
import { TbdText, textOr } from "../Tbd";
import { HowItWorksMotion } from "./HowItWorksMotion";

/**
 * Home "How It Works" (Human instructions 2026-11-15). Same flows, step
 * titles, notes and CTAs as before (content/howItWorks.ts).
 *
 * Wide screens: the section is held on screen for about one screen of
 * scrolling, in two states, then lets the page move on:
 *   1. Ready-made Experience — its steps and CTA, all at once;
 *   2. Private Guide — its four steps and CTA, all at once.
 * The giant number rolls 01 → 02 with the service, the tab underline glides
 * across, the panels cross-fade with a light slide. The tabs are buttons:
 * choosing one glides the page to that service's part of the scroll, so the
 * scroll position always decides what is shown (click and scroll never
 * disagree). The stage is at least one screen tall and grows with its
 * content (never cut), with room at the top for the fixed header.
 * Phones: both services stacked; the tabs jump to each one.
 * Reduced motion: the same two states, switched without animation.
 */
export function HowItWorksScene({ id, heading, flows }: { id: string; heading: string; flows: HowItWorksFlows }) {
  const list = [flows.readyMade, flows.privateGuide] as const;
  const numbers = list.map((_, f) => String(f + 1).padStart(2, "0"));
  return (
    <section id={id} data-hiw className="relative bg-navy md:h-[220svh]">
      <div data-hiw-stage className="relative overflow-hidden md:sticky md:top-0 md:flex md:min-h-svh md:flex-col md:justify-center">
        {/* Light that follows the active step. */}
        <div data-hiw-glow aria-hidden className="pointer-events-none absolute -top-1/4 left-1/3 hidden h-[80vmax] w-[80vmax] rounded-full bg-[radial-gradient(circle,rgba(201,164,92,0.16),transparent_60%)] md:block" />

        <div className="relative mx-auto w-full max-w-(--container-app) px-5 py-16 md:px-10 md:pt-24 md:pb-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 data-wd-letters aria-label={heading} className="font-heading-en text-5xl font-bold tracking-[0.06em] text-gold [perspective:600px] md:text-7xl">
              {heading.split(" ").map((word, w, words) => (
                <span key={w} aria-hidden className="inline-block whitespace-nowrap">
                  {[...word].map((ch, i) => (
                    <span key={i} data-wd-l className="inline-block">
                      {ch}
                    </span>
                  ))}
                  {w < words.length - 1 ? " " : null}
                </span>
              ))}
            </h1>
            {/* Service tabs: show which service is on screen; choosing one glides the page to it. */}
            <div data-hiw-tabs className="relative flex gap-6 pb-3 md:gap-10">
              {list.map((flow, f) => (
                <button
                  key={flow.key}
                  type="button"
                  data-hiw-tab={f}
                  aria-pressed={f === 0}
                  className="group/tab relative cursor-pointer py-2 font-heading-en text-xs tracking-[0.18em] text-cream/55 uppercase transition-colors duration-500 outline-none [-webkit-tap-highlight-color:transparent] hover:text-cream/90 focus-visible:text-cream data-[on]:text-cream md:text-sm md:text-cream/45"
                >
                  {textOr(flow.title, "")}
                  {/* Hover hint: a faint rule under the tab the pointer is on. */}
                  <span aria-hidden className="absolute inset-x-0 -bottom-3 h-px origin-left scale-x-0 bg-cream/35 transition-transform duration-500 group-hover/tab:scale-x-100 group-focus-visible/tab:scale-x-100" />
                </button>
              ))}
              <span data-hiw-underline aria-hidden className="absolute bottom-0 left-0 hidden h-px w-24 origin-left bg-gold md:block" />
            </div>
          </div>

          <div className="mt-10 md:mt-8 md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:gap-16">
            {/* Giant rolling step number (wide screens). */}
            <div aria-hidden className="relative hidden h-[min(34vh,19rem)] overflow-hidden md:block">
              <div data-hiw-numbers className="will-change-transform">
                {numbers.map((n, i) => (
                  <span
                    key={i}
                    className="block h-[min(34vh,19rem)] font-heading-en text-[min(34vh,19rem)] leading-none font-bold tracking-[-0.04em] text-transparent [-webkit-text-stroke:1.5px_rgba(201,164,92,0.85)]"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <span data-hiw-count className="absolute right-0 bottom-2 font-heading-en text-xs tracking-[0.3em] text-cream/50" />
            </div>

            {/* The flows: laid on top of each other on wide screens (the taller one sets the height), one after the other on phones. */}
            <div className="relative grid gap-14 md:gap-0 md:[&>*]:[grid-area:1/1]">
              {list.map((flow, f) => (
                <div key={flow.key} data-hiw-flow={f} className="scroll-mt-24 md:flex md:flex-col md:justify-center">
                  <TbdText value={flow.title} slot="Flow title" as="h3" className="font-heading-en text-2xl tracking-wide text-gold md:text-3xl" />
                  {flow.summary ? <TbdText value={flow.summary} slot="Flow summary" as="p" className="mt-2 text-sm text-cream/70" /> : null}
                  <ol className="mt-6 flex flex-col gap-1 md:mt-8">
                    {flow.steps.map((step, i) => (
                      <li
                        key={step.key}
                        data-hiw-step={i}
                        style={{ "--i": i } as CSSProperties}
                        className="flex items-baseline gap-5 border-b border-cream/10 py-3.5 md:py-4 [@media(min-width:768px)_and_(max-height:760px)]:py-3"
                      >
                        <span className="w-8 shrink-0 font-heading-en text-sm tracking-[0.12em] text-red">{String(i + 1).padStart(2, "0")}</span>
                        <span className="font-heading-en text-xl leading-snug text-cream md:text-2xl">
                          <TbdText value={step.title} slot="Step title" />
                        </span>
                      </li>
                    ))}
                  </ol>
                  {/* Progress through this flow (wide screens). */}
                  <div aria-hidden className="mt-6 hidden h-px w-full bg-cream/15 md:block">
                    <div data-hiw-bar className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-gold to-red" />
                  </div>
                  {flow.note && flow.note.status !== "TBD" ? <TbdText value={flow.note} slot="Flow note" as="p" className="mt-4 text-xs text-cream/60" /> : null}
                  <div className="mt-8">
                    <CtaLink cta={flow.cta} pair />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <HowItWorksMotion targetId={id} flowCount={list.length} />
    </section>
  );
}
