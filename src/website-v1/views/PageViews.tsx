import type {
  AboutViewModel,
  HowItWorksViewModel,
  InquiryViewModel,
  LegalPageViewModel,
  PrivateGuideViewModel,
} from "@/contracts";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { LegalPageHeader } from "@/components/ui/LegalPageHeader";
import { PageIntro, Section, SectionTitle, TbdBlock } from "../components/Blocks";
import { PersonCard } from "../components/Cards";
import { CtaLink } from "../components/CtaLink";
import { FlowSteps } from "../components/FlowSteps";
import { PreviewInquiryForm } from "../components/PreviewInquiryForm";
import { PrivateGuideBooking } from "../components/booking/PrivateGuideBooking";
import {
  BulletList,
  CancellationSummary,
  IncludedLists,
  PolicyDisclosure,
  WorkingBaselineBadge,
  bookingCutoffLines,
  groupPricingLines,
} from "../components/booking/PrivateGuidePolicyNotes";
import { formatMoney } from "../components/format";
import { fromMinutes, toMinutes } from "../booking/privateGuideSlots";
import { PRIVATE_GUIDE_V1 } from "../content/privateGuidePolicy";
import { cn } from "@/lib/cn";
import { TbdImage, TbdMark, TbdText, textOr } from "../components/Tbd";

export function PrivateGuideView({ vm }: { vm: PrivateGuideViewModel }) {
  const c = vm.content;
  return (
    <>
      <div className="relative">
        <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="Private Guide" />
      </div>

      {/* The next step (Unified Booking Flow v1): book, or ask first. Two separate routes. */}
      {c.bookingEntry ? (
        <Section id="book" tone="navy-dark" className="py-10! md:py-14!">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="font-heading-en text-xs tracking-[0.25em] text-gold/80">READY TO BOOK?</p>
              <p className="mt-3 text-sm leading-relaxed text-cream/75">
                Choose 4, 6 or 8 hours, pick a date and start time, then book and pay online. Connectrip confirms once your guide is
                secured, and then we plan the day together.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <CtaLink cta={c.bookingEntry.book} />
              <CtaLink cta={c.bookingEntry.ask} variant="text" />
            </div>
          </div>
        </Section>
      ) : c.booking ? (
        <Section id="book">
          <PrivateGuideBooking model={c.booking} />
        </Section>
      ) : null}

      {c.bookingEntry ? <PrivateGuidePlans book={c.bookingEntry.book} /> : null}

      {c.why ? (
        <Section>
          <SectionTitle heading={c.why.heading} slot="Why a Private Guide" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {c.why.points.map((point, i) => (
              <li key={i} className="border border-gold/25 bg-navy-dark/40 px-5 py-5">
                <TbdText value={point.title} slot="Why title" as="p" className="text-base text-gold" />
                <TbdText value={point.description} slot="Why description" as="p" className="mt-2 text-sm leading-relaxed text-cream/75" />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section>
        <div className="grid items-start gap-10 md:grid-cols-2">
          <FadeIn className="relative aspect-[4/3] overflow-hidden border border-gold/30">
            <TbdImage value={c.intro.image} slot="Private Guide photo" sizes="(min-width: 768px) 50vw, 100vw" />
          </FadeIn>
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="mb-4 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">WHERE</h2>
              <ul className="flex flex-wrap gap-2">
                {c.areas.map((area) => (
                  <li key={area.key} className="border border-gold/40 px-4 py-2 text-sm text-gold">
                    <TbdText value={area.label} slot={`Area: ${area.key}`} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">WHAT YOU CAN DO</h2>
              <ul className="grid grid-cols-2 gap-2">
                {c.activities.map((a) => (
                  <li key={a.key} className="border border-cream/15 px-4 py-2 text-sm text-cream/85">
                    <TbdText value={a.label} slot={`Activity: ${a.key}`} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-4 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">PRICING</h2>
              <TbdText value={c.pricingNote} slot="Pricing note" as="p" className="text-sm text-cream/80" />
            </div>
            <div className="flex flex-wrap gap-4">
              {/* With the booking entry above, "Have a question first?" already leads to Inquiry. */}
              {c.bookingEntry ? null : <CtaLink cta={c.inquiryCta} variant={c.booking ? "text" : undefined} />}
              {c.experiencesCta ? <CtaLink cta={c.experiencesCta} /> : null}
            </div>
          </div>
        </div>
      </Section>

      <Section tone="navy-dark">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
          {/* Booking-first steps (Human Decision 2026-10-25). The old inquiry-first flow is not shown here. */}
          {c.bookingSteps ? (
            <div>
              <h2 className="mb-4 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">
                <TbdText value={c.bookingSteps.heading} slot="How It Works" className="uppercase" />
              </h2>
              <ol className="flex flex-col gap-3">
                {c.bookingSteps.steps.map((step, i) => (
                  <li key={i} className="flex gap-4 border border-gold/20 bg-navy-dark/70 px-5 py-4">
                    <span className="font-heading-en text-sm text-red">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <TbdText value={step.title} slot="Step title" as="p" className="text-base font-medium text-gold" />
                      <TbdText value={step.description} slot="Step description" as="p" className="mt-1.5 text-sm leading-relaxed text-cream/75" />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : c.booking ? null : (
            <FlowSteps flow={c.flow} showDescriptions />
          )}
          <div>
            <h2 className="mb-4 flex flex-wrap items-center gap-3 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">
              EXAMPLE DAYS
              <span className="border border-dashed border-gold/60 px-1.5 py-0.5 text-[10px] tracking-[0.1em] text-gold not-italic">EXAMPLES ONLY</span>
            </h2>
            {c.exampleDays && c.exampleDays.status === "TBD" ? <TbdBlock value={c.exampleDays} slot="Example days" /> : null}
            {c.exampleDays && c.exampleDays.status !== "TBD" ? (
              <>
                <ul className="flex flex-col gap-3">
                  {c.exampleDays.value.map((day, i) => (
                    <li key={i} className="border border-gold/25 bg-navy/60 px-5 py-4">
                      <TbdText value={day.title} slot="Example day" as="p" className="font-heading-en text-lg text-cream" />
                      <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
                        {day.itinerary.steps.map((step, j) => (
                          <div key={j} className="contents">
                            <dt className="text-cream/50">
                              <TbdText value={step.title} slot="Time of day" />
                            </dt>
                            <dd className="text-cream/80">{step.description ? <TbdText value={step.description} slot="Example stop" /> : null}</dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-cream/50">
                  Illustrative examples, not fixed tours. Every private day is planned with you after booking.
                </p>
              </>
            ) : null}
          </div>
        </div>
      </Section>

      {c.bookingEntry ? <PrivateGuideGoodToKnow /> : null}

      {c.bookingEntry ? (
        <Section className="py-12! md:py-16!">
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="font-heading-jp text-2xl text-cream md:text-3xl">Ready to plan your private day?</p>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <CtaLink cta={c.bookingEntry.book} />
              <CtaLink cta={c.bookingEntry.ask} variant="text" />
            </div>
          </div>
        </Section>
      ) : null}

      {c.guides ? (
        <Section>
          <SectionTitle heading={{ status: "PROPOSED", value: "Meet Our Guides" }} slot="Guides" />
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {c.guides.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}

const yen = (amount: number) => formatMoney({ amount, currency: "JPY" });

/** Private Guide v1 plans and group pricing (HUMAN_DECISION 2026-10-25, Working Baseline). */
function PrivateGuidePlans({ book }: { book: NonNullable<PrivateGuideViewModel["content"]["bookingEntry"]>["book"] }) {
  const { plans, hours } = PRIVATE_GUIDE_V1;
  const lastStart = (h: number) => fromMinutes(toMinutes(hours.windowEnd) - h * 60);
  return (
    <Section id="plans">
      <SectionTitle heading={{ status: "PROPOSED", value: "Plans & Pricing" }} slot="Plans" />
      <ul className="grid gap-5 pt-3 md:grid-cols-3">
        {plans.map((p) => (
          <li
            key={p.id}
            className={cn(
              "relative flex flex-col border bg-navy-dark/40 px-6 pt-7 pb-6",
              p.popular ? "border-gold ring-1 ring-gold" : "border-gold/30",
            )}
          >
            {p.popular ? (
              <span className="absolute -top-3 left-6 bg-gold px-2.5 py-0.5 text-[10px] tracking-[0.15em] text-navy">MOST POPULAR</span>
            ) : null}
            <p className="font-heading-en text-2xl tracking-wide text-gold">
              {p.hours} Hours{p.tagline ? <span className="ml-2 text-sm text-cream/55">· {p.tagline}</span> : null}
            </p>
            <p className="mt-4 font-heading-en text-3xl text-cream">{yen(p.price)}</p>
            <p className="text-xs text-cream/55">per private group, not per person</p>
            <ul className="mt-5 flex flex-col gap-1.5 border-t border-cream/15 pt-4 text-sm text-cream/75">
              <li>{p.spots.replace(/^approx\./, "Approx.")}</li>
              <li>Up to {PRIVATE_GUIDE_V1.group.includedGuests} paying guests included</li>
              <li>
                Start {hours.windowStart}&ndash;{lastStart(p.hours)}
              </li>
            </ul>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 flex flex-wrap items-center gap-3 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">
            GROUP SIZE &amp; FAMILIES <WorkingBaselineBadge />
          </p>
          <BulletList items={groupPricingLines()} />
        </div>
        <CtaLink cta={book} />
      </div>
    </Section>
  );
}

/** Included items open; cutoff, cancellation and weather behind disclosures to keep the page scannable. */
function PrivateGuideGoodToKnow() {
  return (
    <Section>
      <SectionTitle heading={{ status: "PROPOSED", value: "Good to Know" }} slot="Good to know" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <IncludedLists />
        <div>
          <p className="mb-1 flex flex-wrap items-center gap-3 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">
            BOOKING &amp; POLICIES <WorkingBaselineBadge />
          </p>
          <PolicyDisclosure title="Booking cutoff">
            <BulletList items={bookingCutoffLines()} />
          </PolicyDisclosure>
          <PolicyDisclosure title="Cancellation policy">
            <CancellationSummary />
          </PolicyDisclosure>
          <PolicyDisclosure title="Weather">
            <BulletList items={PRIVATE_GUIDE_V1.weather} />
          </PolicyDisclosure>
        </div>
      </div>
    </Section>
  );
}

export function HowItWorksView({ vm }: { vm: HowItWorksViewModel }) {
  const c = vm.content;
  return (
    <>
      <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="How It Works" />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <FlowSteps flow={c.flows.readyMade} showDescriptions />
          <FlowSteps flow={c.flows.privateGuide} showDescriptions />
        </div>
        {c.faq && c.faq.status === "TBD" ? (
          <div className="mt-14">
            <h2 className="mb-4 text-lg text-gold">FAQ</h2>
            <TbdBlock value={c.faq} slot="FAQ" />
          </div>
        ) : null}
      </Section>
    </>
  );
}

export function AboutView({ vm }: { vm: AboutViewModel }) {
  const c = vm.content;
  return (
    <>
      <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="About" />
      <Section>
        <SectionTitle heading={c.guides.heading} slot="Guides" />
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {c.guides.people.map((p) => (
            <PersonCard key={p.id} person={p} bio={p.bio} />
          ))}
        </div>
      </Section>
      <Section tone="navy-dark">
        <SectionTitle heading={c.company.heading} slot="Company" />
        {c.company.facts.status === "TBD" ? (
          <TbdBlock value={c.company.facts} slot="Company information" />
        ) : (
          <dl className="grid gap-4">
            {c.company.facts.value.map((f, i) => (
              <div key={i} className="grid gap-2 border-t border-cream/15 pt-3 md:grid-cols-[200px_1fr]">
                <dt className="text-xs text-cream/50">{textOr(f.label, "TBD")}</dt>
                <dd className="text-sm text-cream/85">{textOr(f.value, "TBD")}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-12 flex flex-wrap gap-4">
          <CtaLink cta={c.experiencesCta} />
          <CtaLink cta={c.privateGuideCta} />
        </div>
      </Section>
    </>
  );
}

export function InquiryView({ vm }: { vm: InquiryViewModel }) {
  const c = vm.content;
  return (
    <>
      <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="Inquiry" />
      <Section>
        <div className="mx-auto max-w-3xl">
          <PreviewInquiryForm model={c.form} />
        </div>
      </Section>
    </>
  );
}

/** Same layout as the current site's legal pages (cream background). */
export function LegalView({ vm }: { vm: LegalPageViewModel }) {
  const c = vm.content;
  return (
    <div className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-3xl">
        <LegalPageHeader heading={textOr(c.title, "TBD")} subheading={vm.route === "privacy" ? "PRIVACY POLICY" : "TERMS"} />
        <p className="mb-8 text-xs text-navy/60">
          Last updated: {c.updatedAt.status === "TBD" ? <TbdMark slot="Updated date" tone="light" /> : c.updatedAt.value}
        </p>
        {c.sections.status === "TBD" ? (
          <div className="flex min-h-40 items-center justify-center border border-dashed border-navy/30 p-8 text-center">
            <TbdMark slot="Legal text" note={c.sections.note} tone="light" />
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {c.sections.value.map((s) => (
              <section key={s.heading}>
                <h2 className="text-lg">{s.heading}</h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="mt-3 text-sm leading-loose text-navy/80">{p}</p>
                ))}
              </section>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
