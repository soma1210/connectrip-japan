"use client";

import Link from "next/link";
import { Clock, Info, Minus, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode, type Ref } from "react";
import { PLAN_STYLES, durationMinutes, hasPlan, readPlan } from "../../booking/privateDayPlan";
import { ctaDataAttributes, type CtaSpec, type Tbd } from "@/contracts";
import { cn } from "@/lib/cn";
import {
  DAY_END,
  EMPTY_REQUEST,
  MAX_PARTY_SIZE,
  MESSAGES,
  MIN_ADULTS,
  REQUEST_FIELD_ORDER,
  REQUEST_LIMITS,
  endTime,
  fitsDayEnd,
  messageLimitFor,
  mockSubmitPrivateGuideRequest,
  outcomeFor,
  parseDuration,
  reconcileStartTime,
  requestDateRange,
  slotProblem,
  type DurationMinutes,
  type PrivateGuideRequestOutcome,
  type SlotProblem,
  type PrivateGuideRequestErrors,
  type PrivateGuideRequestField,
  type PrivateGuideRequestSubmitHandler,
  type PrivateGuideRequestValues,
} from "../../booking/privateGuideRequest";
import type { PrivateGuideRequestModel, RequestOption } from "../../content/privateGuideRequest";
import { attemptAfter, createBookingRequestSubmitHandler, prepareSubmission } from "../../booking/bookingRequestApi";
import { trackBookingRequestReceived } from "../analytics/trackEvent";
import type { BookingRequestBody } from "../../booking/bookingRequestContract";
import { TbdText, textOr } from "../Tbd";

/**
 * Private Guide booking request form (Human instruction 2026-11-09).
 * A request, never an instant booking: no availability, no prices, no
 * payment. While `model.mode` is "mock" it submits to a handler that sends
 * nothing, and the result says so plainly.
 *
 * Desktop: form left, sticky "how it works" right. Mobile: one column.
 */

// Same look as the current site's / InquiryForm inputs. 16px text on phones
// so iOS Safari does not zoom in on focus.
const inputClass =
  "w-full border border-cream/20 bg-navy-light px-4 py-3 text-base text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none aria-[invalid=true]:border-red md:text-sm";
const labelText = "text-xs tracking-[0.1em] text-cream/70";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-5">
      <legend className="mb-5 w-full border-b border-gold/20 pb-2 font-heading-en text-xs tracking-[0.2em] text-gold/80">{title}</legend>
      {children}
    </fieldset>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="text-xs text-red-300">
      {error}
    </p>
  ) : null;
}

function FieldShell({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className={labelText}>
        {label}
        {required ? (
          <span className="ml-1 text-red-300" aria-hidden>
            *
          </span>
        ) : (
          <span className="ml-2 text-cream/40">(optional)</span>
        )}
      </label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-cream/50">{hint}</p> : null}
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  );
}

function Stepper({
  id,
  label,
  hint,
  value,
  min,
  max,
  error,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="border-b border-cream/15 py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p id={`${id}-label`} className="text-base text-cream">
            {label}
          </p>
          {hint ? <p className="text-xs text-cream/50">{hint}</p> : null}
        </div>
        <div className="flex items-center gap-4" role="group" aria-labelledby={`${id}-label`}>
          <button
            type="button"
            onClick={() => onChange(value - 1)}
            disabled={value <= min}
            aria-label={`Fewer ${label.toLowerCase()}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 text-gold transition-colors hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold"
          >
            <Minus className="h-4 w-4" />
          </button>
          <output id={id} tabIndex={-1} className="w-6 text-center text-lg text-cream" aria-live="polite">
            {value}
          </output>
          <button
            type="button"
            onClick={() => onChange(value + 1)}
            disabled={value >= max}
            aria-label={`More ${label.toLowerCase()}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 text-gold transition-colors hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  );
}

function CheckboxGroup<V extends string>({
  id,
  label,
  options,
  selected,
  onToggle,
}: {
  id: string;
  label: string;
  options: RequestOption<V>[];
  selected: V[];
  onToggle: (value: V) => void;
}) {
  return (
    <div id={id} tabIndex={-1} role="group" aria-labelledby={`${id}-label`} className="flex min-w-0 flex-col gap-3">
      <p id={`${id}-label`} className={labelText}>
        {label}
        <span className="ml-2 text-cream/40">(optional)</span>
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 border px-3 py-2 text-sm transition-colors",
                checked ? "border-gold bg-navy-dark text-cream" : "border-cream/15 text-cream/80 hover:border-gold/60",
              )}
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(option.value)} className="h-4 w-4 shrink-0 accent-red" />
              <span>{textOr(option.label, option.value)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** Browser clock, rounded down to the minute so the snapshot stays stable between ticks. */
const MINUTE = 60_000;
const minuteNow = () => Math.floor(Date.now() / MINUTE) * MINUTE;
function subscribeMinute(onChange: () => void) {
  const timer = setInterval(onChange, MINUTE);
  return () => clearInterval(timer);
}

const OPTION_SUFFIX: Partial<Record<SlotProblem, string>> = {
  too_soon: " (less than 48 h away)",
  ends_late: ` (ends after ${DAY_END})`,
};

/** Link to the existing Inquiry page, styled as a quiet text link. */
function InquiryLink({ prompt, cta }: { prompt: Tbd<string>; cta: CtaSpec<"inquiry"> }) {
  return (
    <>
      <TbdText value={prompt} slot="Inquiry prompt" />{" "}
      <Link href={cta.href} {...ctaDataAttributes(cta)} className="text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold">
        <TbdText value={cta.label} slot="Inquiry CTA" />
      </Link>
    </>
  );
}

/**
 * Start time (Rules V1.1): the 19 fixed options. Times that end after 20:00
 * for the chosen length are disabled; once a date is chosen, times less than
 * 48 hours away (Asia/Tokyo) too. Not availability.
 */
function StartTimeSelect({
  date,
  duration,
  now,
  options,
  value,
  onChange,
  ...rest
}: {
  date: string;
  duration?: DurationMinutes;
  now: number;
  options: RequestOption<string>[];
  value: string;
  onChange: (time: string) => void;
  id: string;
  name: string;
  required?: boolean;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}) {
  return (
    <select {...rest} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      <option value="">Select a time</option>
      {options.map((o) => {
        // Without a date only the 20:00 end can be checked (shortest length when none is chosen).
        const problem: SlotProblem | undefined = date
          ? slotProblem(date, o.value, now, duration)
          : fitsDayEnd(o.value, duration ?? 240)
            ? undefined
            : "ends_late";
        // A date out of range is shown on the date field; keep the times readable.
        const disabled = problem === "too_soon" || problem === "ends_late";
        return (
          <option key={o.value} value={o.value} disabled={disabled}>
            {textOr(o.label, o.value)}
            {disabled ? OPTION_SUFFIX[problem] : ""}
          </option>
        );
      })}
    </select>
  );
}

/**
 * After the API stored the request (live mode only, see `outcomeFor`).
 * Replaces the form so the request cannot be sent twice. Says plainly that
 * this is a request, not a confirmed booking.
 */
function ReceivedPanel({
  copy,
  bookingRef,
  ref,
}: {
  copy: PrivateGuideRequestModel["outcomes"]["received"];
  bookingRef: string;
  ref: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} tabIndex={-1} role="status" className="border border-gold/60 bg-navy-dark p-6 focus:outline-none md:p-10">
      <TbdText value={copy.title} slot="Received title" as="h3" className="font-heading-en text-2xl leading-snug text-cream md:text-3xl" />
      <div className="mt-6 border border-gold/40 bg-navy px-5 py-4">
        <TbdText value={copy.refLabel} slot="Reference label" as="p" className="text-xs tracking-[0.15em] text-cream/60" />
        <p className="mt-1 font-mono text-xl tracking-wider break-all text-gold">{bookingRef}</p>
      </div>
      <p className="mt-6 border-l-2 border-red pl-4 text-sm leading-relaxed text-cream">
        <TbdText value={copy.notConfirmed} slot="Not confirmed note" />
      </p>
      <ol className="mt-6 flex flex-col gap-3 text-sm leading-relaxed text-cream/80">
        {copy.next.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-gold">{i + 1}.</span>
            <TbdText value={step} slot="Next step" />
          </li>
        ))}
      </ol>
      <TbdText value={copy.keepRef} slot="Keep reference note" as="p" className="mt-6 text-xs text-cream/60" />
    </div>
  );
}

/** The operating flow, numbered. */
function RequestSteps({ model }: { model: PrivateGuideRequestModel }) {
  return (
    <ol className="flex flex-col gap-4">
      {model.steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold text-xs text-gold">{i + 1}</span>
          <div>
            <TbdText value={step.title} slot="Step title" as="p" className="text-sm text-cream" />
            <TbdText value={step.text} slot="Step text" as="p" className="mt-1 text-xs leading-relaxed text-cream/65" />
          </div>
        </li>
      ))}
    </ol>
  );
}

type Phase = { name: "submitting" } | PrivateGuideRequestOutcome;

/** Same-origin `POST /api/v1/booking-requests` (Contract 0.3). Used only in live mode. */
const submitToBookingApi = createBookingRequestSubmitHandler();

export function PrivateGuideRequestForm({
  model,
  onSubmit,
}: {
  model: PrivateGuideRequestModel;
  /**
   * API handler (see booking/bookingRequestApi.ts). Used only when
   * `model.mode` is "live"; in "mock" mode the mock always runs, so nothing
   * can be sent by accident.
   */
  onSubmit?: PrivateGuideRequestSubmitHandler;
}) {
  const uid = useId();
  const id = (name: PrivateGuideRequestField) => `${uid}-${name}`;
  const resultRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<PrivateGuideRequestValues>(EMPTY_REQUEST);
  const [errors, setErrors] = useState<PrivateGuideRequestErrors>({});
  const [phase, setPhase] = useState<Phase>({ name: "editing" });
  /**
   * The body last sent, with its submissionId (Contract 0.3). Kept after a
   * failed or unknown result so "Send again" re-sends the very same body and
   * ID; dropped as soon as the traveller changes anything (→ new ID).
   */
  const [attempt, setAttempt] = useState<BookingRequestBody | null>(null);
  /** The server rejected fields (shown as a notice above the form). */
  const [serverRejected, setServerRejected] = useState(false);
  /** Why a start time was cleared automatically (shown under the field). */
  const [cleared, setCleared] = useState<{ startTime?: SlotProblem; alternateStartTime?: SlotProblem }>({});
  const isMock = model.mode === "mock";
  const duration = parseDuration(values.duration);
  /** Choices brought by a deep link (`?where=…&interests=…&duration=…&style=…`). */
  const [fromPlanner, setFromPlanner] = useState(false);

  // Apply deep-link choices once, after hydration (the server renders the
  // empty form). Only fields the traveller has not touched yet are filled.
  useEffect(() => {
    const plan = readPlan(window.location.search);
    if (!hasPlan(plan)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill from the URL after hydration
    setValues((v) => ({
      ...v,
      areas: v.areas.length ? v.areas : plan.areas,
      interests: v.interests.length ? v.interests : plan.interests,
      duration: v.duration || (plan.duration ? durationMinutes(plan.duration) : ""),
      travelStyle: v.travelStyle || plan.style || "",
    }));
    setFromPlanner(true);
  }, []);

  // Rule clock for the date / time pickers and the re-check on date / length
  // changes: the server render time during SSR and hydration (so both match),
  // then the browser clock, updated every minute. Submit re-checks against the
  // exact Date.now(), so a choice that expired within the minute is caught.
  const now = useSyncExternalStore(subscribeMinute, minuteNow, () => model.renderedAt);
  const dateRange = requestDateRange(now, duration);

  const clearedNote = (problem?: SlotProblem) =>
    problem === "too_soon" ? (
      <TbdText value={model.clearedTooSoonNote} slot="Time cleared note" />
    ) : problem === "ends_late" ? (
      <TbdText value={model.clearedEndsLateNote} slot="Time cleared note" />
    ) : undefined;

  /** "Your day: 09:00–13:00 (JST)" once a valid time and length are chosen. */
  const dayHint = (time: string, problem?: SlotProblem) =>
    problem ? clearedNote(problem) : time && duration && fitsDayEnd(time, duration) ? `Your day: ${time}–${endTime(time, duration)} (Japan time)` : undefined;

  /** Re-check one start time; clear it (with a note) when it no longer fits. */
  function recheck(timeKey: "startTime" | "alternateStartTime", date: string, nextDuration: DurationMinutes | undefined, at: number) {
    const r = reconcileStartTime(date, values[timeKey], at, nextDuration);
    if (r.cleared) set(timeKey, "");
    setCleared((c) => ({ ...c, [timeKey]: r.cleared ? r.problem : undefined }));
  }

  /** A date change re-checks that date's start time (48 hours, 20:00 end). */
  function chooseDate(dateKey: "preferredDate" | "alternateDate", timeKey: "startTime" | "alternateStartTime", date: string) {
    set(dateKey, date);
    recheck(timeKey, date, duration, now);
  }

  /** A length change re-checks both start times against the 20:00 end. */
  function chooseDuration(value: string) {
    set("duration", value);
    const next = parseDuration(value);
    recheck("startTime", values.preferredDate, next, now);
    recheck("alternateStartTime", values.alternateDate, next, now);
  }

  /** Adults + children stay within 1–6 adults / 0–5 children, total at most 6. */
  function chooseParty(key: "adults" | "children", n: number) {
    set(key, n);
    setErrors((e) => ({ ...e, adults: undefined, children: undefined }));
  }

  function set<K extends keyof PrivateGuideRequestValues>(key: K, value: PrivateGuideRequestValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    // Clear a field's error as soon as it is edited; full validation runs on submit.
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
    // Choosing a new start time replaces the "your time was cleared" note.
    if (key === "startTime" || key === "alternateStartTime") setCleared((c) => ({ ...c, [key]: undefined }));
    // A changed form is a new request: forget the last body and its submissionId.
    if (attempt) setAttempt(null);
    if (phase.name !== "editing" && phase.name !== "submitting") setPhase({ name: "editing" });
  }

  function toggle<K extends "areas" | "interests">(key: K, value: PrivateGuideRequestValues[K][number]) {
    const list = values[key] as string[];
    set(key, (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]) as PrivateGuideRequestValues[K]);
  }

  /** Input props shared by text-like fields: id, error wiring. */
  function a11y(name: PrivateGuideRequestField, extraDescribedBy?: string) {
    const describedBy = [errors[name] ? `${id(name)}-error` : null, extraDescribedBy].filter(Boolean).join(" ");
    return {
      id: id(name),
      name,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": describedBy || undefined,
    } as const;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase.name === "submitting") return;

    // Unchanged form after a failed / unknown attempt: the same body and
    // submissionId; otherwise validate and build a new one (new submissionId).
    // The honeypot (`website`) is passed on as is: the API decides what to do with it.
    const prepared = prepareSubmission(attempt, values, Date.now());
    if (prepared.kind === "invalid") {
      setErrors(prepared.errors);
      const first = REQUEST_FIELD_ORDER.find((name) => prepared.errors[name]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }
    if (prepared.kind === "error") {
      setPhase({ name: "rejected", reason: "error" });
      return;
    }
    const body = prepared.body;
    if (prepared.kind === "new") {
      setErrors({});
      setAttempt(body);
    }

    setPhase({ name: "submitting" });
    setServerRejected(false);
    const submit = model.mode === "live" ? (onSubmit ?? submitToBookingApi) : mockSubmitPrivateGuideRequest;
    let next: PrivateGuideRequestOutcome;
    try {
      const result = await submit(body);
      // Analytics only: counted when the API accepted the request (live mode), never on click.
      if (model.mode === "live" && result.ok && result.kind === "received") trackBookingRequestReceived("private_guide", result.bookingRef);
      next = outcomeFor(result, model.mode);
      // Keep the same body / submissionId for a retry, except after 409 (or success).
      setAttempt(attemptAfter(result, body));
      if (!result.ok && (result.kind === "invalid" || result.kind === "rule_violation") && Object.keys(result.errors).length > 0) {
        setErrors(result.errors);
        setServerRejected(true);
        const firstRejected = REQUEST_FIELD_ORDER.find((name) => result.errors[name]);
        setPhase(next);
        requestAnimationFrame(() => (firstRejected ? document.getElementById(id(firstRejected))?.focus() : null));
        return;
      }
    } catch {
      // A handler that throws cannot tell us what happened: treat as unknown, keep the same body.
      next = { name: "unknown" };
    }
    setPhase(next);
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
      <div className="min-w-0">
        <header className="mb-8">
          <p className="font-heading-en text-xs tracking-[0.3em] text-gold">{model.eyebrow}</p>
          <TbdText value={model.heading} slot="Request heading" as="h2" className="mt-2 font-heading-en text-3xl leading-tight text-cream md:text-4xl" />
          <TbdText value={model.supporting} slot="Request intro" as="p" className="mt-4 max-w-2xl text-sm leading-loose text-cream/80 md:text-base" />
        </header>

        {isMock ? (
          <p className="mb-8 flex items-start gap-2 border border-dashed border-gold/50 bg-navy-dark/60 px-4 py-3 text-xs leading-relaxed text-cream/80">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
            <span>
              <strong className="font-medium text-gold">Preview: this form is not connected yet.</strong> Requests are not sent, saved or
              emailed. Please don&apos;t enter real personal details.
            </span>
          </p>
        ) : null}

        {phase.name === "received" ? (
          <ReceivedPanel ref={resultRef} copy={model.outcomes.received} bookingRef={phase.bookingRef} />
        ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-describedby={`${uid}-terms`}
          aria-busy={phase.name === "submitting"}
          className="border border-gold/30 bg-navy-dark p-5 sm:p-6 md:p-10"
        >
          {/* Locked while sending, so the body cannot change under an in-flight request. */}
          <fieldset disabled={phase.name === "submitting"} className="m-0 flex min-w-0 flex-col gap-10 border-0 p-0">
          {errorCount > 0 ? (
            <p role="alert" className="border border-red/60 bg-red/10 px-4 py-3 text-sm text-cream">
              {serverRejected
                ? textOr(model.outcomes.fieldsRejected, "Please check the highlighted fields.")
                : `Please check ${errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`}.`}
            </p>
          ) : null}
          {fromPlanner ? (
            <p role="status" className="border border-gold/30 bg-navy/40 px-4 py-3 text-sm text-cream/85">
              Your choices have been added below. You can change them, then add your date, guests and contact details.
            </p>
          ) : null}

          <Group title="WHEN">
            <div id={`${uid}-rules`} className="-mt-1 flex flex-col gap-2 border border-gold/20 bg-navy/40 px-4 py-3 text-xs leading-relaxed text-cream/80">
              <ul className="flex flex-col gap-1.5">
                {model.rulesNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                    <TbdText value={note} slot="Booking rule" />
                  </li>
                ))}
              </ul>
              <p className="border-t border-cream/10 pt-2 text-cream/70">
                <InquiryLink prompt={model.specialRequest.prompt} cta={model.specialRequest.cta} />
              </p>
            </div>

            <div
              id={id("duration")}
              tabIndex={-1}
              role="radiogroup"
              aria-labelledby={`${id("duration")}-label`}
              aria-invalid={errors.duration ? true : undefined}
              aria-describedby={errors.duration ? `${id("duration")}-error` : undefined}
              className="flex flex-col gap-3 focus:outline-none"
            >
              <p id={`${id("duration")}-label`} className={labelText}>
                How long would you like your guide?
                <span className="ml-1 text-red-300" aria-hidden>
                  *
                </span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {model.durations.map((o) => {
                  const checked = values.duration === o.value;
                  return (
                    <label
                      key={o.value}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center justify-center gap-2 border px-2 py-2 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold",
                        checked ? "border-gold bg-red text-cream" : "border-gold/30 text-cream/85 hover:border-gold",
                      )}
                    >
                      <input type="radio" name="duration" value={o.value} checked={checked} onChange={() => chooseDuration(o.value)} className="sr-only" />
                      {textOr(o.label, o.value)}
                    </label>
                  );
                })}
              </div>
              <ErrorText id={`${id("duration")}-error`} error={errors.duration} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FieldShell id={id("preferredDate")} label="Preferred date" required error={errors.preferredDate}>
                <input
                  {...a11y("preferredDate", `${uid}-rules`)}
                  type="date"
                  required
                  min={dateRange.min}
                  max={dateRange.max}
                  value={values.preferredDate}
                  onChange={(e) => chooseDate("preferredDate", "startTime", e.target.value)}
                  className={cn(inputClass, "scheme-dark")}
                />
              </FieldShell>
              <FieldShell
                id={id("startTime")}
                label="Start time (Japan time)"
                required
                hint={dayHint(values.startTime, cleared.startTime)}
                error={errors.startTime}
              >
                <StartTimeSelect
                  {...a11y("startTime", `${uid}-rules`)}
                  required
                  date={values.preferredDate}
                  duration={duration}
                  now={now}
                  options={model.startTimes}
                  value={values.startTime}
                  onChange={(t) => set("startTime", t)}
                />
              </FieldShell>
            </div>

            <div className="flex flex-col gap-4 border-t border-cream/10 pt-5">
              <p className="text-xs leading-relaxed text-cream/60">
                Second choice <span className="text-cream/40">(optional)</span>: another date or start time that would also work for you, with
                the same length.
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <FieldShell id={id("alternateDate")} label="Alternative date" error={errors.alternateDate}>
                  <input
                    {...a11y("alternateDate", `${uid}-rules`)}
                    type="date"
                    min={dateRange.min}
                    max={dateRange.max}
                    value={values.alternateDate}
                    onChange={(e) => chooseDate("alternateDate", "alternateStartTime", e.target.value)}
                    className={cn(inputClass, "scheme-dark")}
                  />
                </FieldShell>
                <FieldShell
                  id={id("alternateStartTime")}
                  label="Alternative start time"
                  required={Boolean(values.alternateDate)}
                  hint={dayHint(values.alternateStartTime, cleared.alternateStartTime)}
                  error={errors.alternateStartTime}
                >
                  <StartTimeSelect
                    {...a11y("alternateStartTime", `${uid}-rules`)}
                    date={values.alternateDate}
                    duration={duration}
                    now={now}
                    options={model.startTimes}
                    value={values.alternateStartTime}
                    onChange={(t) => set("alternateStartTime", t)}
                  />
                </FieldShell>
              </div>
            </div>
          </Group>

          <Group title="WHO'S COMING">
            <div className="border border-gold/30 bg-navy/40 px-4 sm:px-5">
              <Stepper
                id={id("adults")}
                label="Adults"
                value={values.adults}
                min={MIN_ADULTS}
                max={MAX_PARTY_SIZE - values.children}
                error={errors.adults}
                onChange={(n) => chooseParty("adults", n)}
              />
              <Stepper
                id={id("children")}
                label="Children"
                value={values.children}
                min={0}
                max={MAX_PARTY_SIZE - values.adults}
                error={errors.children}
                onChange={(n) => chooseParty("children", n)}
              />
            </div>
            <p className="text-xs leading-relaxed text-cream/60" aria-live="polite">
              {values.adults + values.children} of {MAX_PARTY_SIZE} people.{" "}
              {values.adults + values.children >= MAX_PARTY_SIZE ? MESSAGES.party : null}
            </p>
          </Group>

          <Group title="YOUR DETAILS">
            <FieldShell id={id("fullName")} label="Full name" required error={errors.fullName}>
              <input
                {...a11y("fullName")}
                type="text"
                required
                autoComplete="name"
                maxLength={REQUEST_LIMITS.fullName}
                value={values.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={inputClass}
              />
            </FieldShell>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldShell id={id("email")} label="Email" required hint="We reply to this address." error={errors.email}>
                <input
                  {...a11y("email")}
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  maxLength={REQUEST_LIMITS.email}
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputClass}
                />
              </FieldShell>
              <FieldShell id={id("emailConfirm")} label="Confirm email" required error={errors.emailConfirm}>
                <input
                  {...a11y("emailConfirm")}
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  maxLength={REQUEST_LIMITS.email}
                  value={values.emailConfirm}
                  onChange={(e) => set("emailConfirm", e.target.value)}
                  className={inputClass}
                />
              </FieldShell>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldShell id={id("country")} label="Country of residence" error={errors.country}>
                <input
                  {...a11y("country")}
                  type="text"
                  autoComplete="country-name"
                  maxLength={REQUEST_LIMITS.country}
                  value={values.country}
                  onChange={(e) => set("country", e.target.value)}
                  className={inputClass}
                />
              </FieldShell>
              <FieldShell id={id("phone")} label="Phone / WhatsApp" hint="Include your country code, e.g. +1." error={errors.phone}>
                <input
                  {...a11y("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={REQUEST_LIMITS.phone}
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputClass}
                />
              </FieldShell>
            </div>
          </Group>

          <Group title="YOUR DAY">
            <CheckboxGroup id={id("areas")} label="Where would you like to go?" options={model.areas} selected={values.areas} onToggle={(v) => toggle("areas", v)} />
            <CheckboxGroup
              id={id("interests")}
              label="What would you like to do?"
              options={model.interests}
              selected={values.interests}
              onToggle={(v) => toggle("interests", v)}
            />
            {/* Single choice; click the chosen one again to clear it. Sent as the first line of the notes. */}
            <div id={id("travelStyle")} tabIndex={-1} role="radiogroup" aria-labelledby={`${id("travelStyle")}-label`} className="flex min-w-0 flex-col gap-3">
              <p id={`${id("travelStyle")}-label`} className={labelText}>
                Who is travelling?
                <span className="ml-2 text-cream/40">(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {PLAN_STYLES.map((o) => {
                  const checked = values.travelStyle === o.value;
                  return (
                    <label
                      key={o.value}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center justify-center border px-3 py-2 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold",
                        checked ? "border-gold bg-navy-dark text-cream" : "border-cream/15 text-cream/80 hover:border-gold/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="travelStyle"
                        value={o.value}
                        checked={checked}
                        onChange={() => set("travelStyle", o.value)}
                        onClick={() => {
                          if (checked) set("travelStyle", "");
                        }}
                        className="sr-only"
                      />
                      {checked ? <span aria-hidden className="mr-1.5 text-gold">✓</span> : null}
                      {o.label}
                    </label>
                  );
                })}
              </div>
            </div>
            <FieldShell
              id={id("message")}
              label="Tell us about your ideal day"
              hint={`Places you want to see, the pace you like, food you want to try… Please don't include health or medical details. (${values.message.length}/${messageLimitFor(values.travelStyle)})`}
              error={errors.message}
            >
              <textarea
                {...a11y("message")}
                rows={5}
                maxLength={messageLimitFor(values.travelStyle)}
                value={values.message}
                onChange={(e) => set("message", e.target.value)}
                className={cn(inputClass, "resize-y")}
              />
            </FieldShell>
          </Group>

          {/* Honeypot: hidden from people and screen readers. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
            </label>
          </div>

          <div className="flex flex-col gap-6 border-t border-gold/20 pt-8">
            <ul id={`${uid}-terms`} className="flex flex-col gap-2 text-sm leading-relaxed text-cream/85">
              {model.keyTerms.map((term, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gold" aria-hidden>
                    —
                  </span>
                  <TbdText value={term} slot="Key term" />
                </li>
              ))}
              {model.cancellationPolicy ? (
                <li className="flex gap-2">
                  <span className="text-gold" aria-hidden>
                    —
                  </span>
                  <span>
                    Before sending, please read our{" "}
                    <Link href={model.cancellationPolicy.href} className="underline decoration-gold/60 underline-offset-4 hover:text-gold">
                      {model.cancellationPolicy.label}
                    </Link>
                    .
                  </span>
                </li>
              ) : null}
            </ul>

            {model.privacyNotice ? (
              <p className="text-xs leading-relaxed text-cream/70">
                <span className="mr-1 font-heading-en tracking-[0.15em] text-cream/50">YOUR DETAILS</span>
                {model.privacyNotice}{" "}
                <Link href={model.consent.privacyHref} className="underline decoration-gold/60 underline-offset-4 hover:text-gold">
                  Read our {model.consent.privacyLabel}
                </Link>
                .
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-cream/85">
                <input
                  {...a11y("consent")}
                  type="checkbox"
                  required
                  checked={values.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-red"
                />
                <span>
                  <TbdText value={model.consent.label} slot="Consent wording" />{" "}
                  <Link href={model.consent.privacyHref} className="underline decoration-gold/60 underline-offset-4 hover:text-gold">
                    {model.consent.privacyLabel}
                  </Link>
                  .
                  <span className="ml-1 text-red-300" aria-hidden>
                    *
                  </span>
                </span>
              </label>
              <ErrorText id={`${id("consent")}-error`} error={errors.consent} />
            </div>

            <button
              type="submit"
              disabled={phase.name === "submitting"}
              data-cta-id="v1_private_request_submit"
              data-cta-position="section"
              className="inline-flex h-14 w-full items-center justify-center border border-gold bg-red px-8 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-60 sm:self-start"
            >
              {phase.name === "submitting"
                ? "Sending…"
                : phase.name === "unknown"
                  ? textOr(model.outcomes.unknown.retryLabel, "Send again")
                  : textOr(model.submitLabel, "Send Booking Request")}
            </button>

            <div ref={resultRef} tabIndex={-1} aria-live="polite" className="focus:outline-none">
              {phase.name === "not_sent_preview" ? (
                <div role="status" className="border-2 border-dashed border-gold bg-navy px-5 py-4 text-sm leading-relaxed text-cream/85">
                  <TbdText value={model.outcomes.notSent.title} slot="Not sent title" as="p" className="font-medium text-gold" />
                  <TbdText value={model.outcomes.notSent.body} slot="Not sent body" as="p" className="mt-2" />
                  <TbdText value={model.outcomes.notSent.live} slot="Not sent live note" as="p" className="mt-2 text-cream/65" />
                </div>
              ) : null}
              {phase.name === "rejected" ? (
                <div role="alert" className="border border-red/60 bg-red/10 px-5 py-4 text-sm leading-relaxed text-cream">
                  <TbdText value={model.outcomes.rejected[phase.reason]} slot="Rejected message" as="p" className="font-medium" />
                  <TbdText value={model.outcomes.rejected.stillInForm} slot="Still in form note" as="p" className="mt-1 text-cream/80" />
                  {phase.reason === "not_accepted" || phase.reason === "error" ? (
                    <p className="mt-2 text-cream/70">
                      <InquiryLink prompt={model.questions.prompt} cta={model.questions.cta} />
                    </p>
                  ) : null}
                </div>
              ) : null}
              {phase.name === "unknown" ? (
                // Neither success nor failure: the request may have reached us.
                <div role="alert" className="border-2 border-gold/70 bg-navy px-5 py-4 text-sm leading-relaxed text-cream">
                  <TbdText value={model.outcomes.unknown.title} slot="Unknown result title" as="p" className="font-medium text-gold" />
                  <TbdText value={model.outcomes.unknown.body} slot="Unknown result body" as="p" className="mt-2 text-cream/85" />
                  <TbdText value={model.outcomes.unknown.editWarning} slot="Edit warning" as="p" className="mt-2 text-cream/70" />
                  {attempt ? (
                    <p className="mt-3 text-xs text-cream/60">
                      <TbdText value={model.outcomes.unknown.idLabel} slot="Request ID label" />:{" "}
                      <span className="font-mono break-all text-cream/80">{attempt.submissionId}</span>
                    </p>
                  ) : null}
                  <p className="mt-3 text-cream/70">
                    <InquiryLink prompt={model.questions.prompt} cta={model.questions.cta} />
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          </fieldset>
        </form>
        )}
      </div>

      <aside className="flex flex-col gap-6 lg:sticky lg:top-28" aria-labelledby={`${uid}-how`}>
        <div className="border border-gold/40 bg-navy-dark p-6 md:p-7">
          <h3 id={`${uid}-how`} className="mb-5 font-heading-en text-xs tracking-[0.25em] text-gold/80">
            HOW BOOKING WORKS
          </h3>
          <RequestSteps model={model} />
          <div className="mt-6 border-t border-cream/10 pt-5 text-xs leading-relaxed text-cream/65">
            <p className="mb-2 font-heading-en tracking-[0.2em] text-cream/50">CANCELLATION</p>
            <TbdText value={model.cancellationNote} slot="Cancellation policy" as="p" />
            {model.cancellationPolicy ? (
              <Link href={model.cancellationPolicy.href} className="mt-2 inline-block text-cream/80 underline decoration-gold/50 underline-offset-4 hover:text-gold">
                Read the full {model.cancellationPolicy.label}
              </Link>
            ) : null}
          </div>
        </div>
        <p className="text-center text-sm text-cream/60">
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
