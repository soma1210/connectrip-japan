import type { HowItWorksFlow, HowItWorksFlowKey } from "@/contracts";
import { FadeIn } from "@/components/ui/FadeIn";
import { CtaLink } from "./CtaLink";
import { TbdText } from "./Tbd";

/** One How It Works flow. Step rows follow the current site's ProcessItem styling. */
export function FlowSteps<K extends HowItWorksFlowKey>({
  flow,
  showDescriptions = false,
  pairCta = false,
}: {
  flow: HowItWorksFlow<K>;
  showDescriptions?: boolean;
  /** Side-by-side flows: same CTA box in each card, pinned to the card bottom so the two line up. */
  pairCta?: boolean;
}) {
  return (
    <FadeIn className="flex flex-col border border-gold/30 bg-navy-dark/40 p-6 md:p-8">
      <TbdText value={flow.title} slot="Flow title" as="h3" className="font-heading-en text-2xl tracking-wide text-gold" />
      {flow.summary ? <TbdText value={flow.summary} slot="Flow summary" as="p" className="mt-2 text-sm text-cream/70" /> : null}
      <ol className="mt-6 flex flex-col gap-3">
        {flow.steps.map((step, i) => (
          <li key={step.key} className="border border-gold/20 bg-navy-dark/70 px-5 py-4">
            <p className="text-base font-medium text-gold">
              <span className="text-red">{i + 1}.</span> <TbdText value={step.title} slot="Step title" />
            </p>
            {showDescriptions && step.description ? (
              <TbdText value={step.description} slot="Step description" as="p" className="mt-2 text-sm leading-relaxed text-cream/75" />
            ) : null}
          </li>
        ))}
      </ol>
      {flow.note ? <TbdText value={flow.note} slot="Flow note" as="p" className="mt-4 text-xs text-cream/60" /> : null}
      <div className={pairCta ? "mt-auto pt-6" : "mt-6"}>
        <CtaLink cta={flow.cta} size="sm" pair={pairCta} />
      </div>
    </FadeIn>
  );
}
