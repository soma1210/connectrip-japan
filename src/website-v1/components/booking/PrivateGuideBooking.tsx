"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Info, Minus, Plus } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  ctaDataAttributes,
  type AboutYourTripContent,
  type PrivateGuideBookingModel,
  type PrivateGuideBookingRequest,
  type PrivateGuideBookingSubmitHandler,
  type PrivateGuidePlan,
  type Tbd,
} from "@/contracts";
import { cn } from "@/lib/cn";
import {
  formatDuration,
  groupQuote,
  totalParticipants,
  type Party,
  planStartTimeOptions,
  quote,
  slotBookingMode,
  type GroupQuote,
  type SlotBookingMode,
  type StartTimeOption,
} from "../../booking/privateGuideSlots";
import { PRIVATE_GUIDE_V1, v1Plan } from "../../content/privateGuidePolicy";
import { formatMoney } from "../format";
import { TbdMark, TbdText, textOr } from "../Tbd";
import { AboutYourTrip, type AboutYourTripErrors, type AboutYourTripValues } from "./AboutYourTrip";
import {
  BulletList,
  CancellationSummary,
  IncludedLists,
  PolicyDisclosure,
  WorkingBaselineBadge,
  bookingCutoffLines,
} from "./PrivateGuidePolicyNotes";

/**
 * Private Guide Unified Booking Flow v1 (PROTOTYPE / PENDING HUMAN VISUAL
 * REVIEW), built on the W1-D16 slot booking: 01 plan → 02 date → 03 start
 * time → 04 guests → 05 about your trip → 06 booking summary → Continue to
 * Payment. In `prototype` mode Continue to Payment validates, then only shows
 * a notice: no booking, no payment, no API, no email.
 *
 * Desktop: the flow left, sticky summary right. Below `lg`: one column; step 06
 * is the summary and holds the CTA.
 *
 * Without `details` (the old embedded use) it behaves as before: steps 01–04.
 */

/** DEMO handler: resolves locally. Live: create PENDING_PAYMENT, then go to payment. */
const prototypeSubmit: PrivateGuideBookingSubmitHandler = async () => ({ ok: true });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SelectionField = "plan" | "date" | "time";
type BookingErrors = AboutYourTripErrors & Partial<Record<SelectionField, string>>;

/** Focus order = page order. */
const FOCUS_TARGET: Record<keyof BookingErrors, string> = {
  plan: "pg-plan",
  date: "pg-date",
  time: "pg-time",
  fullName: "pg-fullName",
  email: "pg-email",
  country: "pg-country",
  arriving: "pg-arriving",
  leaving: "pg-leaving",
  consent: "pg-consent",
};

const EMPTY_DETAILS: AboutYourTripValues = {
  fullName: "",
  email: "",
  country: "",
  arriving: "",
  leaving: "",
  interests: [],
  tripDescription: "",
  source: "",
  consent: false,
};

const shortDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const longDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const monthLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });

const { group, cutoff, hours, ageGroups } = PRIVATE_GUIDE_V1;
const yen = (amount: number) => formatMoney({ amount, currency: "JPY" });

/**
 * The booking cutoff (48 h / 24 h) depends on the visitor's clock, not the
 * cached page: read it on the client only (null while server rendering, so
 * every start renders as online until hydration), refreshed every minute.
 */
const subscribeMinute = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const noClock = (): number | null => null;

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const monthKey = (isoDate: string) => isoDate.slice(0, 7);

function StepHeading({ n, children }: { n: number; children: string }) {
  return (
    <h3 className="flex items-center gap-3 text-lg text-cream md:text-xl">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold text-xs text-gold">{n}</span>
      {children}
    </h3>
  );
}

function DemoBadge({ children = "DEMO" }: { children?: string }) {
  return <span className="border border-dashed border-gold/60 px-1.5 py-0.5 text-[10px] tracking-[0.1em] text-gold">{children}</span>;
}

function PlanCard({ plan, selected, onSelect }: { plan: PrivateGuidePlan; selected: boolean; onSelect: () => void }) {
  const price = quote(plan);
  const popular = v1Plan(plan.id)?.popular;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex w-full flex-col gap-3 border p-5 text-left transition-colors",
        selected ? "border-gold bg-navy-dark ring-1 ring-gold" : "border-gold/30 bg-navy-dark/40 hover:border-gold/70",
        popular && !selected && "border-gold/70",
      )}
    >
      {popular ? (
        <span className="absolute -top-2.5 left-4 bg-gold px-2 py-0.5 text-[10px] tracking-[0.15em] text-navy">MOST POPULAR</span>
      ) : null}
      <span className="flex items-start justify-between gap-3">
        <TbdText value={plan.name} slot="Plan name" className="font-heading-en text-lg tracking-wide text-gold" />
        <span
          aria-hidden
          className={cn("mt-1 h-4 w-4 shrink-0 rounded-full border", selected ? "border-gold bg-red shadow-[inset_0_0_0_3px_var(--color-navy-dark)]" : "border-cream/40")}
        />
      </span>
      <span className="flex items-center gap-2 text-xs text-cream/70">
        <Clock className="h-3.5 w-3.5 text-gold/70" aria-hidden />
        {formatDuration(plan.durationMinutes)}
      </span>
      {plan.summary ? <TbdText value={plan.summary} slot="Plan summary" as="span" className="text-sm leading-relaxed text-cream/75" /> : null}
      <span className="mt-auto flex flex-col gap-0.5 border-t border-cream/15 pt-3">
        <span className="flex flex-wrap items-center gap-2 text-base text-cream">
          {price ? formatMoney(price) : <TbdMark slot="Price" />}
          <span className="text-xs text-cream/50">per private group</span>
          {plan.demo ? <DemoBadge>DEMO PRICE</DemoBadge> : null}
        </span>
        <span className="text-[11px] text-cream/50">Up to {group.includedGuests} paying guests included</span>
      </span>
    </button>
  );
}

function Calendar({
  dates,
  selected,
  isOpen,
  onSelect,
}: {
  dates: string[];
  selected?: string;
  isOpen: (date: string) => boolean;
  onSelect: (date: string) => void;
}) {
  const months = useMemo(() => Array.from(new Set(dates.map(monthKey))).sort(), [dates]);
  const [monthIndex, setMonthIndex] = useState(0);
  const month = months[monthIndex];
  if (!month) return <TbdMark slot="Available dates" />;

  const first = utc(`${month}-01`);
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => iso(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), i + 1)))),
  ];

  return (
    <div className="border border-gold/30 bg-navy-dark/40 p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
          disabled={monthIndex === 0}
          aria-label="Previous month"
          className="p-1.5 text-gold transition-colors hover:text-cream disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-heading-en text-base tracking-wide text-cream">{monthLabel.format(first)}</p>
        <button
          type="button"
          onClick={() => setMonthIndex((i) => Math.min(months.length - 1, i + 1))}
          disabled={monthIndex === months.length - 1}
          aria-label="Next month"
          className="p-1.5 text-gold transition-colors hover:text-cream disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] tracking-[0.08em] text-cream/45">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;
          const open = isOpen(date);
          const isSelected = date === selected;
          return (
            <button
              key={date}
              type="button"
              disabled={!open}
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-label={`${longDate.format(utc(date))}${open ? "" : ", unavailable"}`}
              className={cn(
                "aspect-square text-sm transition-colors",
                isSelected && "border border-gold bg-red text-cream",
                !isSelected && open && "border border-gold/25 text-cream hover:border-gold hover:text-gold",
                !open && "cursor-not-allowed text-cream/20 line-through",
              )}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-cream/50">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 border border-gold/40" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 bg-red" /> Selected
        </span>
        <span className="line-through">Unavailable</span>
      </p>
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  canIncrease = true,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  canIncrease?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-cream/15 py-4 last:border-b-0">
      <div>
        <p className="text-base text-cream">{label}</p>
        {hint ? <p className="text-xs text-cream/50">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Fewer ${label.toLowerCase()}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 text-gold transition-colors hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-lg text-cream" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={!canIncrease}
          aria-label={`More ${label.toLowerCase()}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 text-gold transition-colors hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, placeholder }: { label: string; value?: string; placeholder: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-cream/10 py-2.5 text-sm">
      <dt className="text-cream/55">{label}</dt>
      <dd className={cn("text-right", value ? "text-cream" : "text-cream/35 italic")}>{value ?? placeholder}</dd>
    </div>
  );
}

/** Base group, additional adults / children (5th–6th paying guest) and total; 7+ participants is a group request. */
function PriceBreakdown({ q, tooMany, demo }: { q?: GroupQuote; tooMany: boolean; demo?: boolean }) {
  return (
    <div className="mt-5">
      {q ? (
        <dl>
          <SummaryRow label="Base group" value={formatMoney(q.base)} placeholder="—" />
          {q.extraAdults > 0 ? (
            <SummaryRow
              label={`Additional ${q.extraAdults === 1 ? "adult" : "adults"} (${q.extraAdults} \u00d7 ${yen(group.extraGuestFee)})`}
              value={`+${formatMoney(q.adultExtra)}`}
              placeholder="—"
            />
          ) : null}
          {q.extraChildren > 0 ? (
            <SummaryRow
              label={`Additional ${q.extraChildren === 1 ? "child" : "children"} (${q.extraChildren} \u00d7 ${yen(group.extraChildFee)})`}
              value={`+${formatMoney(q.childExtra)}`}
              placeholder="—"
            />
          ) : null}
        </dl>
      ) : null}
      <div className="mt-4 flex items-end justify-between gap-4">
        <span className="text-sm text-cream/70">Total</span>
        <span className="text-right">
          <span className="block font-heading-en text-3xl text-cream">{q ? formatMoney(q.total) : "—"}</span>
          {q && demo ? <DemoBadge>DEMO PRICE</DemoBadge> : null}
        </span>
      </div>
      {tooMany ? (
        <p className="mt-1 text-right text-[11px] text-cream/55">
          {group.maxOnlineGuests + 1}+ participants: group request
        </p>
      ) : q ? (
        <p className="mt-1 text-right text-[11px] text-cream/45">Per private group, not per person · taxes TBD</p>
      ) : null}
    </div>
  );
}

/** "2 Adults · 2 Children · 1 Young Child" (empty groups left out). */
function partyLabel(p: Party): string {
  const part = (n: number, one: string, many: string) => (n > 0 ? `${n} ${n === 1 ? one : many}` : null);
  return [part(p.adults, "Adult", "Adults"), part(p.children, "Child", "Children"), part(p.youngChildren, "Young Child", "Young Children")]
    .filter(Boolean)
    .join(" \u00b7 ");
}

function StepError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-xs text-[#e6a19a]">
      {message}
    </p>
  ) : null;
}

export function PrivateGuideBooking({
  model,
  details,
  paymentNotice,
}: {
  model: PrivateGuideBookingModel;
  /** Step 05 content. When present, the unified flow (05 + 06 + Continue to Payment). */
  details?: AboutYourTripContent;
  paymentNotice?: Tbd<string>;
}) {
  const { availability, plans } = model;
  const [planId, setPlanId] = useState<string>();
  const [date, setDate] = useState<string>();
  const [time, setTime] = useState<string>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [youngChildren, setYoungChildren] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [trip, setTrip] = useState<AboutYourTripValues>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<BookingErrors>({});
  const unified = Boolean(details);

  const now = useSyncExternalStore(subscribeMinute, currentMinute, noClock);
  const plan = plans.find((p) => p.id === planId);
  // Before a plan is chosen, a date counts as open if any plan fits.
  const minDuration = plan?.durationMinutes ?? Math.min(...plans.map((p) => p.durationMinutes));
  const modeOf = (d: string, o: StartTimeOption): SlotBookingMode => (now === null ? "online" : slotBookingMode(d, o.time, now, cutoff));
  /** Starts the plan can use on a date (ending by 20:00), minus starts already past. */
  const optionsFor = (d: string, duration: number) =>
    planStartTimeOptions(availability, d, duration)
      .map((o) => ({ ...o, mode: modeOf(d, o) }))
      .filter((o) => o.mode !== "past");
  const selectable = (o: { available: boolean; mode: SlotBookingMode }) => o.available && (o.mode === "online" || o.mode === "request");
  const options = date ? optionsFor(date, minDuration) : [];
  const selectedOption = options.find((o) => o.time === time && selectable(o));
  // Kept apart on purpose: young children count as participants, never as paying guests.
  const party: Party = { adults, children, youngChildren };
  const tooMany = totalParticipants(party) > group.maxOnlineGuests;
  const price = plan ? groupQuote(plan, party, group) : undefined;
  // 24–48 h starts and 7+ groups leave the standard booking for a request / contact path.
  const altPath: "group" | "request" | null = tooMany ? "group" : selectedOption?.mode === "request" ? "request" : null;
  const ready = Boolean(plan && date && selectedOption?.mode === "online" && adults >= 1 && !tooMany);
  const countryName = details?.countries.find((c) => c.value === trip.country)?.label;
  const interestNames = details
    ? details.interests.filter((o) => trip.interests.includes(o.value)).map((o) => textOr(o.label, o.value))
    : [];

  function updateTrip<K extends keyof AboutYourTripValues>(key: K, value: AboutYourTripValues[K]) {
    setTrip((t) => ({ ...t, [key]: value }));
    setSubmitted(false);
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): BookingErrors {
    const e: BookingErrors = {};
    if (!plan) e.plan = "Please choose a plan.";
    if (!date) e.date = "Please choose a date.";
    if (!selectedOption) e.time = "Please choose a start time.";
    if (!unified) return e;
    if (!trip.fullName.trim()) e.fullName = "Please enter your full name.";
    if (!trip.email.trim()) e.email = "Please enter your email.";
    else if (!EMAIL.test(trip.email.trim())) e.email = "Please enter a valid email address.";
    if (!trip.country) e.country = "Please choose your country of residence.";
    if (!trip.arriving) e.arriving = "Please enter your arrival date.";
    if (!trip.leaving) e.leaving = "Please enter your departure date.";
    else if (trip.arriving && trip.leaving < trip.arriving) e.leaving = "Leaving can\u2019t be before arriving.";
    if (!trip.consent) e.consent = "Please agree to continue.";
    return e;
  }

  async function continueToPayment() {
    if (altPath) return;
    if (!unified) {
      setSubmitted(true);
      return;
    }
    const next = validate();
    setErrors(next);
    const first = (Object.keys(FOCUS_TARGET) as (keyof BookingErrors)[]).find((k) => next[k]);
    if (first) {
      const el = document.getElementById(FOCUS_TARGET[first]);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!plan || !date || !selectedOption) return;
    // One request, separate parts (customer / booking / trip / acquisition / consent).
    // `youngChildren` is Website-local until the shared booking contract has it (children = 6–12 here).
    const request: PrivateGuideBookingRequest & { selection: { youngChildren: number } } = {
      selection: { planId: plan.id, bookingDate: date, startTime: selectedOption.time, adults, children, youngChildren },
      customer: { fullName: trip.fullName.trim(), email: trip.email.trim(), countryOfResidence: trip.country },
      trip: {
        arriving: trip.arriving,
        leaving: trip.leaving,
        interests: trip.interests,
        tripDescription: trip.tripDescription.trim() || undefined,
      },
      acquisition: { selfReportedSource: trip.source || undefined },
      consent: { acceptedAt: new Date().toISOString() },
    };
    const result = await prototypeSubmit(request);
    if (result.ok) setSubmitted(true);
  }
  const isDemo = model.mode === "prototype" || plans.some((p) => p.demo) || availability.source === "mock";

  // Keep the selection valid when the plan or date changes.
  function choosePlan(id: string) {
    const next = plans.find((p) => p.id === id);
    setPlanId(id);
    setSubmitted(false);
    setErrors((e) => ({ ...e, plan: undefined }));
    if (next && date && time) {
      const o = optionsFor(date, next.durationMinutes).find((x) => x.time === time);
      if (!o || !selectable(o)) setTime(undefined);
    }
  }
  function chooseDate(next: string) {
    setDate(next);
    setSubmitted(false);
    setErrors((e) => ({ ...e, date: undefined }));
    if (time) {
      const o = optionsFor(next, minDuration).find((x) => x.time === time);
      if (!o || !selectable(o)) setTime(undefined);
    }
  }
  function changeGuests(setter: (v: number) => void, v: number) {
    setter(v);
    setSubmitted(false);
  }

  const guestsLabel = partyLabel(party);

  const ctaClass =
    "mt-6 inline-flex min-h-12 w-full items-center justify-center border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red";

  const cta = altPath ? (
    // Not a standard booking: a request / contact path (Inquiry for now), never payment.
    <>
      <Link href={model.questions.cta.href} {...ctaDataAttributes(model.questions.cta)} className={ctaClass}>
        {altPath === "request" ? "Request Availability" : "Contact Us for a Group Request"}
      </Link>
      <p className="mt-3 text-xs leading-relaxed text-cream/65">
        {altPath === "request"
          ? `This start is ${cutoff.requestHours}–${cutoff.onlineBookingHours} hours away, so it can’t be booked online. Send us a request and we’ll check whether a guide is available.`
          : `Online booking is for up to ${group.maxOnlineGuests} participants, young children included. For ${group.maxOnlineGuests + 1} or more, contact us and we’ll check what we can arrange.`}
      </p>
    </>
  ) : (
    <>
      <button type="button" disabled={!unified && !ready} onClick={continueToPayment} className={ctaClass}>
        <TbdText value={model.bookLabel} slot="Book CTA" />
      </button>
      {!unified && !ready ? <p className="mt-2 text-center text-[11px] text-cream/45">Choose a plan, date and start time to continue.</p> : null}
      {unified && Object.values(errors).some(Boolean) ? (
        <p className="mt-2 text-center text-[11px] text-[#e6a19a]">Please check the highlighted fields.</p>
      ) : null}

      {submitted && model.mode === "prototype" ? (
        <div role="status" className="mt-4 border border-dashed border-gold/60 bg-navy px-4 py-3 text-xs leading-relaxed text-cream/80">
          <p className="font-medium text-gold">
            {paymentNotice ? <TbdText value={paymentNotice} slot="Payment notice" /> : "Prototype: the booking backend is not connected yet."}
          </p>
          <p className="mt-1">
            Nothing was booked or charged. In the live version you pay online first; your booking is confirmed once Connectrip has secured your
            guide.
          </p>
          {model.plannerPreview ? (
            <Link
              href={model.plannerPreview.href}
              {...ctaDataAttributes(model.plannerPreview)}
              className="mt-2 inline-block text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold"
            >
              <TbdText value={model.plannerPreview.label} slot="Planner preview" /> →
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
      {/* Choices */}
      <div className="flex flex-col gap-12">
        {isDemo ? (
          <p className="flex items-start gap-2 border border-dashed border-gold/40 bg-navy-dark/60 px-4 py-3 text-xs leading-relaxed text-cream/70">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
            Prototype for review: open dates are mock availability, and nothing can be booked or paid yet. Plans, prices and hours follow
            the current Working Baseline.
          </p>
        ) : null}

        <section className="flex flex-col gap-5" aria-labelledby="pg-plan">
          <div id="pg-plan" tabIndex={-1} className="flex flex-col gap-2 focus:outline-none">
            <StepHeading n={1}>Choose your plan</StepHeading>
            <StepError id="pg-plan-error" message={errors.plan} />
          </div>
          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} selected={p.id === planId} onSelect={() => choosePlan(p.id)} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5" aria-labelledby="pg-date">
          <div id="pg-date" tabIndex={-1} className="flex flex-col gap-2 focus:outline-none">
            <StepHeading n={2}>Choose a date</StepHeading>
            <StepError id="pg-date-error" message={errors.date} />
          </div>
          <Calendar
            dates={availability.dates}
            selected={date}
            isOpen={(d) => optionsFor(d, minDuration).some((o) => o.available)}
            onSelect={chooseDate}
          />
        </section>

        <section className="flex flex-col gap-5" aria-labelledby="pg-time">
          <div id="pg-time" tabIndex={-1} className="flex flex-wrap items-baseline justify-between gap-2 focus:outline-none">
            <StepHeading n={3}>Choose a start time</StepHeading>
            {plan ? <span className="text-xs text-cream/55">Your guide stays with you for {formatDuration(plan.durationMinutes)}</span> : null}
            <span className="basis-full">
              <StepError id="pg-time-error" message={errors.time} />
            </span>
          </div>
          {!date ? (
            <p className="border border-dashed border-cream/20 px-5 py-6 text-sm text-cream/55">Pick a date to see available start times.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {options.map((o) => {
                const selected = o.time === time && selectable(o);
                const enabled = selectable(o);
                const note = o.mode === "request" ? "On request" : o.mode === "contact" ? "Contact us" : plan ? `→ ${o.end}` : null;
                return (
                  <button
                    key={o.time}
                    type="button"
                    disabled={!enabled}
                    onClick={() => {
                      setTime(o.time);
                      setSubmitted(false);
                      setErrors((e) => ({ ...e, time: undefined }));
                    }}
                    aria-pressed={selected}
                    aria-label={`${o.time}${plan ? ` to ${o.end}` : ""}${
                      !o.available ? ", unavailable" : o.mode === "request" ? ", on request" : o.mode === "contact" ? ", within 24 hours: contact us" : ""
                    }`}
                    className={cn(
                      "flex flex-col items-center gap-0.5 border px-2 py-2.5 transition-colors",
                      selected && "border-gold bg-red text-cream",
                      !selected && enabled && o.mode === "online" && "border-gold/30 text-cream hover:border-gold hover:text-gold",
                      !selected && enabled && o.mode === "request" && "border-dashed border-gold/50 text-cream/80 hover:border-gold hover:text-gold",
                      !enabled && "cursor-not-allowed border-cream/10 text-cream/25",
                    )}
                  >
                    <span className={cn("text-base", !o.available && "line-through")}>{o.time}</span>
                    {note ? <span className={cn("text-[10px]", selected ? "text-cream/85" : "text-cream/45")}>{note}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
          {date && !plan ? <p className="text-xs text-cream/50">Choose a plan to see when your day would end.</p> : null}
          <p className="text-xs leading-relaxed text-cream/50">
            Start times are on the hour. Your guide day runs within {hours.windowStart}&ndash;{hours.windowEnd} and always ends by {hours.windowEnd}.
          </p>
          {options.some((o) => o.mode === "request") ? (
            <p className="border-l-2 border-gold/50 pl-3 text-xs leading-relaxed text-cream/70">
              Starts {cutoff.requestHours}&ndash;{cutoff.onlineBookingHours} hours away are <span className="text-cream">on request</span>: we
              check guide availability before anything is booked.
            </p>
          ) : null}
          {options.some((o) => o.mode === "contact") ? (
            <p className="border-l-2 border-gold/50 pl-3 text-xs leading-relaxed text-cream/70">
              Starts within {cutoff.requestHours} hours can&apos;t be booked online.{" "}
              <Link
                href={model.questions.cta.href}
                {...ctaDataAttributes(model.questions.cta)}
                className="text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold"
              >
                Contact us
              </Link>{" "}
              to ask about special availability.
            </p>
          ) : null}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="pg-guests">
          <div id="pg-guests">
            <StepHeading n={4}>Who&apos;s joining?</StepHeading>
          </div>
          <div className="border border-gold/30 bg-navy-dark/40 px-5">
            <Stepper label={ageGroups.adults} value={adults} min={1} canIncrease={!tooMany} onChange={(v) => changeGuests(setAdults, v)} />
            <Stepper label={ageGroups.children} value={children} min={0} canIncrease={!tooMany} onChange={(v) => changeGuests(setChildren, v)} />
            <Stepper
              label={ageGroups.youngChildren}
              value={youngChildren}
              min={0}
              canIncrease={!tooMany}
              onChange={(v) => changeGuests(setYoungChildren, v)}
            />
          </div>
          <p className="text-xs leading-relaxed text-cream/55">
            Up to {group.includedGuests} paying guests are included in the base price. Young children aged 0&ndash;5 join free.
          </p>
          {tooMany ? (
            <div role="status" className="border border-gold/60 bg-navy-dark px-4 py-3 text-sm leading-relaxed text-cream/85">
              <p className="text-gold">Group of {group.maxOnlineGuests + 1} or more?</p>
              <p className="mt-1">
                Online booking is for up to {group.maxOnlineGuests} participants, young children included.{" "}
                <Link
                  href={model.questions.cta.href}
                  {...ctaDataAttributes(model.questions.cta)}
                  className="text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold"
                >
                  Contact us for a group request
                </Link>
                .
              </p>
            </div>
          ) : null}
        </section>

        {details ? (
          <section className="flex flex-col gap-5" aria-labelledby="pg-about">
            <div id="pg-about" className="flex flex-col gap-2">
              <StepHeading n={5}>{textOr(details.heading, "About your trip")}</StepHeading>
              <TbdText value={details.supporting} slot="About your trip" as="p" className="text-sm text-cream/60" />
            </div>
            <AboutYourTrip content={details} values={trip} errors={errors} bookingDate={date} onChange={updateTrip} />
          </section>
        ) : null}

        {details ? (
          <section className="flex flex-col gap-5" aria-labelledby="pg-review">
            <div id="pg-review">
              <StepHeading n={6}>Booking Summary</StepHeading>
            </div>
            <div className="border border-gold/40 bg-navy-dark p-5 md:p-7">
              <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
                <div>
                  <p className="font-heading-en text-xs tracking-[0.2em] text-gold/80">YOUR PRIVATE GUIDE</p>
                  <dl className="mt-2">
                    <SummaryRow label="Plan" value={plan ? textOr(plan.name, "Plan") : undefined} placeholder="Choose a plan" />
                    <SummaryRow label="Date" value={date ? longDate.format(utc(date)) : undefined} placeholder="Choose a date" />
                    <SummaryRow label="Start time" value={selectedOption?.time} placeholder="Choose a start time" />
                    <SummaryRow label="Duration" value={plan ? formatDuration(plan.durationMinutes) : undefined} placeholder="—" />
                    <SummaryRow label="Adults (13+)" value={String(adults)} placeholder="—" />
                    <SummaryRow label="Children (6\u201312)" value={String(children)} placeholder="—" />
                    <SummaryRow label="Young Children (0\u20135)" value={String(youngChildren)} placeholder="—" />
                  </dl>
                </div>
                <div>
                  <p className="font-heading-en text-xs tracking-[0.2em] text-gold/80">YOU</p>
                  <dl className="mt-2">
                    <SummaryRow label="Name" value={trip.fullName.trim() || undefined} placeholder="—" />
                    <SummaryRow label="Email" value={trip.email.trim() || undefined} placeholder="—" />
                    <SummaryRow label="Country" value={countryName} placeholder="—" />
                  </dl>
                  <p className="mt-5 font-heading-en text-xs tracking-[0.2em] text-gold/80">YOUR TRIP</p>
                  <dl className="mt-2">
                    <SummaryRow label="Arriving" value={trip.arriving ? shortDate.format(utc(trip.arriving)) : undefined} placeholder="—" />
                    <SummaryRow label="Leaving" value={trip.leaving ? shortDate.format(utc(trip.leaving)) : undefined} placeholder="—" />
                    <SummaryRow label="Interests" value={interestNames.length ? interestNames.join(", ") : undefined} placeholder="—" />
                  </dl>
                </div>
              </div>
              <div className="mt-6 border-t border-cream/15 pt-1">
                <PriceBreakdown q={price} tooMany={tooMany} demo={plan?.demo} />
              </div>
              {/* Below lg the sticky summary is hidden: the CTA lives here. */}
              <div className="lg:hidden">{cta}</div>
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-4 border-t border-dashed border-gold/20 pt-10" aria-labelledby="pg-info">
          <h3 id="pg-info" className="font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">
            HOW BOOKING WORKS
          </h3>
          <ol className="grid gap-3 sm:grid-cols-2">
            {model.steps.map((step, i) => (
              <li key={i} className="flex gap-3 border border-gold/20 bg-navy-dark/60 px-4 py-3 text-sm text-cream/85">
                <span className="text-red">{i + 1}.</span>
                <TbdText value={step} slot="Booking step" />
              </li>
            ))}
          </ol>
          <div className="mt-2">
            <p className="mb-1 flex flex-wrap items-center gap-3 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">
              GOOD TO KNOW <WorkingBaselineBadge />
            </p>
            <PolicyDisclosure title="Cancellation policy">
              <CancellationSummary />
            </PolicyDisclosure>
            <PolicyDisclosure title="Weather">
              <BulletList items={PRIVATE_GUIDE_V1.weather} />
            </PolicyDisclosure>
            <PolicyDisclosure title="Booking cutoff">
              <BulletList items={bookingCutoffLines()} />
            </PolicyDisclosure>
            <PolicyDisclosure title="What’s included">
              <IncludedLists />
            </PolicyDisclosure>
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className={cn("lg:sticky lg:top-28", unified && "hidden lg:block")} aria-labelledby="pg-summary">
        <div className="border border-gold/40 bg-navy-dark p-6 md:p-7">
          <p id="pg-summary" className="font-heading-en text-xs tracking-[0.25em] text-gold/80">
            YOUR PRIVATE GUIDE
          </p>
          <dl className="mt-4">
            <SummaryRow label="Plan" value={plan ? textOr(plan.name, "Plan") : undefined} placeholder="Choose a plan" />
            <SummaryRow label="Date" value={date ? longDate.format(utc(date)) : undefined} placeholder="Pick a date" />
            <SummaryRow
              label="Time"
              value={selectedOption ? (plan ? `${selectedOption.time} → ${selectedOption.end}` : selectedOption.time) : undefined}
              placeholder="Choose a start time"
            />
            <SummaryRow label="Duration" value={plan ? formatDuration(plan.durationMinutes) : undefined} placeholder="—" />
            <SummaryRow label="Guests" value={guestsLabel} placeholder="—" />
          </dl>
          <PriceBreakdown q={price} tooMany={tooMany} demo={plan?.demo} />

          {cta}

          <p className="mt-5 text-xs leading-relaxed text-cream/55">
            Payment is not the final confirmation: Connectrip confirms your booking once your guide is secured. Then you tell us your wishes in
            the Private Day Planner and we plan the day together.
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-cream/60">
          <TbdText value={model.questions.prompt} slot="Questions prompt" />{" "}
          <Link
            href={model.questions.cta.href}
            {...ctaDataAttributes(model.questions.cta)}
            className="text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold"
          >
            <TbdText value={model.questions.cta.label} slot="Contact CTA" />
          </Link>
        </p>
      </aside>
    </div>
  );
}
