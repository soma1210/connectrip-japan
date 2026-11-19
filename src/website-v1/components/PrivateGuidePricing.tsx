import { CircleCheck, CircleX, Users, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { PrivateGuidePricingModel } from "../content/privateGuidePricing";
import { CtaLink } from "./CtaLink";
import { formatMoney } from "./format";

/**
 * Private Guide Pricing (V1, preview only). Same card language as the tour
 * detail pricing: navy cards, thin gold border, gold JPY. One card per group
 * size; inside, Half Day and Full Day sit on the same two rows in every card,
 * so 4 and 8 hours compare across the row on wide screens and stack as cards
 * on phones (no table, no horizontal scroll).
 */
export function PrivateGuidePricing({ model }: { model: PrivateGuidePricingModel }) {
  return (
    <section aria-labelledby="private-guide-pricing" className="bg-navy py-14 text-cream md:py-20">
      <Container className="max-w-5xl">
        <div className="flex items-center gap-4 md:gap-6">
          <span className="h-px flex-1 bg-gold/50" aria-hidden />
          <h2 id="private-guide-pricing" className="text-center font-heading-en text-2xl tracking-wide text-cream md:text-3xl">
            {model.heading}
          </h2>
          <span className="h-px flex-1 bg-gold/50" aria-hidden />
        </div>
        <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-cream/75">{model.description}</p>
        <p className="mt-5 text-center font-heading-en text-xs tracking-[0.2em] text-gold uppercase">{model.basis}</p>

        <ul className="mx-auto mt-8 grid max-w-sm gap-4 md:max-w-none md:grid-cols-3 md:gap-6">
          {model.tiers.map((tier) => (
            <li key={tier.guests} className="flex flex-col rounded-xl border border-gold/40 bg-navy-dark/40 px-6 py-6 text-center">
              <span className="flex items-center justify-center gap-2 font-heading-en text-sm tracking-[0.12em] text-cream uppercase">
                <Users className="h-4 w-4 text-gold" strokeWidth={1.5} aria-hidden />
                {tier.guests}
              </span>
              <dl className="mt-4 flex flex-1 flex-col divide-y divide-gold/15 border-t border-gold/15">
                {model.durations.map((d) => {
                  const price = tier.prices[d.key];
                  return (
                    <div key={d.key} className="flex flex-1 flex-col items-center justify-center gap-1 py-4">
                      <dt className="text-xs tracking-[0.14em] text-cream/60 uppercase">
                        {d.label} <span className="text-cream/40">·</span> {d.hours}
                      </dt>
                      <dd className={price ? "font-heading-en text-3xl tracking-wide text-gold tabular-nums md:text-[2.1rem]" : "font-heading-en text-xl tracking-wide text-gold/85 md:text-2xl"}>
                        {price ? formatMoney(price) : model.customQuote}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {tier.prices.half === null ? (
                <div className="mt-2 flex justify-center">
                  <CtaLink cta={model.largeGroupCta} variant="text" />
                </div>
              ) : (
                <span className="mt-2 text-xs tracking-wide text-cream/55">per group · tax included</span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
          <IncludeList title="What’s Included" icon={CircleCheck} mark="✓" items={model.included} />
          <IncludeList title="What’s Not Included" icon={CircleX} mark="–" items={model.notIncluded} />
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-cream/60">{model.note}</p>

        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <CtaLink cta={model.cta} />
          <p className="max-w-xl text-sm leading-relaxed text-cream/70">{model.ctaSupporting}</p>
        </div>
      </Container>
    </section>
  );
}

function IncludeList({ title, icon: Icon, mark, items }: { title: string; icon: LucideIcon; mark: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-gold/30 bg-navy-dark/40 px-6 py-6 md:px-8">
      <h3 className="flex items-center gap-3 font-heading-en text-lg tracking-wide text-cream">
        <Icon className="h-6 w-6 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-2.5 text-sm text-cream/85">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-0.5 w-3 shrink-0 text-gold" aria-hidden>
              {mark}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
