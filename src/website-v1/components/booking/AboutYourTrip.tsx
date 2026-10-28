"use client";

import Link from "next/link";
import type { AboutYourTripContent, BookingInterest, SelfReportedSource } from "@/contracts";
import { cn } from "@/lib/cn";
import { TbdText, textOr } from "../Tbd";

/**
 * Step 05 of the Private Guide booking flow (PROTOTYPE): customer details,
 * trip window, booking preferences, self-reported source and the booking
 * consent. Controlled by PrivateGuideBooking, which owns state and validation.
 */

export type AboutYourTripValues = {
  fullName: string;
  email: string;
  country: string;
  arriving: string;
  leaving: string;
  interests: BookingInterest[];
  tripDescription: string;
  source: SelfReportedSource | "";
  consent: boolean;
};

export type AboutYourTripField = "fullName" | "email" | "country" | "arriving" | "leaving" | "consent";
export type AboutYourTripErrors = Partial<Record<AboutYourTripField, string>>;

// Field look reused from the v1 Inquiry form, with clear focus and error states.
const fieldClass =
  "w-full border bg-navy-light px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const okBorder = "border-cream/20";
const errBorder = "border-[#e6a19a]";
const labelClass = "text-xs tracking-[0.1em] text-cream/70";
const errorClass = "mt-1.5 text-xs text-[#e6a19a]";

function Req() {
  return (
    <span className="text-red" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className={errorClass}>
      {message}
    </p>
  ) : null;
}

export function AboutYourTrip({
  content,
  values,
  errors,
  bookingDate,
  onChange,
}: {
  content: AboutYourTripContent;
  values: AboutYourTripValues;
  errors: AboutYourTripErrors;
  /** The chosen Private Guide date, for the (non-blocking) trip-window note. */
  bookingDate?: string;
  onChange: <K extends keyof AboutYourTripValues>(key: K, value: AboutYourTripValues[K]) => void;
}) {
  const describe = (id: string, err?: string) => (err ? `${id}-error` : undefined);
  const outsideTrip =
    bookingDate && values.arriving && values.leaving && values.leaving >= values.arriving && (bookingDate < values.arriving || bookingDate > values.leaving);
  const consentLabel = textOr(content.consent.label, "");
  const linked = consentLabel.includes("Booking Terms") && consentLabel.includes("Privacy Policy");

  return (
    <div className="flex flex-col gap-10 border border-gold/30 bg-navy-dark/40 p-5 md:p-7">
      {/* Customer */}
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-4 font-heading-en text-xs tracking-[0.2em] text-gold/80">YOUR DETAILS</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="pg-fullName" className={labelClass}>
              Full name
              <Req />
            </label>
            <input
              id="pg-fullName"
              type="text"
              autoComplete="name"
              value={values.fullName}
              onChange={(e) => onChange("fullName", e.target.value)}
              aria-required="true"
              aria-invalid={errors.fullName ? true : undefined}
              aria-describedby={describe("pg-fullName", errors.fullName)}
              className={cn(fieldClass, errors.fullName ? errBorder : okBorder)}
            />
            <FieldError id="pg-fullName-error" message={errors.fullName} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="pg-email" className={labelClass}>
              Email
              <Req />
            </label>
            <input
              id="pg-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              aria-required="true"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describe("pg-email", errors.email)}
              className={cn(fieldClass, errors.email ? errBorder : okBorder)}
            />
            <FieldError id="pg-email-error" message={errors.email} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="pg-country" className={labelClass}>
              Country of residence
              <Req />
            </label>
            <select
              id="pg-country"
              autoComplete="country"
              value={values.country}
              onChange={(e) => onChange("country", e.target.value)}
              aria-required="true"
              aria-invalid={errors.country ? true : undefined}
              aria-describedby={describe("pg-country", errors.country)}
              className={cn(fieldClass, "appearance-auto [color-scheme:dark]", errors.country ? errBorder : okBorder, !values.country && "text-cream/40")}
            >
              <option value="">Select a country</option>
              {content.countries.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <FieldError id="pg-country-error" message={errors.country} />
          </div>
        </div>
      </fieldset>

      {/* Trip window (not the booking date) */}
      <fieldset className="flex flex-col gap-3" aria-describedby="pg-trip-help">
        <legend className="mb-1 font-heading-en text-xs tracking-[0.2em] text-gold/80">YOUR TRIP TO JAPAN</legend>
        <p id="pg-trip-help" className="text-xs leading-relaxed text-cream/55">
          When are you in Japan? This is your whole trip, not just your Private Guide day.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          {(["arriving", "leaving"] as const).map((key) => (
            <div key={key} className="flex min-w-0 flex-col gap-2">
              <label htmlFor={`pg-${key}`} className={labelClass}>
                {key === "arriving" ? "Arriving" : "Leaving"}
                <Req />
              </label>
              <input
                id={`pg-${key}`}
                type="date"
                value={values[key]}
                min={key === "leaving" ? values.arriving || undefined : undefined}
                onChange={(e) => onChange(key, e.target.value)}
                aria-required="true"
                aria-invalid={errors[key] ? true : undefined}
                aria-describedby={describe(`pg-${key}`, errors[key])}
                className={cn(fieldClass, "min-w-0 [color-scheme:dark]", errors[key] ? errBorder : okBorder)}
              />
              <FieldError id={`pg-${key}-error`} message={errors[key]} />
            </div>
          ))}
        </div>
        {outsideTrip ? (
          <p role="status" className="border border-dashed border-gold/50 px-3 py-2 text-xs leading-relaxed text-cream/75">
            Your Private Guide date is outside these trip dates. Please check them. (Prototype note: this does not stop the booking.)
          </p>
        ) : null}
      </fieldset>

      {/* Booking preferences (not the Inquiry service interests) */}
      <fieldset aria-describedby="pg-interests-help">
        <legend className="font-heading-en text-xs tracking-[0.2em] text-gold/80">WHAT INTERESTS YOU?</legend>
        <p id="pg-interests-help" className="mt-2 text-xs leading-relaxed text-cream/55">
          What would you like to do on your Private Guide day? Choose as many as you like.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {content.interests.map((o) => {
            const checked = values.interests.includes(o.value);
            return (
              <li key={o.value}>
                <label className="relative block cursor-pointer">
                  <input
                    type="checkbox"
                    name="interests"
                    value={o.value}
                    checked={checked}
                    onChange={() =>
                      onChange("interests", checked ? values.interests.filter((v) => v !== o.value) : [...values.interests, o.value])
                    }
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "inline-flex min-h-11 items-center border px-4 py-2 text-sm transition-colors",
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

      {/* Free text */}
      <div className="flex flex-col gap-2">
        <label htmlFor="pg-trip" className="font-heading-en text-xs tracking-[0.2em] text-gold/80">
          <TbdText value={content.tripDescription.label} slot="Trip description label" className="uppercase" />
          <span className="ml-2 font-sans text-[11px] tracking-normal text-cream/45 normal-case">Optional</span>
        </label>
        <p id="pg-trip-desc" className="text-xs leading-relaxed text-cream/55">
          <TbdText value={content.tripDescription.help} slot="Trip description help" />
        </p>
        <textarea
          id="pg-trip"
          rows={5}
          maxLength={content.tripDescription.maxLength}
          value={values.tripDescription}
          onChange={(e) => onChange("tripDescription", e.target.value)}
          placeholder={textOr(content.tripDescription.placeholder, "")}
          aria-describedby="pg-trip-desc pg-trip-count"
          className={cn(fieldClass, okBorder, "mt-1 resize-y leading-relaxed")}
        />
        <p id="pg-trip-count" className="text-right text-[11px] text-cream/40">
          {values.tripDescription.length} / {content.tripDescription.maxLength}
        </p>
      </div>

      {/* Self-reported discovery source */}
      <div className="flex flex-col gap-2">
        <label htmlFor="pg-source" className="font-heading-en text-xs tracking-[0.2em] text-gold/80">
          HOW DID YOU FIND US?
          <span className="ml-2 font-sans text-[11px] tracking-normal text-cream/45 normal-case">Optional</span>
        </label>
        <select
          id="pg-source"
          value={values.source}
          onChange={(e) => onChange("source", e.target.value as SelfReportedSource | "")}
          className={cn(fieldClass, okBorder, "appearance-auto [color-scheme:dark] sm:max-w-xs", !values.source && "text-cream/40")}
        >
          <option value="">Choose one</option>
          {content.sources.map((o) => (
            <option key={o.value} value={o.value}>
              {textOr(o.label, o.value)}
            </option>
          ))}
        </select>
      </div>

      {/* Booking consent: PROPOSED / LEGAL REVIEW REQUIRED */}
      <div>
        <div className="flex items-start gap-3">
          <input
            id="pg-consent"
            type="checkbox"
            checked={values.consent}
            onChange={(e) => onChange("consent", e.target.checked)}
            aria-required="true"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describe("pg-consent", errors.consent)}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#c9a45c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          />
          <label htmlFor="pg-consent" className="cursor-pointer text-sm leading-relaxed text-cream/80">
            {linked ? (
              <>
                {consentLabel.split("Booking Terms")[0]}
                <Link href={content.consent.termsHref} className="text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold">
                  Booking Terms
                </Link>
                {consentLabel.split("Booking Terms")[1].split("Privacy Policy")[0]}
                <Link href={content.consent.privacyHref} className="text-cream underline decoration-gold/50 underline-offset-4 hover:text-gold">
                  Privacy Policy
                </Link>
                {consentLabel.split("Privacy Policy")[1]}
              </>
            ) : (
              consentLabel
            )}
            <Req />
          </label>
        </div>
        <FieldError id="pg-consent-error" message={errors.consent} />
      </div>
    </div>
  );
}
