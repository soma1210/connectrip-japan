import Link from "next/link";
import type { ExperienceSummary, PersonPreview, Tbd, TravelGuideArticleSummary } from "@/contracts";
import { FadeIn } from "@/components/ui/FadeIn";
import { CtaLink } from "./CtaLink";
import { PreviewFlags } from "./guide/GuideParts";
import { formatDuration, formatMoney } from "./format";
import { usdReference } from "../content/exchangeRate";
import { TbdImage, TbdMark, TbdText } from "./Tbd";

function TbdValue<T>({ value, slot, render }: { value: Tbd<T>; slot: string; render: (v: T) => string }) {
  return value.status === "TBD" ? <TbdMark slot={slot} note={value.note} /> : <>{render(value.value)}</>;
}

/** Decided card price ("From ¥24,800 / group") with the approximate USD reference (hidden when the rate is out of date). */
function CardPrice({ label, jpy }: { label: string; jpy: number | null }) {
  const usd = jpy === null ? null : usdReference(jpy);
  return (
    <>
      <span className="text-cream/90">{label}</span>
      {usd !== null ? <span className="mt-0.5 block text-[11px] text-cream/50">≈ ${usd} USD</span> : null}
    </>
  );
}

/** Ready-made Experience card. Visual language of the current site's PlanCard. */
export function ExperienceCard({ item, delay = 0 }: { item: ExperienceSummary; delay?: number }) {
  return (
    <FadeIn delay={delay} className="flex flex-col border border-gold/30 bg-navy-dark/40">
      <Link href={item.href} className="relative block aspect-[4/3] overflow-hidden">
        <TbdImage value={item.image} slot="Experience photo" sizes="(min-width: 768px) 33vw, 100vw" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-dark/80 via-transparent to-transparent" />
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <TbdText value={item.title} slot="Experience title" as="h3" className="font-heading-en text-xl tracking-wide text-gold" />
        <TbdText value={item.summary} slot="Summary" as="p" className="text-sm leading-relaxed text-cream/80" />
        <dl className="grid grid-cols-2 gap-3 text-xs text-cream/70">
          <div>
            <dt className="text-cream/45">Duration</dt>
            <dd className="mt-1">
              <TbdValue value={item.duration} slot="Duration" render={formatDuration} />
            </dd>
          </div>
          <div>
            <dt className="text-cream/45">Price</dt>
            <dd className="mt-1">
              {item.priceLabel && item.price.amount.status !== "TBD" ? (
                <CardPrice label={item.priceLabel} jpy={item.price.amount.value.currency === "JPY" ? item.price.amount.value.amount : null} />
              ) : item.price.amount.status === "TBD" && item.pendingPriceLabel ? (
                item.pendingPriceLabel
              ) : (
                <TbdValue value={item.price.amount} slot="Price" render={formatMoney} />
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-cream/15 pt-4">
          <CtaLink cta={item.cta} variant="text" />
          {item.bookCta ? <CtaLink cta={item.bookCta} size="sm" /> : null}
        </div>
      </div>
    </FadeIn>
  );
}

/**
 * "Coming soon" slot in an Experience list (2026-11-16): same frame as the
 * product card, no link, button, photo, duration or price. The photo area
 * holds a quiet gold frame so the card reads as designed, not empty.
 */
export function ComingSoonCard({ delay = 0 }: { delay?: number }) {
  return (
    <FadeIn delay={delay} className="flex cursor-default flex-col border border-gold/30 bg-navy-dark/40 select-none">
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-8 py-16 text-center md:py-0">
        {/* Inner hairline frame with corner marks. */}
        <div aria-hidden className="pointer-events-none absolute inset-4 border border-gold/15 md:inset-5" />
        {[
          "top-4 left-4 border-t border-l md:top-5 md:left-5",
          "top-4 right-4 border-t border-r md:top-5 md:right-5",
          "bottom-4 left-4 border-b border-l md:bottom-5 md:left-5",
          "bottom-4 right-4 border-b border-r md:bottom-5 md:right-5",
        ].map((corner) => (
          <span key={corner} aria-hidden className={`pointer-events-none absolute h-5 w-5 border-gold/60 md:h-6 md:w-6 ${corner}`} />
        ))}
        <span aria-hidden className="h-px w-12 bg-gold/60" />
        <p className="font-heading-en text-[2rem] leading-tight tracking-[0.18em] text-gold md:text-[2.1rem] lg:text-[2.4rem]">
          COMING
          <br />
          SOON
        </p>
        <span aria-hidden className="h-px w-12 bg-gold/60" />
        <p className="max-w-[16rem] font-heading-en text-sm tracking-wide text-cream/70 italic">New experiences are on the way.</p>
      </div>
    </FadeIn>
  );
}

/** Article card. Visual language of the current site's BlogCard. */
export function ArticleCard({ item, delay = 0 }: { item: TravelGuideArticleSummary; delay?: number }) {
  return (
    <FadeIn delay={delay} className="flex flex-col">
      <Link href={item.href} className="relative block aspect-[4/3] overflow-hidden border border-gold/30">
        <TbdImage value={item.image} slot="Article photo" sizes="(min-width: 1024px) 33vw, 90vw" />
        <PreviewFlags flags={item.previewFlags} className="absolute top-3 left-3" />
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        {item.category ? (
          <span className="text-[11px] tracking-[0.1em] text-gold/80">
            <TbdValue value={item.category} slot="Category" render={(c) => (c.label.status === "TBD" ? "TBD" : c.label.value)} />
          </span>
        ) : null}
        <TbdText value={item.title} slot="Article title" as="h3" className="mt-2 text-base font-medium text-cream" />
        <TbdText value={item.excerpt} slot="Excerpt" as="p" className="mt-2 text-sm leading-relaxed text-cream/70" />
        <div className="mt-4 border-t border-cream/15 pt-3">
          <CtaLink cta={item.cta} variant="text" />
        </div>
      </div>
    </FadeIn>
  );
}

/** Real guide: face + name (+ role). Empty slots render as TBD, never invented. */
export function PersonCard({ person, bio, delay = 0 }: { person: PersonPreview; bio?: Tbd<string>; delay?: number }) {
  return (
    <FadeIn delay={delay} className="flex flex-col">
      <div className="relative aspect-square overflow-hidden border border-gold/30">
        <TbdImage value={person.photo} slot="Real guide photo" sizes="(min-width: 768px) 33vw, 100vw" />
      </div>
      <TbdText value={person.name} slot="Real guide name" as="p" className="mt-4 text-lg text-gold" />
      <TbdText value={person.role} slot="Role" as="p" className="mt-1 text-xs tracking-[0.1em] text-cream/60" />
      {bio ? <TbdText value={bio} slot="Profile" as="p" className="mt-3 text-sm leading-relaxed text-cream/75" /> : null}
    </FadeIn>
  );
}
