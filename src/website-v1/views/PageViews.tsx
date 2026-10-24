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
import { TbdImage, TbdMark, TbdText, textOr } from "../components/Tbd";

export function PrivateGuideView({ vm }: { vm: PrivateGuideViewModel }) {
  const c = vm.content;
  return (
    <>
      <div className="relative">
        <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="Private Guide" />
      </div>

      {/* Slot booking (W1-D16): the standard way to book a Private Guide. */}
      {c.booking ? (
        <Section id="book">
          <PrivateGuideBooking model={c.booking} />
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
              {/* With slot booking, Inquiry is the quieter option (W1-D16). */}
              <CtaLink cta={c.inquiryCta} variant={c.booking ? "text" : undefined} />
              {c.experiencesCta ? <CtaLink cta={c.experiencesCta} /> : null}
            </div>
          </div>
        </div>
      </Section>

      <Section tone="navy-dark">
        <div className={c.booking ? "grid gap-10" : "grid gap-10 md:grid-cols-2"}>
          {/* The inquiry-first flow is replaced by the booking steps above (W1-D16). */}
          {c.booking ? null : <FlowSteps flow={c.flow} showDescriptions />}
          <div>
            <h2 className="mb-4 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">EXAMPLE DAYS</h2>
            {c.exampleDays && c.exampleDays.status === "TBD" ? <TbdBlock value={c.exampleDays} slot="Example days" /> : null}
          </div>
        </div>
      </Section>

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
