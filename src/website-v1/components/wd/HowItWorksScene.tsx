import type { CSSProperties } from "react";
import type { HowItWorksFlows } from "@/contracts";
import { CtaLink } from "../CtaLink";
import { TbdText, textOr } from "../Tbd";
import { HowItWorksMotion } from "./HowItWorksMotion";

/**
 * Home "How It Works" as a pinned, step-by-step scene (Human instruction
 * 2026-11-15: much bolder motion, readability kept). Same flows, step titles,
 * notes and CTAs as before (content/howItWorks.ts).
 *
 * Wide screens: the section is held on screen while the scroll walks through
 * all steps — Ready-made Experience 1→4, then Private Guide 1→4:
 *   - a giant step number rolls to the next figure like an odometer;
 *   - the active step grows and brightens, the others stay readable but quiet;
 *   - a progress bar under each flow fills step by step;
 *   - between the flows the first panel is wiped away to the left and the
 *     second arrives from the right; the tab underline glides across;
 *   - a soft light drifts behind the active step.
 * Every step title and both CTAs stay on the page and clickable throughout.
 * Phones / reduced motion: both flows stacked, steps rise one after another.
 */
export function HowItWorksScene({ id, heading, flows }: { id: string; heading: string; flows: HowItWorksFlows }) {
  const list = [flows.readyMade, flows.privateGuide] as const;
  const numbers = list.flatMap((f) => f.steps.map((_, i) => String(i + 1).padStart(2, "0")));
  return (
    <section id={id} data-hiw className="relative bg-navy md:h-[420svh]">
      <div data-hiw-stage className="relative overflow-hidden md:sticky md:top-0 md:flex md:h-svh md:flex-col md:justify-center">
        {/* Light that follows the active step. */}
        <div data-hiw-glow aria-hidden className="pointer-events-none absolute -top-1/4 left-1/3 hidden h-[80vmax] w-[80vmax] rounded-full bg-[radial-gradient(circle,rgba(169,45,58,0.08),transparent_60%)] md:block" />

        <div className="relative mx-auto w-full max-w-(--container-app) px-5 py-16 md:px-10 md:py-0">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 data-wd-letters aria-label={heading} className="font-heading-en text-5xl font-bold tracking-[0.06em] text-gold [perspective:600px] md:text-7xl">
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
            </h2>
            {/* Flow tabs (wide screens): which flow is being walked through; the underline glides between them. */}
            <div data-hiw-tabs aria-hidden className="relative hidden gap-10 pb-3 md:flex">
              {list.map((flow, f) => (
                <span key={flow.key} data-hiw-tab={f} className="font-heading-en text-sm tracking-[0.18em] text-cream/45 uppercase transition-colors duration-500 data-[on]:text-cream">
                  {textOr(flow.title, "")}
                </span>
              ))}
              <span data-hiw-underline className="absolute bottom-0 left-0 h-px w-24 origin-left bg-gold" />
            </div>
          </div>

          <span data-wd-rule aria-hidden className="mt-8 block h-px w-full bg-ink/15" />
          <div className="mt-10 md:mt-8 md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:gap-16">
            {/* Giant rolling step number (wide screens). */}
            <div aria-hidden className="relative hidden h-[min(34vh,19rem)] overflow-hidden md:block">
              <div data-hiw-numbers className="will-change-transform">
                {numbers.map((n, i) => (
                  <span
                    key={i}
                    className="block h-[min(34vh,19rem)] font-heading-en text-[min(34vh,19rem)] leading-none font-bold tracking-[-0.04em] text-transparent [-webkit-text-stroke:1.5px_rgba(22,46,76,0.85)]"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <span data-hiw-count className="absolute right-0 bottom-2 font-heading-en text-xs tracking-[0.3em] text-cream/50" />
            </div>

            {/* The flows: stacked panels on wide screens, one after the other on phones. */}
            <div className="relative grid gap-14 md:block md:min-h-[31rem]">
              {list.map((flow, f) => (
                <div key={flow.key} data-hiw-flow={f} className="md:absolute md:inset-0 md:flex md:flex-col md:justify-center">
                  <TbdText value={flow.title} slot="Flow title" as="h3" className="font-heading-en text-2xl tracking-wide text-gold md:text-3xl" />
                  {flow.summary ? <TbdText value={flow.summary} slot="Flow summary" as="p" className="mt-2 text-sm text-cream/70" /> : null}
                  <ol className="mt-6 flex flex-col gap-1 md:mt-8">
                    {flow.steps.map((step, i) => (
                      <li
                        key={step.key}
                        data-hiw-step={i}
                        style={{ "--i": i } as CSSProperties}
                        className="group/step flex items-baseline gap-5 border-b border-cream/10 py-3.5 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:py-4 md:opacity-40 md:data-[on]:translate-x-3 md:data-[on]:opacity-100 md:data-[done]:opacity-70"
                      >
                        <span className="w-8 shrink-0 font-heading-en text-sm tracking-[0.12em] text-red">{String(i + 1).padStart(2, "0")}</span>
                        <span className="font-heading-en text-xl leading-snug text-cream transition-[font-size,color] duration-700 md:text-2xl md:group-data-[on]/step:text-[2.1rem] md:group-data-[on]/step:text-gold">
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
      <HowItWorksMotion targetId={id} total={numbers.length} perFlow={list.map((f) => f.steps.length)} />
    </section>
  );
}
