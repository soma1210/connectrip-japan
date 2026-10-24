"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Info, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ctaDataAttributes, type PrivateGuideBookingModel, type PrivateGuidePlan } from "@/contracts";
import { cn } from "@/lib/cn";
import { formatDuration, hasAvailability, quote, startTimeOptions } from "../../booking/privateGuideSlots";
import { formatMoney } from "../format";
import { TbdMark, TbdText, textOr } from "../Tbd";

/**
 * Private Guide slot booking (W1-D16), prototype. Plan → date → start time →
 * guests → summary → Book Now. In `prototype` mode Book Now only shows a
 * notice: no booking, no payment, no external redirect.
 *
 * Desktop: choices left, sticky summary right. Mobile: one column, summary
 * after the choices.
 */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const longDate = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const monthLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });

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
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-col gap-3 border p-5 text-left transition-colors",
        selected ? "border-gold bg-navy-dark ring-1 ring-gold" : "border-gold/30 bg-navy-dark/40 hover:border-gold/70",
      )}
    >
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
      <span className="mt-auto flex items-center gap-2 border-t border-cream/15 pt-3 text-sm text-cream">
        {price ? formatMoney(price) : <TbdMark slot="Price" />}
        <span className="text-xs text-cream/50">per group</span>
        {plan.demo ? <DemoBadge>DEMO PRICE</DemoBadge> : null}
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
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
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
          aria-label={`More ${label.toLowerCase()}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 text-gold transition-colors hover:bg-gold hover:text-navy"
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

export function PrivateGuideBooking({ model }: { model: PrivateGuideBookingModel }) {
  const { availability, plans } = model;
  const [planId, setPlanId] = useState<string>();
  const [date, setDate] = useState<string>();
  const [time, setTime] = useState<string>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const plan = plans.find((p) => p.id === planId);
  // Before a plan is chosen, a date counts as open if any plan fits.
  const minDuration = plan?.durationMinutes ?? Math.min(...plans.map((p) => p.durationMinutes));
  const options = date ? startTimeOptions(availability, date, minDuration) : [];
  const selectedOption = options.find((o) => o.time === time);
  const price = plan ? quote(plan) : undefined;
  const ready = Boolean(plan && date && selectedOption?.available && adults >= 1);
  const isDemo = model.mode === "prototype" || plans.some((p) => p.demo) || availability.source === "mock";

  // Keep the selection valid when the plan or date changes.
  function choosePlan(id: string) {
    const next = plans.find((p) => p.id === id);
    setPlanId(id);
    setSubmitted(false);
    if (next && date && time && !startTimeOptions(availability, date, next.durationMinutes).find((o) => o.time === time)?.available) {
      setTime(undefined);
    }
  }
  function chooseDate(next: string) {
    setDate(next);
    setSubmitted(false);
    if (time && !startTimeOptions(availability, next, minDuration).find((o) => o.time === time)?.available) setTime(undefined);
  }

  const guestsLabel = `${adults} adult${adults === 1 ? "" : "s"}${children > 0 ? `, ${children} child${children === 1 ? "" : "ren"}` : ""}`;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
      {/* Choices */}
      <div className="flex flex-col gap-12">
        {isDemo ? (
          <p className="flex items-start gap-2 border border-dashed border-gold/40 bg-navy-dark/60 px-4 py-3 text-xs leading-relaxed text-cream/70">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
            Prototype for review: plans, prices, dates and times are demo data. Nothing can be booked or paid yet.
          </p>
        ) : null}

        <section className="flex flex-col gap-5" aria-labelledby="pg-plan">
          <div id="pg-plan">
            <StepHeading n={1}>Choose your plan</StepHeading>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((p) => (
              <PlanCard key={p.id} plan={p} selected={p.id === planId} onSelect={() => choosePlan(p.id)} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5" aria-labelledby="pg-date">
          <div id="pg-date">
            <StepHeading n={2}>Pick a date</StepHeading>
          </div>
          <Calendar
            dates={availability.dates}
            selected={date}
            isOpen={(d) => hasAvailability(availability, d, minDuration)}
            onSelect={chooseDate}
          />
        </section>

        <section className="flex flex-col gap-5" aria-labelledby="pg-time">
          <div id="pg-time" className="flex flex-wrap items-baseline justify-between gap-2">
            <StepHeading n={3}>Choose a start time</StepHeading>
            {plan ? <span className="text-xs text-cream/55">Your guide stays with you for {formatDuration(plan.durationMinutes)}</span> : null}
          </div>
          {!date ? (
            <p className="border border-dashed border-cream/20 px-5 py-6 text-sm text-cream/55">Pick a date to see available start times.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {options.map((o) => {
                const selected = o.time === time;
                return (
                  <button
                    key={o.time}
                    type="button"
                    disabled={!o.available}
                    onClick={() => {
                      setTime(o.time);
                      setSubmitted(false);
                    }}
                    aria-pressed={selected}
                    aria-label={`${o.time}${plan ? ` to ${o.end}` : ""}${o.available ? "" : ", unavailable"}`}
                    className={cn(
                      "flex flex-col items-center gap-0.5 border px-2 py-2.5 transition-colors",
                      selected && "border-gold bg-red text-cream",
                      !selected && o.available && "border-gold/30 text-cream hover:border-gold hover:text-gold",
                      !o.available && "cursor-not-allowed border-cream/10 text-cream/25",
                    )}
                  >
                    <span className={cn("text-base", !o.available && "line-through")}>{o.time}</span>
                    {plan ? <span className={cn("text-[10px]", selected ? "text-cream/85" : "text-cream/45")}>→ {o.end}</span> : null}
                  </button>
                );
              })}
            </div>
          )}
          {date && !plan ? <p className="text-xs text-cream/50">Choose a plan to see when your day would end.</p> : null}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="pg-guests">
          <div id="pg-guests">
            <StepHeading n={4}>Who&apos;s coming?</StepHeading>
          </div>
          <div className="border border-gold/30 bg-navy-dark/40 px-5">
            <Stepper label="Adults" value={adults} min={1} onChange={(v) => { setAdults(v); setSubmitted(false); }} />
            <Stepper label="Children" value={children} min={0} onChange={(v) => { setChildren(v); setSubmitted(false); }} />
          </div>
        </section>

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
          <div className="text-sm text-cream/70">
            <p className="mb-2 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">CANCELLATION</p>
            <TbdText value={model.cancellationNote} slot="Cancellation policy" as="p" />
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-28" aria-labelledby="pg-summary">
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
          <div className="mt-5 flex items-end justify-between gap-4">
            <span className="text-sm text-cream/70">Total</span>
            <span className="text-right">
              <span className="block font-heading-en text-3xl text-cream">{price ? formatMoney(price) : "—"}</span>
              {price && plan?.demo ? <DemoBadge>DEMO PRICE</DemoBadge> : null}
            </span>
          </div>
          {price ? <p className="mt-1 text-right text-[11px] text-cream/45">Per private group · taxes TBD</p> : null}

          <button
            type="button"
            disabled={!ready}
            onClick={() => setSubmitted(true)}
            className="mt-6 inline-flex w-full items-center justify-center border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red"
          >
            <TbdText value={model.bookLabel} slot="Book CTA" />
          </button>
          {!ready ? <p className="mt-2 text-center text-[11px] text-cream/45">Choose a plan, date and start time to continue.</p> : null}

          {submitted && model.mode === "prototype" ? (
            <div role="status" className="mt-4 border border-dashed border-gold/60 bg-navy px-4 py-3 text-xs leading-relaxed text-cream/80">
              <p className="font-medium text-gold">Prototype: the booking backend is not connected yet.</p>
              <p className="mt-1">Nothing was booked or charged. In the live version, Book Now continues to payment, then Connectrip confirms your booking.</p>
            </div>
          ) : null}

          <p className="mt-5 text-xs leading-relaxed text-cream/55">
            Your booking is confirmed by Connectrip after payment. We then plan the day with you.
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
