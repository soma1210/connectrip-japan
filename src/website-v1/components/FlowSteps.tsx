import type { HowItWorksFlow, HowItWorksFlowKey } from "@/contracts";
import { FadeIn } from "@/components/ui/FadeIn";
import { CtaLink } from "./CtaLink";
import { reveal, revealGroup } from "./motion/reveal";
import { TbdText } from "./Tbd";

/** One How It Works flow. Step rows follow the current site's ProcessItem styling. */
export function FlowSteps<K extends HowItWorksFlowKey>({
  flow,
  showDescriptions = false,
  sequence = false,
}: {
  flow: HowItWorksFlow<K>;
  showDescriptions?: boolean;
  /** Home only: steps appear one after another on scroll (components/motion). Off = everything shows with the box. */
  sequence?: boolean;
}) {
  const step = (i: number, extra = 0, className = "") => (sequence ? reveal(extra ? "fade" : "up", 0.25 + i * 0.16 + extra, className) : { className });
  const count = flow.steps.length;
  return (
    <FadeIn className="flex flex-col border border-gold/30 bg-navy-dark/40 p-6 md:p-8">
      <div {...(sequence ? revealGroup : {})} className="flex flex-1 flex-col">
      <TbdText value={flow.title} slot="Flow title" as="h3" className="font-heading-en text-2xl tracking-wide text-gold" />
      {flow.summary ? <TbdText value={flow.summary} slot="Flow summary" as="p" className="mt-2 text-sm text-cream/70" /> : null}
      <ol className="mt-6 flex flex-col gap-3">
        {flow.steps.map((item, i) => (
          <li key={item.key} {...step(i, 0, "border border-gold/20 bg-navy-dark/70 px-5 py-4")}>
            <p className="text-base font-medium text-gold">
              {/* The number leads; the words follow a beat later. */}
              <span className="text-red">{i + 1}.</span>{" "}
              <span {...step(i, 0.14)}>
                <TbdText value={item.title} slot="Step title" />
              </span>
            </p>
            {showDescriptions && item.description ? (
              <TbdText value={item.description} slot="Step description" as="p" className="mt-2 text-sm leading-relaxed text-cream/75" />
            ) : null}
          </li>
        ))}
      </ol>
      {/* A note shows only once its copy is decided: the TBD marker was a development placeholder (the item stays TBD in the content). */}
      {flow.note && flow.note.status !== "TBD" ? <TbdText value={flow.note} slot="Flow note" as="p" className="mt-4 text-xs text-cream/60" /> : null}
      {/* CTA pinned to the bottom of the card (mt-auto in the flex column), so side-by-side cards line their buttons up whatever the content above. */}
      <div {...step(count, 0, "mt-auto pt-6")}>
        <CtaLink cta={flow.cta} pair />
      </div>
      </div>
    </FadeIn>
  );
}
