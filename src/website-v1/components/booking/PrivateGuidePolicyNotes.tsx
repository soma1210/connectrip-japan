import { Check, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PRIVATE_GUIDE_V1 } from "../../content/privateGuidePolicy";
import { formatMoney } from "../format";

/**
 * Private Guide v1 conditions (HUMAN_DECISION 2026-10-25, Working Baseline)
 * as short, scannable blocks for the Private Guide page and the booking flow.
 * No hooks: usable from server and client components. Not legal Terms.
 */

const yen = (amount: number) => formatMoney({ amount, currency: "JPY" });
const { group, cutoff } = PRIVATE_GUIDE_V1;

/** Preview label: these conditions are the current baseline, not final Terms. */
export function WorkingBaselineBadge() {
  return (
    <span className="border border-dashed border-gold/60 px-1.5 py-0.5 text-[10px] tracking-[0.1em] text-gold not-italic">WORKING BASELINE</span>
  );
}

export function groupPricingLines(): string[] {
  return [
    `Private group pricing includes up to ${group.includedGuests} paying guests (adults 13+ and children 6–12).`,
    `Additional guests: +${yen(group.extraGuestFee)} per adult. Children aged 6–12 receive reduced pricing: +${yen(group.extraChildFee)} each.`,
    "Young children aged 0–5 join free.",
    `Standard online bookings support up to ${group.maxOnlineGuests} total participants. ${group.maxOnlineGuests + 1}+? Contact us for a group request.`,
  ];
}

export function bookingCutoffLines(): string[] {
  return [
    `More than ${cutoff.onlineBookingHours} hours before your start: book online`,
    `${cutoff.requestHours}–${cutoff.onlineBookingHours} hours before: Request Availability`,
    `Within ${cutoff.requestHours} hours: contact us for special availability`,
  ];
}

export function CancellationSummary({ className }: { className?: string }) {
  return (
    <div className={className}>
      <dl className="text-sm">
        {PRIVATE_GUIDE_V1.cancellation.map((row) => (
          <div key={row.when} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-cream/10 py-2">
            <dt className="text-cream/65">{row.when}</dt>
            <dd className="text-cream">{row.refund}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs leading-relaxed text-cream/55">{PRIVATE_GUIDE_V1.cancellationNote}</p>
    </div>
  );
}

export function BulletList({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-1.5 text-sm leading-relaxed text-cream/80", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden className="mt-2 h-1 w-1 shrink-0 bg-gold/70" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function IncludedLists({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2", className)}>
      <div>
        <p className="mb-3 font-heading-en text-xs tracking-[0.2em] text-gold/80">INCLUDED</p>
        <ul className="flex flex-col gap-2 text-sm text-cream/85">
          {PRIVATE_GUIDE_V1.included.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-3 font-heading-en text-xs tracking-[0.2em] text-cream/50">NOT INCLUDED</p>
        <ul className="flex flex-col gap-2 text-sm text-cream/65">
          {PRIVATE_GUIDE_V1.notIncluded.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-cream/40" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Progressive disclosure: one condition per row, closed by default. */
export function PolicyDisclosure({ title, children, defaultOpen }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-gold/20 py-1 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base text-cream transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
        {title}
        <span aria-hidden className="text-xl leading-none text-gold transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}
