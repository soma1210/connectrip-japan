import type { ReactNode } from "react";
import Link from "next/link";
import { Amphora, CircleCheck, CircleX, Clock, Flag, Footprints, Globe, Hammer, Info, MapPin, ShoppingBag, Users, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FeaturedTourBooking, type BookingMode } from "../components/booking/FeaturedTourBooking";
import { TOUR_REQUEST_NOTICE } from "../booking/tourBookingRequest";
import type { FeaturedTour } from "../content/featuredTour";
import { usdReference } from "../content/exchangeRate";
import { CANCELLATION_POLICY_VISIBLE } from "../content/cancellationPolicy";
import { PRIVACY_FORM_NOTICE, PRIVACY_POLICY_VISIBLE } from "../content/privacyPolicy";
import { routeHref } from "../routes";
import { formatMoney } from "../components/format";

/**
 * Fixed-tour detail page (Human instruction 2026-11-13, layout from the owner's
 * mock-up). Navy only, no photos, gold lines and icons between sections. The
 * one booking button sits at the bottom; there is none in the header area.
 */

/** Torii gate in the lucide line style (lucide has no torii icon). */
export function ToriiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 5c3 1 17 1 20 0" />
      <path d="M4 9h16" />
      <path d="M6 6v15M18 6v15" />
      <path d="M12 6.2V9" />
    </svg>
  );
}

const HIGHLIGHT_ICONS: Record<FeaturedTour["highlights"][number]["key"], LucideIcon | typeof ToriiIcon> = {
  shrine: ToriiIcon,
  craft: Hammer,
  souvenir: Amphora,
  local: ShoppingBag,
};

const FACT_ICONS: Record<string, LucideIcon> = {
  Duration: Clock,
  Time: Clock,
  Guests: Users,
  "Tour Type": Footprints,
  Language: Globe,
  "Meeting Area": MapPin,
  "End Point": Flag,
};

/** Gold rule with a centred heading, as in the mock-up. */
export function RuleHeading({ children, id }: { children: ReactNode; id: string }) {
  return (
    <div className="flex items-center gap-4 md:gap-6">
      <span className="h-px flex-1 bg-gold/50" aria-hidden />
      <h2 id={id} className="font-heading-en text-2xl tracking-wide text-cream md:text-3xl">
        {children}
      </h2>
      <span className="h-px flex-1 bg-gold/50" aria-hidden />
    </div>
  );
}

/** Included / Not Included box: heading on the left (top on mobile), list on the right. */
export function IncludeBox({ id, title, icon: Icon, mark, items, note }: { id: string; title: string; icon: LucideIcon; mark: string; items: string[]; note?: string }) {
  return (
    <div className="grid gap-6 rounded-xl border border-gold/30 bg-navy-dark/40 px-6 py-7 md:grid-cols-[17rem_1fr] md:items-center md:gap-10 md:px-10">
      <div className="flex items-center gap-3 md:pr-8">
        <Icon className="h-8 w-8 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
        <h2 id={id} className="font-heading-en text-2xl tracking-wide text-cream">
          {title}
        </h2>
      </div>
      <div>
        <ul className="flex flex-col gap-2.5 text-sm text-cream/85">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 w-3 shrink-0 text-gold" aria-hidden>
                {mark}
              </span>
              {item}
            </li>
          ))}
        </ul>
        {note ? <p className="mt-4 text-xs leading-relaxed text-cream/55 italic">{note}</p> : null}
      </div>
    </div>
  );
}

export function TourDetailView({ tour, bookingMode = "mock" }: { tour: FeaturedTour; bookingMode?: BookingMode }) {
  // Header row: the short facts only (time and end point are in the Tour Details card).
  const quick = tour.detailFacts.filter((f) => f.label !== "Time" && f.label !== "End Point");
  // Official price in JPY; USD is an approximate on-screen reference (null when the rate is missing or out of date).
  const tiers = tour.pricing.tiers.map((t) => ({ ...t, usd: usdReference(t.price.amount) }));
  const showUsd = tiers.some((t) => t.usd !== null);
  return (
    <div className="bg-navy text-cream">
      {/* Header block: eyebrow, title, tagline, quick facts. No booking button here. */}
      <section className="border-b border-gold/20 py-9 md:py-10">
        <Container className="max-w-5xl">
          <div className="flex items-center gap-4">
            <p className="font-heading-en text-xs tracking-[0.25em] text-gold uppercase">Private Walking Tour</p>
            <span className="h-px w-16 bg-gold/60" aria-hidden />
          </div>
          <div className="mt-3 flex items-start justify-between gap-8">
            <h1 className="max-w-4xl font-heading-en text-[1.65rem] leading-snug tracking-wide text-cream sm:text-3xl md:text-[2.4rem] md:leading-tight">{tour.title}</h1>
            <ToriiIcon className="hidden h-20 w-20 shrink-0 text-gold/70 lg:block" />
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/80 md:text-base">{tour.tagline}</p>
          <ul className="mt-7 grid grid-cols-2 gap-y-5 sm:grid-cols-3 md:flex md:divide-x md:divide-gold/25">
            {quick.map((f) => {
              const Icon = FACT_ICONS[f.label] ?? Info;
              return (
                <li key={f.label} className="flex flex-col items-center gap-2 px-4 text-center md:flex-1">
                  <Icon className="h-6 w-6 text-gold" strokeWidth={1.5} aria-hidden />
                  <span className="sr-only">{f.label}: </span>
                  <span className="text-xs tracking-wide text-cream/90 md:text-sm">{f.value}</span>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Tour Highlights */}
      <section aria-labelledby="tour-highlights" className="pt-8 pb-12 md:pt-10 md:pb-16">
        <Container className="max-w-5xl">
          <RuleHeading id="tour-highlights">Tour Highlights</RuleHeading>
          <ul className="mt-10 grid grid-cols-2 gap-y-10 md:grid-cols-4 md:divide-x md:divide-gold/25">
            {tour.highlights.map((h) => {
              const Icon = HIGHLIGHT_ICONS[h.key];
              return (
                <li key={h.key} className="flex flex-col items-center gap-4 px-3 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/70 md:h-20 md:w-20">
                    <Icon className="h-8 w-8 text-gold md:h-9 md:w-9" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="font-heading-en text-sm leading-snug tracking-wide text-cream md:text-base">{h.label}</span>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Tour Schedule + Tour Details card */}
      <section aria-labelledby="tour-schedule" className="py-12 md:py-16">
        <Container className="grid max-w-5xl gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
          <div>
            <div className="flex items-center gap-4">
              <span className="h-px w-8 bg-gold/50" aria-hidden />
              <h2 id="tour-schedule" className="font-heading-en text-2xl tracking-wide text-cream md:text-3xl">
                Tour Schedule <span className="text-base text-cream/70 md:text-lg">(3 Hours)</span>
              </h2>
              <span className="h-px flex-1 bg-gold/50" aria-hidden />
            </div>
            <ol className="relative mt-8 flex flex-col gap-7">
              {tour.schedule.map((s) => (
                // Mobile: time label above the title; from sm: label column on the left.
                <li key={s.time} className="relative grid grid-cols-[11px_1fr] items-start gap-x-4 gap-y-2 sm:grid-cols-[11px_auto_1fr] sm:gap-x-5">
                  <span className="mt-2 h-[11px] w-[11px] rounded-full bg-gold" aria-hidden />
                  <span className="w-fit rounded-full sm:w-[8.5rem] bg-gold/90 px-2 py-1 text-center font-heading-en text-xs font-semibold whitespace-nowrap text-navy-dark sm:text-sm">
                    {s.time}
                  </span>
                  <div className="col-start-2 sm:col-start-auto">
                    <h3 className="font-heading-en text-base leading-snug text-cream md:text-lg">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-cream/70">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs leading-relaxed text-cream/50 italic">
              Times and shop visits may vary depending on opening hours and local conditions. Ema, wish-ball offerings, and souvenir purchases
              are optional and paid directly on-site.
            </p>
          </div>

          <aside aria-labelledby="tour-details" className="h-fit rounded-xl border border-gold/40 bg-navy-dark/40">
            <div className="flex items-center gap-3 border-b border-gold/25 px-6 py-4">
              <Info className="h-5 w-5 text-gold" strokeWidth={1.5} aria-hidden />
              <h2 id="tour-details" className="font-heading-en text-xl tracking-wide text-cream">
                Tour Details
              </h2>
            </div>
            <dl className="px-6 py-2">
              {tour.detailFacts.map((f) => {
                const Icon = FACT_ICONS[f.label] ?? Info;
                return (
                  <div key={f.label} className="flex items-center gap-3 border-b border-cream/10 py-3 text-sm last:border-b-0">
                    <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                    <dt className="text-cream/90">{f.label}</dt>
                    <dd className="ml-auto text-right text-cream/75">{f.value}</dd>
                  </div>
                );
              })}
            </dl>
          </aside>
        </Container>
      </section>

      {/* Private Tour Pricing: per group, tax included. No booking button in the cards. */}
      <section aria-labelledby="tour-pricing" className="pt-12 pb-2 md:pt-16 md:pb-4">
        <Container className="max-w-5xl">
          <RuleHeading id="tour-pricing">{tour.pricing.heading}</RuleHeading>
          <p className="mt-3 text-center text-sm text-cream/70">{tour.pricing.subheading}</p>
          <ul className="mx-auto mt-8 grid max-w-sm gap-4 md:max-w-none md:grid-cols-3 md:gap-6">
            {tiers.map((t) => (
              <li key={t.guests} className="flex flex-col items-center gap-2 rounded-xl border border-gold/40 bg-navy-dark/40 px-6 py-7 text-center">
                <span className="flex items-center gap-2 font-heading-en text-sm tracking-[0.12em] text-cream uppercase">
                  <Users className="h-4 w-4 text-gold" strokeWidth={1.5} aria-hidden />
                  {t.guests}
                </span>
                <span className="font-heading-en text-4xl tracking-wide text-gold tabular-nums md:text-[2.6rem]">{formatMoney(t.price)}</span>
                {t.usd !== null ? (
                  <span className="-mt-1 font-heading-en text-base tracking-wide text-cream/75 tabular-nums md:text-[1.05rem]">
                    <span aria-hidden>≈ ${t.usd} USD</span>
                    <span className="sr-only">approximately {t.usd} US dollars</span>
                  </span>
                ) : null}
                <span className="text-xs tracking-wide text-cream/55">per group · tax included</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-xs leading-relaxed text-cream/60">{tour.pricing.note}</p>
          {showUsd ? <p className="mx-auto mt-2 max-w-xl text-center text-[11px] leading-relaxed text-cream/45">{tour.pricing.usdNote}</p> : null}
          {/* Shown only while the policy itself is shown (preview until legally approved). */}
          {CANCELLATION_POLICY_VISIBLE ? (
            <p className="mt-4 text-center text-xs">
              <Link href={routeHref("cancelPolicy")} className="text-cream/70 underline decoration-gold/50 underline-offset-4 hover:text-gold">
                Cancellation &amp; Refund Policy
              </Link>
            </p>
          ) : null}
        </Container>
      </section>

      {/* What's Included / Not Included. Guide service only: on-site costs are paid by guests directly. */}
      <section aria-label="What's included and not included" className="py-12 md:py-16">
        <Container className="flex max-w-5xl flex-col gap-6">
          <IncludeBox id="whats-included" title="What’s Included" icon={CircleCheck} mark="✓" items={tour.included} />
          <IncludeBox id="whats-not-included" title="What’s Not Included" icon={CircleX} mark="–" items={tour.notIncluded} note={tour.notIncludedNote} />
        </Container>
      </section>

      {/* The only booking button on the page. Request-first: nothing is confirmed instantly. */}
      <section className="border-t border-gold/20 py-14 md:py-20">
        <Container className="flex max-w-5xl flex-col items-center gap-4 text-center">
          {/* Larger than the shared pair box; `!` because cn() does not resolve class conflicts. */}
          <FeaturedTourBooking tour={tour} mode={bookingMode} className="h-16! w-80! text-base!" />
          <p className="max-w-md text-xs leading-relaxed text-cream/55">{TOUR_REQUEST_NOTICE}</p>
          {PRIVACY_POLICY_VISIBLE ? (
            <p className="max-w-md text-xs leading-relaxed text-cream/55">
              {PRIVACY_FORM_NOTICE}{" "}
              <Link href={routeHref("privacy")} className="text-cream/70 underline decoration-gold/50 underline-offset-4 hover:text-gold">
                Privacy Policy
              </Link>
            </p>
          ) : null}
        </Container>
      </section>
    </div>
  );
}
