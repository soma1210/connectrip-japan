"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ctaDataAttributes, type CtaSpec } from "@/contracts";
import { cn } from "@/lib/cn";
import { timeLabel, type BookableTour } from "@/lib/booking-request/tours";
import { createBookingRequestSubmitHandler, newSubmissionId } from "../../booking/bookingRequestApi";
import type { TourBookingRequestBody } from "../../booking/bookingRequestContract";
import { outcomeFor, type PrivateGuideRequestOutcome, type PrivateGuideRequestResult, type RejectedReason } from "../../booking/privateGuideRequest";
import {
  TOUR_FIELD_ORDER,
  TOUR_LIMITS,
  TOUR_REQUEST_NOTICE,
  emptyTourRequest,
  toTourRequestBody,
  tourDateRange,
  tourErrorsFromServer,
  tourStartTimes,
  validateTourRequest,
  type TourRequestErrors,
  type TourRequestField,
  type TourRequestValues,
} from "../../booking/tourBookingRequest";
import { getLenis } from "../wd/SmoothScroll";
import { CTA_GOLD_FILL, CTA_PAIR_BOX } from "../CtaLink";

/**
 * "Send Booking Request" for a Ready-made tour (2026-11-17): a button that
 * opens the tour's request form in a dialog (full screen on phones).
 *
 * `live`: posts to /api/v1/booking-requests (stored as 'received', staff
 * email through the outbox, reference CR-…). `mock` (no database on the
 * server): sends nothing and says so. Never a confirmed booking, never a
 * payment. Double submits are blocked, and an unknown result re-sends the
 * same request id (the API returns the stored request, no second email).
 */

const inputClass =
  "w-full border border-cream/20 bg-navy-light px-4 py-3 text-base text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none aria-[invalid=true]:border-red read-only:border-cream/10 read-only:text-cream/80 md:text-sm";
const labelText = "text-xs tracking-[0.1em] text-cream/70";

const REJECTED: Record<RejectedReason, string> = {
  invalid: "We couldn't accept some details. Please check the highlighted fields and send it again.",
  rule_violation: "This request doesn't meet the tour's booking conditions (for example, it is now less than 48 hours away). Please check the date and group size.",
  conflict: "Your request changed while it was being sent. Please check your details and send it again.",
  rate_limited: "Too many attempts in a short time. Please wait a few minutes, then send again.",
  not_accepted: "We couldn't accept this request online. Please contact us and we'll help you.",
  error: "We couldn't accept your request. Please try again, or contact us.",
};

type Phase = { name: "submitting" } | PrivateGuideRequestOutcome;

const mockSubmit = (): Promise<PrivateGuideRequestResult> =>
  new Promise((resolve) => setTimeout(() => resolve({ ok: true, kind: "not_sent_preview" }), 500));

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className={labelText}>
        {label}
        {required ? <span className="ml-1 text-gold" aria-hidden>*</span> : <span className="ml-1 text-cream/40">(optional)</span>}
      </label>
      {children}
      {hint ? <p id={`${id}-hint`} className="text-xs text-cream/50">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TourBookingRequest({
  tour,
  mode,
  cta,
  privacyHref,
  privacyNotice,
  className,
}: {
  tour: BookableTour;
  mode: "live" | "mock";
  /** Tracking attributes and label of the button. */
  cta: CtaSpec;
  privacyHref: string;
  privacyNotice: string | null;
  className?: string;
}) {
  const uid = useId();
  const id = (f: TourRequestField) => `${uid}-${f}`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<TourRequestValues>(() => emptyTourRequest(tour));
  const [errors, setErrors] = useState<TourRequestErrors>({});
  const [phase, setPhase] = useState<Phase>({ name: "editing" });
  // Set in the browser when the form opens: a cached (ISR) page must never carry a stale date range.
  const [now, setNow] = useState<number | null>(null);
  // The body last sent; kept while the form is unchanged so a retry re-sends the same submissionId.
  const attempt = useRef<TourBookingRequestBody | null>(null);
  const inFlight = useRef(false);

  const range = now === null ? null : tourDateRange(tour, now);
  const startTimes = now === null ? [...tour.startTimes] : tourStartTimes(tour, values.preferredDate, now);
  const label = cta.label.status === "TBD" ? "Send Booking Request" : cta.label.value;

  // Smooth scrolling (Lenis) stays out of the dialog's own scrolling.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => getLenis()?.start();
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  function open() {
    setNow(Date.now());
    // A finished request: the next opening starts a new, empty form.
    if (phase.name === "received" || phase.name === "not_sent_preview") {
      setValues(emptyTourRequest(tour));
      setErrors({});
      setPhase({ name: "editing" });
      attempt.current = null;
    }
    getLenis()?.stop();
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function set<K extends keyof TourRequestValues>(key: K, value: TourRequestValues[K]) {
    if (inFlight.current) return;
    setValues((v) => ({ ...v, [key]: value }));
    // Any change makes it a new request (new submissionId).
    attempt.current = null;
    if (key !== "website") setErrors((e) => ({ ...e, [key]: undefined }));
    if (phase.name === "rejected" || phase.name === "unknown") setPhase({ name: "editing" });
  }

  function focusFirst(e: TourRequestErrors) {
    const first = TOUR_FIELD_ORDER.find((f) => e[f]);
    if (first) document.getElementById(id(first))?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return; // double click / double Enter
    const at = Date.now();
    setNow(at);

    let body = attempt.current;
    if (!body) {
      const found = validateTourRequest(tour, values, at);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setPhase({ name: "rejected", reason: "invalid" });
        focusFirst(found);
        return;
      }
      body = toTourRequestBody(tour, values, newSubmissionId()) ?? null;
      if (!body) {
        setPhase({ name: "rejected", reason: "error" });
        return;
      }
    }

    inFlight.current = true;
    attempt.current = body;
    setPhase({ name: "submitting" });
    let result: PrivateGuideRequestResult;
    try {
      result = mode === "live" ? await createBookingRequestSubmitHandler()(body) : await mockSubmit();
    } catch {
      result = { ok: false, kind: "unknown", cause: "unexpected" };
    }
    inFlight.current = false;

    // Keep the same body for "send again" unless it succeeded or the server says the id belongs to another body.
    if ((result.ok && result.kind === "received") || (!result.ok && result.kind === "conflict")) attempt.current = null;
    // A validation answer from the server: the guest has to change something, so a new id is used then.
    if (!result.ok && (result.kind === "invalid" || result.kind === "rule_violation")) {
      const fieldErrors = tourErrorsFromServer(result.errors);
      setErrors(fieldErrors);
      focusFirst(fieldErrors);
    }
    setPhase(outcomeFor(result, mode));
  }

  const a11y = (f: TourRequestField) => ({
    id: id(f),
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": errors[f] ? `${id(f)}-error` : undefined,
  });
  const submitting = phase.name === "submitting";

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        {...ctaDataAttributes(cta)}
        className={cn(CTA_PAIR_BOX, CTA_GOLD_FILL, "cursor-pointer font-medium", className)}
      >
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${uid}-title`}
        className="m-0 h-dvh max-h-dvh w-full max-w-full overflow-hidden border-0 bg-navy p-0 text-cream backdrop:bg-navy-dark/80 backdrop:backdrop-blur-sm md:m-auto md:h-auto md:max-h-[92dvh] md:max-w-2xl md:border md:border-gold/30"
      >
        <div className="flex h-full max-h-[inherit] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-gold/20 px-5 py-4 md:px-8 md:py-5">
            <div className="min-w-0">
              <p className="font-heading-en text-[11px] tracking-[0.2em] text-gold/80">BOOKING REQUEST</p>
              <h2 id={`${uid}-title`} className="mt-1 font-heading-en text-lg leading-snug text-gold md:text-xl">
                {tour.title}
              </h2>
            </div>
            <button type="button" onClick={close} aria-label="Close" className="-mr-2 shrink-0 p-2 text-cream/70 transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-gold">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 md:px-8">
            {phase.name === "received" ? (
              <div role="status" className="flex flex-col gap-4">
                <p className="font-heading-en text-xl text-gold">We&apos;ve received your booking request</p>
                <div className="border border-gold/30 bg-navy-light px-4 py-3">
                  <p className="text-xs tracking-[0.1em] text-cream/60">Your request reference</p>
                  <p className="mt-1 font-mono text-lg tracking-wider text-cream">{phase.bookingRef}</p>
                </div>
                <p className="text-sm leading-relaxed text-cream/85">{TOUR_REQUEST_NOTICE}</p>
                <p className="text-xs leading-relaxed text-cream/60">Keep this reference and quote it if you contact us about your request.</p>
                <button type="button" onClick={close} className={cn(CTA_PAIR_BOX, CTA_GOLD_FILL, "mt-2 self-start")}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate aria-busy={submitting} className="flex flex-col gap-5">
                <p className="border-l-2 border-gold/70 bg-navy-light/60 px-4 py-3 text-sm leading-relaxed text-cream/85">{TOUR_REQUEST_NOTICE}</p>
                {mode === "mock" ? (
                  <p className="text-xs text-cream/55">Preview: this form is not connected on this server. Nothing will be sent, saved or emailed.</p>
                ) : null}

                <fieldset disabled={submitting} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
                  {/* Filled in from the chosen tour; wraps on phones instead of cutting the name off. */}
                  <div className="flex min-w-0 flex-col gap-2">
                    <p id={`${uid}-tour-label`} className={labelText}>Tour Name</p>
                    <p data-tour-name aria-labelledby={`${uid}-tour-label`} className="w-full border border-cream/10 bg-navy-light px-4 py-3 text-base leading-snug text-cream/85 md:text-sm">
                      {tour.title}
                    </p>
                  </div>

                  <Field id={id("fullName")} label="Full Name" required error={errors.fullName}>
                    <input {...a11y("fullName")} type="text" autoComplete="name" maxLength={TOUR_LIMITS.fullName} value={values.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputClass} />
                  </Field>

                  <Field id={id("email")} label="Email Address" required error={errors.email}>
                    <input {...a11y("email")} type="email" autoComplete="email" inputMode="email" maxLength={TOUR_LIMITS.email} value={values.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id={id("preferredDate")} label="Preferred Date" required error={errors.preferredDate} hint="Japan time. At least 48 hours ahead.">
                      <input
                        {...a11y("preferredDate")}
                        type="date"
                        min={range?.min}
                        max={range?.max}
                        value={values.preferredDate}
                        onChange={(e) => set("preferredDate", e.target.value)}
                        className={cn(inputClass, "[color-scheme:dark]")}
                      />
                    </Field>
                    <Field id={id("startTime")} label="Preferred Start Time" required error={errors.startTime}>
                      <select {...a11y("startTime")} value={values.startTime} onChange={(e) => set("startTime", e.target.value)} className={inputClass}>
                        {tour.startTimes.length > 1 ? <option value="">Choose a time</option> : null}
                        {tour.startTimes.map((t) => (
                          <option key={t} value={t} disabled={!startTimes.includes(t)}>
                            {timeLabel(t)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id={id("guests")} label="Number of Guests" required error={errors.guests} hint={`${tour.minGuests}–${tour.maxGuests} guests per private group.`}>
                      <select {...a11y("guests")} value={values.guests} onChange={(e) => set("guests", Number(e.target.value))} className={inputClass}>
                        {Array.from({ length: tour.maxGuests - tour.minGuests + 1 }, (_, i) => tour.minGuests + i).map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "guest" : "guests"}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id={id("language")} label="Preferred Language" required error={errors.language}>
                      <select {...a11y("language")} value={values.language} onChange={(e) => set("language", e.target.value)} className={inputClass}>
                        {tour.languages.length > 1 ? <option value="">Choose a language</option> : null}
                        {tour.languages.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field id={id("message")} label="Special Requests" error={errors.message} hint="Dietary needs, mobility, interests, anything we should know.">
                    <textarea {...a11y("message")} rows={4} maxLength={TOUR_LIMITS.message} value={values.message} onChange={(e) => set("message", e.target.value)} className={inputClass} />
                  </Field>

                  {/* Honeypot: hidden from people and assistive tech. */}
                  <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label>
                      Website
                      <input type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    {privacyNotice ? <p className="text-xs leading-relaxed text-cream/55">{privacyNotice}</p> : null}
                    <label className="flex items-start gap-3 text-sm leading-relaxed text-cream/85">
                      <input
                        {...a11y("consent")}
                        type="checkbox"
                        checked={values.consent}
                        onChange={(e) => set("consent", e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 accent-gold"
                      />
                      <span>
                        I agree that Connectrip Japan may use these details to reply to my request, as described in the{" "}
                        <Link href={privacyHref} className="underline decoration-gold/60 underline-offset-4 hover:text-gold">
                          Privacy Policy
                        </Link>
                        .<span className="ml-1 text-gold" aria-hidden>*</span>
                      </span>
                    </label>
                    {errors.consent ? (
                      <p id={`${id("consent")}-error`} className="text-xs text-red-300" role="alert">
                        {errors.consent}
                      </p>
                    ) : null}
                  </div>
                </fieldset>

                {phase.name === "rejected" ? (
                  <p role="alert" className="border border-red/60 bg-red/10 px-4 py-3 text-sm text-cream">
                    {REJECTED[phase.reason]}
                  </p>
                ) : null}
                {phase.name === "unknown" ? (
                  <div role="alert" className="border border-gold/50 bg-navy-light px-4 py-3 text-sm text-cream/90">
                    <p className="font-medium text-gold">We couldn&apos;t confirm whether your request reached us.</p>
                    <p className="mt-1">Please press &ldquo;Send again&rdquo; to resend this same request: if it already reached us, it won&apos;t be duplicated.</p>
                  </div>
                ) : null}
                {phase.name === "not_sent_preview" ? (
                  <p role="status" className="border border-gold/40 bg-navy-light px-4 py-3 text-sm text-cream/85">
                    Preview only: your request was NOT sent. Nothing was saved or emailed, and no booking was made.
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                  <button type="submit" disabled={submitting} className={cn(CTA_PAIR_BOX, CTA_GOLD_FILL, "cursor-pointer font-medium disabled:cursor-wait disabled:opacity-60")}>
                    {submitting ? "Sending…" : phase.name === "unknown" ? "Send again" : "Send Booking Request"}
                  </button>
                  <button type="button" onClick={close} className="px-2 py-2 text-xs tracking-[0.1em] text-cream/60 underline-offset-4 hover:text-gold hover:underline">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
