import type { ReactNode } from "react";
import type { ExperienceDetailViewModel, ExperiencesListViewModel, Tbd } from "@/contracts";
import { FadeIn } from "@/components/ui/FadeIn";
import { Fact, PageIntro, Section, SectionTitle, TbdBlock } from "../components/Blocks";
import { ExperienceCard } from "../components/Cards";
import { CtaLink } from "../components/CtaLink";
import { formatDuration, formatMoney } from "../components/format";
import { TbdImage, TbdMark, TbdText } from "../components/Tbd";

export function ExperiencesView({ vm }: { vm: ExperiencesListViewModel }) {
  const c = vm.content;
  return (
    <>
      <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="Experiences" />
      <Section>
        {c.items.length === 0 ? (
          <TbdBlock value={{ status: "TBD", note: "No approved Ready-made Experiences yet" }} slot="Experiences" />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {c.items.map((item, i) => (
              <ExperienceCard key={item.id} item={item} delay={i * 0.1} />
            ))}
          </div>
        )}
        {c.privateGuideCta ? (
          <div className="mt-12 border-t border-dashed border-gold/20 pt-10">
            <CtaLink cta={c.privateGuideCta} />
          </div>
        ) : null}
      </Section>
    </>
  );
}

function TbdFact<T>({ label, value, slot, render }: { label: string; value: Tbd<T>; slot: string; render: (v: T) => ReactNode }) {
  return <Fact label={label}>{value.status === "TBD" ? <TbdMark slot={slot} note={value.note} /> : render(value.value)}</Fact>;
}

function TbdList({ value, slot }: { value: Tbd<string[]>; slot: string }) {
  if (value.status === "TBD") return <TbdBlock value={value} slot={slot} />;
  return (
    <ul className="flex flex-col gap-2 text-sm text-cream/80">
      {value.value.map((item) => (
        <li key={item}>— {item}</li>
      ))}
    </ul>
  );
}

export function ExperienceDetailView({ vm }: { vm: ExperienceDetailViewModel }) {
  const e = vm.content;
  const b = e.bookingConditions;
  return (
    <>
      <div className="relative h-[46vh] min-h-[320px] overflow-hidden border-b border-gold/30">
        <TbdImage value={e.image} slot="Experience photo" priority />
      </div>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-10">
            <div>
              <p className="font-heading-en text-xs tracking-[0.3em] text-gold/80">READY-MADE EXPERIENCE · {e.market.toUpperCase()}</p>
              <TbdText value={e.title} slot="Experience title" as="h1" className="mt-4 font-heading-jp text-4xl leading-tight text-cream md:text-5xl" />
              <TbdText value={e.summary} slot="Summary" as="p" className="mt-5 text-sm leading-loose text-cream/80 md:text-base" />
            </div>

            <FadeIn>
              <SectionTitle heading={{ status: "PROPOSED", value: "Highlights" }} slot="Highlights" />
              <TbdList value={e.highlights} slot="Highlights" />
            </FadeIn>

            <FadeIn>
              <SectionTitle heading={{ status: "PROPOSED", value: "Example itinerary" }} slot="Itinerary" />
              {e.itinerary.status === "TBD" ? (
                <TbdBlock value={e.itinerary} slot="Example itinerary" />
              ) : (
                <ol className="flex flex-col gap-3">
                  {e.itinerary.value.steps.map((step, i) => (
                    <li key={i} className="border border-gold/20 bg-navy-dark/70 px-5 py-4 text-gold">
                      <span className="text-red">{i + 1}.</span> <TbdText value={step.title} slot="Step" />
                    </li>
                  ))}
                </ol>
              )}
            </FadeIn>

            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-lg text-gold">Included</h2>
                <TbdList value={e.included} slot="Included" />
              </div>
              <div>
                <h2 className="mb-4 text-lg text-gold">Not included</h2>
                <TbdList value={e.excluded} slot="Excluded" />
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg text-gold">FAQ</h2>
              {e.faq.status === "TBD" ? <TbdBlock value={e.faq} slot="FAQ" /> : null}
            </div>
          </div>

          <aside className="flex h-fit flex-col gap-5 border border-gold/30 bg-navy-dark p-6 lg:sticky lg:top-28">
            <TbdFact label="PRICE" value={e.price.amount} slot="Price" render={formatMoney} />
            <TbdFact label="PRICE UNIT" value={e.price.unit} slot="Price unit" render={(u) => (u === "per_group" ? "per group" : "per person")} />
            <TbdFact label="DURATION" value={e.duration} slot="Duration" render={formatDuration} />
            <TbdFact label="OPTIONS" value={b.options} slot="4h / 8h options" render={(o) => `${o.length} options`} />
            <TbdFact label="GUESTS" value={b.maxGuests} slot="Max guests" render={(n) => `up to ${n}`} />
            <TbdFact label="CHILDREN" value={b.childrenPolicy} slot="Children policy" render={(p) => (p.allowed ? "Welcome" : "Not available")} />
            <TbdFact label="HOURS" value={b.operatingHours} slot="Operating hours" render={(h) => h} />
            <TbdFact label="MEETING POINT" value={e.meetingPoint} slot="Meeting point" render={(m) => m} />
            <TbdFact label="CANCELLATION" value={b.cancellationPolicy} slot="Cancellation policy" render={(p) => p.summary} />
            <div className="flex flex-col gap-3 border-t border-cream/15 pt-5">
              <CtaLink cta={e.cta} />
              {e.bookingState === "closed" ? (
                <p className="text-xs text-cream/50">Booking is not open yet (products, prices and booking are TBD).</p>
              ) : null}
              {e.privateGuideCta ? <CtaLink cta={e.privateGuideCta} variant="text" /> : null}
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
