import Image from "next/image";
import { CircleCheck, CircleX, Clock, Compass, Footprints, Info, JapaneseYen, MapPin, ShoppingBag, Store, Users, type LucideIcon } from "lucide-react";
import type { Experience, ExperienceDetailViewModel, Tbd } from "@/contracts";
import { Container } from "@/components/ui/Container";
import { CtaLink } from "../components/CtaLink";
import { formatDuration, formatMoney } from "../components/format";
import { V1_PREVIEW } from "../config";
import { USD_REFERENCE_RATE, usdReference } from "../content/exchangeRate";
import { IncludeBox, RuleHeading, ToriiIcon } from "./TourDetailView";

/**
 * Ready-made Experience product page (2026-11-16), in the visual language of
 * the existing tour detail page (TourDetailView): navy, gold rules, line
 * icons, serif headings. Sections: title and introduction → highlights →
 * places → pricing (per group, JPY with an approximate USD reference) and
 * what's included → tour information → important notes → booking request.
 *
 * Undecided facts are TBD in the data and read "To Be Confirmed" here; no
 * visit order or times are shown (places are not an itinerary). The booking
 * button is the product's request CTA; it stays disabled while booking is closed.
 */

const TBC = "To Be Confirmed";
const HIGHLIGHT_ICONS: (LucideIcon | typeof ToriiIcon)[] = [ToriiIcon, ShoppingBag, Store, Compass];

function show<T>(value: Tbd<T>, render: (v: T) => string): string {
  return value.status === "TBD" ? TBC : render(value.value);
}

function infoRows(e: Omit<Experience, "seo">): { label: string; value: string; icon: LucideIcon; pending: boolean }[] {
  const price = e.price.amount.status === "TBD" ? (e.pendingPriceLabel ?? TBC) : (e.priceLabel ?? formatMoney(e.price.amount.value));
  const b = e.bookingConditions;
  return [
    { label: "Duration", value: show(e.duration, formatDuration), icon: Clock, pending: e.duration.status === "TBD" },
    { label: "Area", value: show(e.area, (a) => a), icon: MapPin, pending: e.area.status === "TBD" },
    { label: "Tour Type", value: e.tourType ?? TBC, icon: Footprints, pending: !e.tourType },
    { label: "Price", value: price, icon: JapaneseYen, pending: e.price.amount.status === "TBD" },
    { label: "Meeting Point", value: show(e.meetingPoint, (m) => m), icon: MapPin, pending: e.meetingPoint.status === "TBD" },
    { label: "Group Size", value: show(b.maxGuests, (n) => `Up to ${n} guests`), icon: Users, pending: b.maxGuests.status === "TBD" },
  ];
}

export function ExperienceProductView({ vm }: { vm: ExperienceDetailViewModel }) {
  const e = vm.content;
  const title = e.title.status === "TBD" ? "" : e.title.value;
  const intro = e.introduction ?? (e.summary.status === "TBD" ? "" : e.summary.value);
  const highlights = e.highlights.status === "TBD" ? [] : e.highlights.value;
  const image = e.image.status === "TBD" ? null : e.image.value;
  const rows = infoRows(e);
  return (
    <div className="bg-navy text-cream">
      {/* 1–2. Title and introduction */}
      <section className="border-b border-gold/20 pt-9 pb-10 md:pt-12 md:pb-14">
        <Container className="max-w-5xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-heading-en text-xs tracking-[0.25em] text-gold uppercase">{(e.categories ?? []).join(" · ")}</p>
            <span className="h-px w-16 bg-gold/60" aria-hidden />
            {V1_PREVIEW && e.status !== "APPROVED" ? (
              <span className="border border-gold/60 px-2 py-0.5 font-heading-en text-[10px] tracking-[0.2em] text-gold uppercase">Draft · not on sale</span>
            ) : null}
          </div>
          <div className="mt-4 flex items-start justify-between gap-8">
            <div>
              <h1 className="max-w-4xl font-heading-en text-[1.8rem] leading-snug tracking-wide text-cream sm:text-4xl md:text-[2.7rem] md:leading-tight">{title}</h1>
              {e.subtitle ? <p className="mt-3 font-heading-en text-lg tracking-wide text-gold italic md:text-xl">{e.subtitle}</p> : null}
            </div>
            <ToriiIcon className="hidden h-20 w-20 shrink-0 text-gold/70 lg:block" />
          </div>
          <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-cream/85 md:text-[17px]">{intro}</p>
          <ul className="mt-8 grid grid-cols-2 gap-y-5 md:flex md:divide-x md:divide-gold/25">
            {rows.slice(0, 4).map((r) => (
              <li key={r.label} className="flex flex-col items-center gap-2 px-4 text-center md:flex-1">
                <r.icon className="h-6 w-6 text-gold" strokeWidth={1.5} aria-hidden />
                <span className="text-[11px] tracking-[0.16em] text-cream/50 uppercase">{r.label}</span>
                <span className={r.pending ? "text-xs tracking-wide text-cream/70 italic md:text-sm" : "text-xs tracking-wide text-cream/90 md:text-sm"}>{r.value}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {image ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-gold/20 md:aspect-[21/8]">
          <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" style={{ objectPosition: "85% 40%" }} />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-navy/20" />
        </div>
      ) : null}

      {/* 3. Tour Highlights */}
      {highlights.length > 0 ? (
        <section aria-labelledby="tour-highlights" className="pt-12 pb-12 md:pt-16 md:pb-16">
          <Container className="max-w-5xl">
            <RuleHeading id="tour-highlights">Tour Highlights</RuleHeading>
            <ul className="mt-10 grid grid-cols-2 gap-y-10 md:grid-cols-4 md:divide-x md:divide-gold/25">
              {highlights.map((h, i) => {
                const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
                return (
                  <li key={h} className="flex flex-col items-center gap-4 px-3 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/70 md:h-20 md:w-20">
                      <Icon className="h-8 w-8 text-gold md:h-9 md:w-9" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="max-w-[13rem] font-heading-en text-sm leading-snug tracking-wide text-cream md:text-base">{h}</span>
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* 4. Places You'll Explore (no order implied) */}
      {e.places && e.places.length > 0 ? (
        <section aria-labelledby="tour-places" className="py-12 md:py-16">
          <Container className="max-w-5xl">
            <RuleHeading id="tour-places">Places You’ll Explore</RuleHeading>
            <ul className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
              {e.places.map((place) => (
                <li key={place.name} className="flex flex-col gap-3 rounded-xl border border-gold/30 bg-navy-dark/40 px-6 py-7">
                  <MapPin className="h-5 w-5 text-gold" strokeWidth={1.5} aria-hidden />
                  <h3 className="font-heading-en text-xl leading-snug tracking-wide text-cream">
                    {place.name}
                    {place.nameJa ? (
                      <span lang="ja" className="mt-1 block text-sm tracking-normal text-cream/45">
                        {place.nameJa}
                      </span>
                    ) : null}
                  </h3>
                  <p className="text-sm leading-relaxed text-cream/75">{place.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-xs leading-relaxed text-cream/50 italic">The order of visits and the time at each place will be confirmed before booking opens.</p>
          </Container>
        </section>
      ) : null}

      {/* Pricing: one card per group size. JPY is the price; USD is an approximate on-screen reference. */}
      {e.priceTiers && e.priceTiers.length > 0 ? <PricingSection e={e} /> : null}

      {/* What the price includes / excludes */}
      {e.included.status !== "TBD" || e.excluded.status !== "TBD" ? (
        <section aria-label="What's included and not included" className="py-12 md:py-16">
          <Container className="flex max-w-5xl flex-col gap-6">
            {e.included.status !== "TBD" ? <IncludeBox id="whats-included" title="What’s Included" icon={CircleCheck} mark="✓" items={e.included.value} /> : null}
            {e.excluded.status !== "TBD" ? <IncludeBox id="whats-not-included" title="What’s Not Included" icon={CircleX} mark="–" items={e.excluded.value} /> : null}
          </Container>
        </section>
      ) : null}

      {/* 5. Tour Information + 6. Important Notes */}
      <section aria-label="Tour information and important notes" className="py-12 md:py-16">
        <Container className="grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
          <div aria-labelledby="tour-information" className="h-fit rounded-xl border border-gold/40 bg-navy-dark/40">
            <div className="flex items-center gap-3 border-b border-gold/25 px-6 py-4">
              <Info className="h-5 w-5 text-gold" strokeWidth={1.5} aria-hidden />
              <h2 id="tour-information" className="font-heading-en text-xl tracking-wide text-cream">
                Tour Information
              </h2>
            </div>
            <dl className="px-6 py-2">
              {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-3 border-b border-cream/10 py-3 text-sm last:border-b-0">
                  <r.icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
                  <dt className="text-cream/90">{r.label}</dt>
                  <dd className={r.pending ? "ml-auto text-right text-cream/60 italic" : "ml-auto text-right text-cream/80"}>{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {e.importantNotes && e.importantNotes.length > 0 ? (
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-8 bg-gold/50" aria-hidden />
                <h2 id="important-notes" className="font-heading-en text-2xl tracking-wide text-cream md:text-3xl">
                  Important Notes
                </h2>
                <span className="h-px flex-1 bg-gold/50" aria-hidden />
              </div>
              <ul className="mt-7 flex flex-col gap-4 text-sm leading-relaxed text-cream/80 md:text-[15px]">
                {e.importantNotes.map((n) => (
                  <li key={n} className="flex gap-3">
                    <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-gold/80" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Container>
      </section>

      {/* 7. Booking Request: request-first, disabled while booking is closed. */}
      <section className="border-t border-gold/20 py-14 md:py-20">
        <Container className="flex max-w-5xl flex-col items-center gap-4 text-center">
          <CtaLink cta={e.cta} pair className="h-16! w-80! max-w-full text-base!" />
          <p className="max-w-md text-xs leading-relaxed text-cream/55">
            {e.bookingState === "closed"
              ? "Booking requests for this tour will open once the price and tour details are confirmed."
              : "This is a booking request, not an instant booking. We check availability and reply to confirm."}
          </p>
          {e.privateGuideCta ? (
            <p className="mt-2 text-sm text-cream/70">
              Want a day planned around you instead? <CtaLink cta={e.privateGuideCta} variant="text" />
            </p>
          ) : null}
        </Container>
      </section>
    </div>
  );
}

function PricingSection({ e }: { e: Omit<Experience, "seo"> }) {
  const tiers = (e.priceTiers ?? []).map((t) => ({ ...t, usd: usdReference(t.price.amount) }));
  const showUsd = tiers.some((t) => t.usd !== null);
  return (
    <section aria-labelledby="tour-pricing" className="pt-12 pb-2 md:pt-16 md:pb-4">
      <Container className="max-w-5xl">
        <RuleHeading id="tour-pricing">Pricing — Private Group Tour</RuleHeading>
        <p className="mt-3 text-center text-sm text-cream/70">
          {e.duration.status !== "TBD" ? `${formatDuration(e.duration.value)} · ` : ""}One price for your whole group
        </p>
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
              <span className="text-xs tracking-wide text-cream/55">per group, not per person</span>
            </li>
          ))}
        </ul>
        {e.priceNote ? <p className="mt-6 text-center text-xs leading-relaxed text-cream/60">{e.priceNote}</p> : null}
        {showUsd ? (
          <p className="mx-auto mt-2 max-w-xl text-center text-[11px] leading-relaxed text-cream/45">
            USD amounts are approximate (¥{USD_REFERENCE_RATE.jpyPerUsd.toFixed(0)} = $1, reference rate of {USD_REFERENCE_RATE.asOf}) and may vary with exchange rates.
          </p>
        ) : null}
      </Container>
    </section>
  );
}
