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
import { CtaLink } from "../components/CtaLink";
import { FlowSteps } from "../components/FlowSteps";
import { PreviewInquiryForm } from "../components/PreviewInquiryForm";
import { PrivateGuideRequestForm } from "../components/booking/PrivateGuideRequestForm";
import type { PrivateGuideRequestModel } from "../content/privateGuideRequest";
import { PRIVATE_GUIDE_AREAS_NOTE, PRIVATE_GUIDE_FAQ } from "../content/privateGuideFaq";
import { V1_PREVIEW } from "../config";
import { getLayoutViewModel } from "../content/pages";
import { routeHref } from "../routes";
import Link from "next/link";
import { TbdImage, TbdMark, TbdText, textOr } from "../components/Tbd";

/**
 * Private Guide page. `request` is the booking request form (Human
 * instruction 2026-11-09), website-local until the shared request contract
 * exists; when given, it is the page's main action.
 */
export function PrivateGuideView({ vm, request }: { vm: PrivateGuideViewModel; request?: PrivateGuideRequestModel }) {
  const c = vm.content;
  // Public mode leaves out undecided blocks instead of showing empty frames.
  const showPhoto = V1_PREVIEW || c.intro.image.status !== "TBD";
  const showExampleDays = V1_PREVIEW || (c.exampleDays !== undefined && c.exampleDays.status !== "TBD");
  return (
    <>
      <div className="relative">
        <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="Private Guide" />
      </div>

      {request ? (
        <Section id="request" className="scroll-mt-20">
          <PrivateGuideRequestForm model={request} />
        </Section>
      ) : null}
      <Section>
        <div className={showPhoto ? "grid items-start gap-10 md:grid-cols-2" : "grid items-start gap-10"}>
          {showPhoto ? (
            <FadeIn className="relative aspect-[4/3] overflow-hidden border border-gold/30">
              <TbdImage value={c.intro.image} slot="Private Guide photo" sizes="(min-width: 768px) 50vw, 100vw" />
            </FadeIn>
          ) : null}
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="mb-4 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">WHERE</h2>
              <p className="mb-4 max-w-2xl text-sm leading-relaxed text-cream/80">{PRIVATE_GUIDE_AREAS_NOTE}</p>
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
              {/* With the request form on the page, Inquiry is the quieter option. */}
              <CtaLink cta={c.inquiryCta} variant={request ? "text" : undefined} />
              {c.experiencesCta ? <CtaLink cta={c.experiencesCta} /> : null}
            </div>
          </div>
        </div>
      </Section>

      {/* Basic FAQ from the approved booking rules (content/privateGuideFaq.ts). */}
      <Section tone="navy-dark" id="faq">
        <h2 className="mb-8 font-heading-en text-2xl text-cream md:text-3xl">Frequently asked questions</h2>
        <dl className="grid max-w-3xl gap-6">
          {PRIVATE_GUIDE_FAQ.map((item) => (
            <div key={item.question} className="border-t border-cream/15 pt-4">
              <dt className="text-base text-gold">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-cream/80">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {showExampleDays ? (
      <Section tone="navy-dark">
        <div className={request ? "grid gap-10" : "grid gap-10 md:grid-cols-2"}>
          {/* The request form above already shows the booking steps. */}
          {request ? null : <FlowSteps flow={c.flow} showDescriptions />}
          <div>
            <h2 className="mb-4 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">EXAMPLE DAYS</h2>
            {c.exampleDays && c.exampleDays.status === "TBD" ? <TbdBlock value={c.exampleDays} slot="Example days" /> : null}
          </div>
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

/**
 * Public Contact block: the same SNS / WhatsApp links as the footer (W1-D08 /
 * W1-D09, current site accounts) and the booking request form. No email
 * address until one is approved for publication.
 */
function ContactChannels() {
  const social = getLayoutViewModel().nav.footer.social;
  const links = social.status === "TBD" ? [] : social.value;
  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm leading-relaxed text-cream/80">
        To request a private guide, please use our booking request form. For other questions, message us on:
      </p>
      <ul className="flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.platform}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center border border-gold/40 px-5 py-3 text-sm text-gold transition-colors hover:bg-gold hover:text-navy"
            >
              {link.label.status === "TBD" ? link.platform : link.label.value}
            </a>
          </li>
        ))}
      </ul>
      <div>
        <Link
          href={routeHref("privateGuide")}
          className="inline-flex items-center justify-center border border-gold bg-red px-8 py-4 text-center text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover"
        >
          Request a Private Guide
        </Link>
      </div>
    </div>
  );
}

export function InquiryView({ vm }: { vm: InquiryViewModel }) {
  const c = vm.content;
  return (
    <>
      <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="Inquiry" />
      <Section>
        <div className="mx-auto max-w-3xl">
          {/* The inquiry form has no backend (mock): public mode offers the contact channels the site already lists instead. */}
          {V1_PREVIEW ? <PreviewInquiryForm model={c.form} /> : <ContactChannels />}
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
        {V1_PREVIEW || c.updatedAt.status !== "TBD" ? (
          <p className="mb-8 text-xs text-navy/60">
            Last updated: {c.updatedAt.status === "TBD" ? <TbdMark slot="Updated date" tone="light" /> : c.updatedAt.value}
          </p>
        ) : null}
        {c.sections.status === "TBD" ? (
          !V1_PREVIEW ? null : <div className="flex min-h-40 items-center justify-center border border-dashed border-navy/30 p-8 text-center">
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
