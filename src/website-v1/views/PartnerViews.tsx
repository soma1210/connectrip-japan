import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { externalLinkProps, PARTNER_FORM_URL, recruitHref, routeHref } from "../routes";
import { PRIVACY_POLICY_VISIBLE } from "../content/privacyPolicy";

// Partner Recruitment (ported from the current site's /partner, 2026-10-27).
// 2026-11-18: the recruitment page is shown in English (owner instruction); content and design unchanged.
// 2026-10-28: the old survey's question list was removed; this page only introduces the partner program.

const PARTNER_TYPES = [
  "Restaurants",
  "Hotels & Accommodations",
  "Experience & Activity Providers",
  "Travel Companies & Agencies",
  "Tourist Attractions",
  "Other Tourism Businesses",
];

const COLLABORATION = [
  { title: "Introducing You to Travelers", text: "During guided tours and travel consultations, we introduce your shop, facility or experience to international visitors to Japan." },
  { title: "Including You in Itineraries", text: "We include your business in private guide itineraries and experience plans as a place that is unique to the area." },
  { title: "Sharing Local Appeal Together", text: "Together, we share the culture and appeal of the area through the Connectrip Japan website and on our tours." },
];

const FLOW = [
  { title: "Answer the Survey", text: "Tell us about your business in our survey for businesses." },
  { title: "We Review Your Answers", text: "Connectrip Japan reviews your answers, and a member of our team will contact you if needed." },
  { title: "Discuss Terms & Partnership", text: "We discuss the possibilities for working together, including terms." },
];

// Same classes as CtaLink "primary". Not a CtaLink: the partner survey is not a contract CtaDestination.
const APPLY_CLASS =
  "inline-flex items-center justify-center gap-2 border border-gold bg-red px-8 py-4 text-center text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover";

// 2026-11-02: partner applications are taken by Google Forms (PARTNER_FORM_URL).
// The old in-site survey, its API and data are kept but not linked.
function ApplyButton({ ctaId }: { ctaId: string }) {
  return (
    <a href={PARTNER_FORM_URL} {...externalLinkProps(PARTNER_FORM_URL)} className={APPLY_CLASS} data-cta-id={ctaId} data-cta-position="section">
      Answer the Partner Survey
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

/** Before the Google Form opens: how the answers are used (preview only while the Privacy Policy V1 is a draft). */
function ApplyPrivacyNote() {
  if (!PRIVACY_POLICY_VISIBLE) return null;
  return (
    <p className="mx-auto mt-4 max-w-md text-[11px] leading-relaxed text-cream/55">
      Your answers (Google Form) are used only to consider your partnership and to contact you. For details, please see our
      <Link href={routeHref("privacy")} className="mx-0.5 text-gold underline underline-offset-4 hover:text-cream">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function PartnerRecruitView() {
  return (
    <div lang="en">
      {/* Hero */}
      <section className="bg-navy py-16 text-center md:py-24">
        <Container className="max-w-3xl">
          <p className="text-xs tracking-[0.25em] text-gold">PARTNER PROGRAM</p>
          <h1 className="mt-5 font-heading-jp text-3xl leading-snug text-cream md:text-5xl">
            Bring Local Charm
            <br />
            <span className="text-gold">to Travelers, Together.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-loose text-cream/75 md:text-base">
            Connectrip Japan is looking for partner businesses to bring{" "}
            <br className="hidden sm:inline" />
            unique local experiences and services to international visitors to Japan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-cream/70">
            <span className="inline-flex items-center gap-1.5 border border-gold/30 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Your answers are never made public
            </span>
          </div>
          <div className="mt-10">
            <ApplyButton ctaId="v1_partner_hero_apply" />
            <ApplyPrivacyNote />
          </div>
        </Container>
      </section>

      <div className="bg-cream py-16 text-navy md:py-24">
        <Container className="flex max-w-5xl flex-col gap-16 md:gap-24">
          {/* Who we are looking for */}
          <section>
            <div className="text-center">
              <p className="text-xs tracking-[0.2em] text-red">WHO WE ARE LOOKING FOR</p>
              <h2 className="mt-3 font-heading-jp text-2xl md:text-3xl">Businesses We Are Looking For</h2>
              <p className="mt-4 text-sm leading-relaxed text-navy/65">
                We want to work with more businesses that welcome international visitors, such as:
              </p>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
              {PARTNER_TYPES.map((type) => (
                <li
                  key={type}
                  className="flex min-h-20 items-center justify-center border border-navy/15 bg-white px-3 py-5 text-center text-sm shadow-sm"
                >
                  {type}
                </li>
              ))}
            </ul>
          </section>

          {/* What we want to do together */}
          <section>
            <div className="text-center">
              <p className="text-xs tracking-[0.2em] text-red">COLLABORATION</p>
              <h2 className="mt-3 font-heading-jp text-2xl md:text-3xl">What We Want to Do Together</h2>
            </div>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {COLLABORATION.map((item) => (
                <li key={item.title} className="border border-navy/15 bg-white p-6 shadow-sm md:p-8">
                  <h3 className="font-heading-jp text-lg">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-navy/65">{item.text}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Flow */}
          <section>
            <div className="text-center">
              <p className="text-xs tracking-[0.2em] text-red">FLOW</p>
              <h2 className="mt-3 font-heading-jp text-2xl md:text-3xl">After You Answer</h2>
            </div>
            <ol className="mt-10 flex flex-col gap-3">
              {FLOW.map((item, index) => (
                <li
                  key={item.title}
                  className="flex flex-col gap-2 border border-navy/15 bg-white p-6 shadow-sm md:flex-row md:items-center md:gap-10 md:p-8"
                >
                  <p className="shrink-0 text-lg font-medium md:w-72">
                    <span className="text-red">{String(index + 1).padStart(2, "0")}.</span> {item.title}
                  </p>
                  <p className="text-sm leading-relaxed text-navy/70">{item.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-center text-xs text-navy/50">Answering the survey does not by itself create a partnership.</p>
          </section>
        </Container>
      </div>

      {/* Final CTA */}
      <section className="bg-navy py-16 text-center md:py-20">
        <Container className="max-w-2xl">
          <h2 className="font-heading-jp text-2xl leading-snug text-cream md:text-3xl">
            From One Connection,
            <br />
            New Possibilities for Travel.
          </h2>
          <div className="mt-8">
            <ApplyButton ctaId="v1_partner_bottom_apply" />
            <ApplyPrivacyNote />
          </div>
          <p className="mt-8 text-xs text-cream/55">
            For anything other than the survey, please contact us through{" "}
            <Link href={routeHref("businessInquiry")} className="text-gold underline underline-offset-4 hover:text-cream">
              Business Inquiries
            </Link>
            .
          </p>
        </Container>
      </section>
    </div>
  );
}

// The simple survey form was removed (2026-10-28). The URL stays; the new survey will be placed here.
export function PartnerApplyView() {
  return (
    <div lang="ja">
      <section className="bg-cream py-24 text-center text-navy md:py-32">
        <Container className="max-w-2xl">
          <p className="text-xs tracking-[0.25em] text-red">PARTNER SURVEY</p>
          <h1 className="mt-5 font-heading-jp text-2xl leading-relaxed md:text-3xl">現在準備中です。</h1>
          <p className="mt-6 text-sm leading-loose text-navy/70 md:text-base">
            新しい事業者向けアンケートを近日公開予定です。
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
            <Link href={recruitHref("partner")} className="text-red underline underline-offset-4 hover:text-navy">
              パートナー募集ページへ戻る
            </Link>
            <Link href={routeHref("home")} className="text-red underline underline-offset-4 hover:text-navy">
              トップページへ
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
