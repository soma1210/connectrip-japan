"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import type {
  PlannerQuestion,
  PlannerResponse,
  PlannerSubmitHandler,
  PrivateDayPlannerContent,
  PrivateGuideActivity,
} from "@/contracts";
import { cn } from "@/lib/cn";
import { TbdText, textOr } from "../Tbd";

/**
 * Private Day Planner v1 form — PROTOTYPE. The planning questions from the
 * content (places, ideal day / pace, anything else) on one page, then consent
 * and submit. Booking fields, Interests included, are not asked again. Submitting validates and shows a local success state; nothing is
 * sent or stored.
 */

/** DEMO handler: resolves locally. The live version posts to the Planner API with the booking id. */
const prototypeSubmit: PlannerSubmitHandler = async () => ({ ok: true });

// Field look reused from the v1 Inquiry form (current site's ReservationSection).
const textareaClass =
  "w-full resize-y border border-cream/20 bg-navy-light px-4 py-3 text-sm leading-relaxed text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

type Answers = { interests: PrivateGuideActivity[]; places: string; idealDay: string; anythingElse: string };

function QuestionShell({
  q,
  index,
  total,
  children,
}: {
  q: PlannerQuestion;
  index: number;
  total: number;
  children: ReactNode;
}) {
  const n = (i: number) => String(i).padStart(2, "0");
  return (
    <div className="grid gap-5 border-t border-dashed border-gold/20 py-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-14 md:py-14">
      <div>
        <p className="font-heading-en text-xs tracking-[0.25em] text-gold/80" aria-hidden="true">
          {n(index + 1)} / {n(total)}
        </p>
        <h2 id={`planner-${q.key}`} className="mt-3 font-heading-jp text-2xl leading-snug text-cream md:text-3xl">
          <TbdText value={q.heading} slot="Question" />
        </h2>
        <p id={`planner-${q.key}-help`} className="mt-3 text-sm leading-relaxed text-cream/65">
          <TbdText value={q.supporting} slot="Question help" />
        </p>
      </div>
      <div className="min-w-0 md:pt-8">{children}</div>
    </div>
  );
}

export function PrivateDayPlannerForm({ content }: { content: PrivateDayPlannerContent }) {
  const [answers, setAnswers] = useState<Answers>({ interests: [], places: "", idealDay: "", anythingElse: "" });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"consent" | "places" | "idealDay" | "anythingElse", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<PlannerResponse | null>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const total = content.questions.length;

  const toggleInterest = (value: PrivateGuideActivity) =>
    setAnswers((a) => ({
      ...a,
      interests: a.interests.includes(value) ? a.interests.filter((v) => v !== value) : [...a.interests, value],
    }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: typeof errors = {};
    for (const q of content.questions) {
      if (q.kind === "textarea" && answers[q.key].length > q.maxLength) next[q.key] = `Please keep this under ${q.maxLength} characters.`;
    }
    if (!consent) next.consent = "Please agree to the Privacy Policy so we can use your answers.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = Object.keys(next)[0];
      (first === "consent" ? consentRef.current : document.getElementById(`planner-field-${first}`))?.focus();
      return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    const response: PlannerResponse = {
      bookingId: content.booking.bookingId,
      // Interests are owned by the Booking (Private Guide v1); the shared contract field stays until it is revised.
      interests: answers.interests,
      places: answers.places.trim() || undefined,
      idealDay: answers.idealDay.trim() || undefined,
      anythingElse: answers.anythingElse.trim() || undefined,
      consentAt: now,
      submittedAt: now,
    };
    const result = await prototypeSubmit(response);
    setSubmitting(false);
    if (result.ok) {
      setDone(response);
      requestAnimationFrame(() => successRef.current?.focus());
    }
  }

  if (done) {
    const labels = content.questions.find((q) => q.kind === "multiselect");
    // In the list's own order, not the order they were clicked.
    const interestNames =
      labels && labels.kind === "multiselect"
        ? labels.options.filter((o) => done.interests.includes(o.value)).map((o) => textOr(o.label, o.value))
        : [];
    return (
      <div role="status" className="border-t border-dashed border-gold/20 py-14 md:py-20">
        <h2 ref={successRef} tabIndex={-1} className="max-w-2xl font-heading-jp text-2xl leading-snug text-cream focus:outline-none md:text-3xl">
          <TbdText value={content.successMessage} slot="Success message" />
        </h2>
        <dl className="mt-8 grid max-w-2xl gap-x-8 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
          {labels ? (
            <>
              <dt className="text-cream/50">Interests</dt>
              <dd className="text-cream/85">{interestNames.length ? interestNames.join(", ") : "—"}</dd>
            </>
          ) : null}
          <dt className="text-cream/50">Places</dt>
          <dd className="whitespace-pre-line break-words text-cream/85">{done.places ?? "—"}</dd>
          <dt className="text-cream/50">Ideal day</dt>
          <dd className="whitespace-pre-line break-words text-cream/85">{done.idealDay ?? "—"}</dd>
          <dt className="text-cream/50">Anything else</dt>
          <dd className="whitespace-pre-line break-words text-cream/85">{done.anythingElse ?? "—"}</dd>
        </dl>
        {content.mode === "prototype" ? (
          <p className="mt-8 max-w-2xl border border-dashed border-gold/60 px-4 py-3 text-xs leading-relaxed text-cream/75">
            <span className="font-medium text-gold">Prototype:</span> nothing was sent or stored. In the live version these answers are saved
            with your booking and Connectrip uses them to plan your day.
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
          <button type="button" onClick={() => setDone(null)} className="text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold">
            Edit my answers
          </button>
          <Link href={content.backCta.href} className="text-cream/70 underline decoration-gold/30 underline-offset-4 hover:text-gold">
            <TbdText value={content.backCta.label} slot="Back CTA" />
          </Link>
        </div>
      </div>
    );
  }

  const consentLabel = textOr(content.consent.label, "");
  const [before, after] = consentLabel.includes("Privacy Policy") ? consentLabel.split("Privacy Policy", 2) : [consentLabel, null];

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Private Day Planner">
      {content.questions.map((q, i) => (
        <QuestionShell key={q.key} q={q} index={i} total={total}>
          {q.kind === "multiselect" ? (
            <fieldset aria-labelledby={`planner-${q.key}`} aria-describedby={`planner-${q.key}-help`}>
              <ul className="flex flex-wrap gap-2.5">
                {q.options.map((o) => {
                  const checked = answers.interests.includes(o.value);
                  return (
                    <li key={o.value}>
                      <label className="relative block cursor-pointer">
                        <input
                          type="checkbox"
                          name="interests"
                          value={o.value}
                          checked={checked}
                          onChange={() => toggleInterest(o.value)}
                          className="peer sr-only"
                        />
                        <span
                          className={cn(
                            "inline-flex min-h-11 items-center border px-4 py-2 text-sm tracking-[0.04em] transition-colors",
                            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold",
                            checked ? "border-gold bg-red text-cream" : "border-gold/30 text-cream/85 hover:border-gold hover:text-gold",
                          )}
                        >
                          <TbdText value={o.label} slot={`Interest: ${o.value}`} />
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : (
            <div>
              <textarea
                id={`planner-field-${q.key}`}
                name={q.key}
                rows={q.key === "anythingElse" ? 4 : 5}
                maxLength={q.maxLength}
                value={answers[q.key]}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                placeholder={textOr(q.placeholder, "")}
                aria-labelledby={`planner-${q.key}`}
                aria-describedby={`planner-${q.key}-help planner-${q.key}-count${errors[q.key] ? ` planner-${q.key}-error` : ""}`}
                aria-invalid={errors[q.key] ? true : undefined}
                className={textareaClass}
              />
              <div className="mt-2 flex justify-between gap-4 text-[11px] text-cream/40">
                <span>Optional</span>
                <span id={`planner-${q.key}-count`}>
                  {answers[q.key].length} / {q.maxLength}
                </span>
              </div>
              {errors[q.key] ? (
                <p id={`planner-${q.key}-error`} className="mt-2 text-xs text-[#e6a19a]">
                  {errors[q.key]}
                </p>
              ) : null}
            </div>
          )}
        </QuestionShell>
      ))}

      <div className="grid gap-6 border-t border-dashed border-gold/20 py-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-14 md:py-14">
        <div className="hidden md:block" />
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <input
              ref={consentRef}
              id="planner-consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) setErrors((er) => ({ ...er, consent: undefined }));
              }}
              required
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? "planner-consent-error" : undefined}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#c9a45c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            />
            <label htmlFor="planner-consent" className="cursor-pointer text-sm leading-relaxed text-cream/80">
              {before}
              {after !== null ? (
                <>
                  <Link href={content.consent.privacyHref} className="text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold">
                    Privacy Policy
                  </Link>
                  {after}
                </>
              ) : null}
              <span className="text-red"> *</span>
            </label>
          </div>
          {errors.consent ? (
            <p id="planner-consent-error" className="mt-2 pl-8 text-xs text-[#e6a19a]">
              {errors.consent}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60 sm:w-auto"
          >
            <TbdText value={content.submitLabel} slot="Submit" />
          </button>
          {content.mode === "prototype" ? (
            <p className="mt-3 text-[11px] text-cream/45">Prototype: answers are not sent or stored.</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
