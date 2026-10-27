// Presentational pieces of the application page: hero, step headings,
// progress bar, consent, submit area and completion screen. No form logic —
// everything arrives through props.

import type { ReactNode } from "react";
import { AlertCircle, Check, Clock, Loader2, Lock, MapPin, Sparkles } from "lucide-react";
import { PAGE_COPY } from "@/features/guide-community/config/questions";
import type { FormProgress as Progress } from "@/features/guide-community/progress";
import { FieldError, RequiredBadge } from "./fields/FieldShell";

/** Page gutter + max width shared by every block (16px gutter on phones). */
export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[720px] px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-gc-display text-sm font-bold tracking-tight text-gc-primary ${className}`}>
      <span aria-hidden className="size-2.5 rounded-full bg-gc-accent" />
      {PAGE_COPY.brand}
    </span>
  );
}

/**
 * Top of the page. `visual` is an optional slot for a photo or illustration
 * (e.g. added later in Astra); without it the hero is typography only.
 */
export function Hero({ visual }: { visual?: ReactNode }) {
  return (
    <header className="gc-hero">
      <PageContainer className="gc-hero-inner">
        <BrandMark />
        {visual ? <div data-slot="hero-visual">{visual}</div> : null}
        <div className="flex flex-col gap-3">
          <p className="font-gc-display text-xs font-semibold uppercase tracking-[0.18em] text-gc-accent-ink">
            LOCAL PEOPLE · SHARED DISCOVERIES
          </p>
          <h1 className="gc-hero-title font-gc-display">
            {PAGE_COPY.heading}
          </h1>
          <p className="gc-hero-tagline font-gc-display">{PAGE_COPY.tagline}</p>
        </div>
        <div className="gc-hero-intro">
          {PAGE_COPY.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <ul className="gc-hero-facts">
          <HeroFact icon={<Sparkles className="size-4" />} strong>
            {PAGE_COPY.welcome}
          </HeroFact>
          <HeroFact icon={<Clock className="size-4" />}>{PAGE_COPY.estimatedTime}</HeroFact>
          <HeroFact icon={<MapPin className="size-4" />}>{PAGE_COPY.areas}</HeroFact>
        </ul>
      </PageContainer>
    </header>
  );
}

function HeroFact({ icon, strong, children }: { icon: ReactNode; strong?: boolean; children: ReactNode }) {
  return (
    <li
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 sm:px-3 ${
        strong ? "bg-gc-primary-soft font-semibold text-gc-primary" : "bg-gc-surface-muted text-gc-muted"
      }`}
    >
      <span aria-hidden className="[&_svg]:size-3.5 sm:[&_svg]:size-4">{icon}</span>
      {children}
    </li>
  );
}

export function FormSection({
  id,
  index,
  title,
  subtitle,
  description,
  children,
}: {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={`step-${id}`} aria-labelledby={`step-${id}-title`} className="gc-section scroll-mt-24 flex flex-col gap-4">
      <div className="gc-section-heading flex flex-col gap-1">
        <p className="font-gc-display text-xs font-bold tracking-[0.16em] text-gc-accent-ink">
          STEP {String(index + 1).padStart(2, "0")}
          {subtitle ? <span className="gc-section-english">{subtitle}</span> : null}
        </p>
        <h2 id={`step-${id}-title`} className="text-[1.375rem] font-bold leading-snug text-gc-text">
          {title}
        </h2>
        {description ? <p className="text-sm leading-relaxed text-gc-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Slim sticky bar: current step + overall % of required answers. Sticks only
 * while the form is on screen (it lives inside the form), never position:fixed.
 */
export function FormProgress({
  progress,
  currentStep,
}: {
  progress: Progress;
  currentStep?: { index: number; total: number; title: string };
}) {
  return (
    <div className="gc-progress sticky top-0 z-20 -mx-4 border-b border-gc-border bg-gc-bg px-4 py-3 sm:-mx-6 sm:px-6">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex min-w-0 items-center gap-2 text-gc-muted">
          <span className="sr-only">回答の進捗</span>
          {currentStep ? (
            <span className="truncate">
              <span className="font-gc-display">{String(currentStep.index + 1).padStart(2, "0")} / {String(currentStep.total).padStart(2, "0")}</span>
              {" · "}
              {currentStep.title}
            </span>
          ) : null}
        </span>
        <span className="font-gc-display text-sm font-bold tabular-nums text-gc-primary">{progress.percent}%</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-gc-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        aria-label="回答の進捗"
      >
        <div
          className="h-full rounded-full bg-gc-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}

export function ConsentSection({
  notice,
  label,
  checked,
  onChange,
  error,
}: {
  notice: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <section
      id="field-privacy_consent"
      aria-labelledby="consent-title"
      className={`gc-consent flex flex-col gap-4 rounded-gc-lg border bg-gc-surface p-5 sm:p-6 ${
        error ? "border-gc-danger/45" : "border-gc-border"
      }`}
    >
      <h2 id="consent-title" className="flex flex-wrap items-center gap-2 text-[17px] font-bold">
        <Lock aria-hidden className="size-4 text-gc-primary" />
        個人情報の取り扱い
        <RequiredBadge required />
      </h2>
      <p className="rounded-gc bg-gc-surface-muted px-4 py-3 text-sm leading-relaxed text-gc-muted">{notice}</p>
      <label className="group flex min-h-14 cursor-pointer select-none items-center gap-3 rounded-gc border border-gc-border-strong px-4 py-3 text-base font-semibold transition-colors hover:border-gc-primary/50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gc-primary/20 has-[:checked]:border-gc-primary has-[:checked]:bg-gc-primary-soft has-[:checked]:text-gc-primary">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          className="sr-only"
        />
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-md border-2 border-gc-border-strong bg-gc-surface transition-colors group-has-[:checked]:border-gc-primary group-has-[:checked]:bg-gc-primary"
        >
          <Check className="size-4 text-gc-on-primary opacity-0 group-has-[:checked]:opacity-100" strokeWidth={3} />
        </span>
        {label}
      </label>
      <FieldError id="field-privacy_consent-error" message={error} />
    </section>
  );
}

export function SubmitArea({
  submitting,
  canSubmit,
  showFixErrors,
  showSubmitError,
}: {
  submitting: boolean;
  /** False until privacy consent is given (the existing guard). */
  canSubmit: boolean;
  showFixErrors: boolean;
  showSubmitError: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {showFixErrors ? <Notice>{PAGE_COPY.fixErrors}</Notice> : null}
      {showSubmitError ? <Notice>{PAGE_COPY.submitError}</Notice> : null}
      <button
        type="submit"
        disabled={submitting || !canSubmit}
        className="gc-submit flex min-h-14 w-full items-center justify-center gap-2 rounded-gc bg-gc-primary px-6 py-4 text-base font-bold text-gc-on-primary shadow-sm transition-colors hover:bg-gc-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gc-primary/30 disabled:cursor-not-allowed disabled:bg-gc-border-strong disabled:text-gc-surface disabled:shadow-none"
      >
        {submitting ? <Loader2 aria-hidden className="size-5 animate-spin" /> : null}
        {submitting ? PAGE_COPY.submitting : PAGE_COPY.submit}
      </button>
      {!canSubmit && !submitting ? (
        <p className="text-center text-xs text-gc-subtle">{PAGE_COPY.consentToSubmit}</p>
      ) : null}
      <p className="flex items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-gc-subtle">
        <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        <span>{PAGE_COPY.trustNote}</span>
      </p>
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-gc bg-gc-danger-soft px-4 py-3 text-sm leading-snug text-gc-danger">
      <AlertCircle aria-hidden className="mt-px size-4 shrink-0" />
      {children}
    </p>
  );
}

export function CompletionScreen() {
  return (
    <main className="gc-completion flex min-h-[100svh] items-center justify-center px-4 py-12">
      <div className="gc-completion-card flex w-full max-w-md flex-col items-center gap-6 bg-gc-surface px-6 py-12 text-center sm:px-10">
        <span className="flex size-16 items-center justify-center rounded-full bg-gc-primary-soft">
          <Check aria-hidden className="size-8 text-gc-primary" strokeWidth={2.5} />
        </span>
        <p className="font-gc-display text-xs tracking-[0.12em] text-gc-primary">GUIDE COMMUNITY</p>
        <h1 className="font-gc-display text-3xl font-extrabold tracking-tight text-gc-text">
          {PAGE_COPY.completeHeading}
        </h1>
        <div className="flex flex-col gap-2 text-[15px] leading-relaxed text-gc-muted">
          {PAGE_COPY.completeBody.map((line, index) => (
            <p key={line} className={index === 0 ? "text-lg font-bold text-gc-text" : undefined}>
              {line}
            </p>
          ))}
        </div>
        <div className="mt-2 flex w-full flex-col items-center gap-1 border-t border-gc-border pt-6">
          <BrandMark />
          <p className="font-gc-display text-sm text-gc-subtle">{PAGE_COPY.tagline}</p>
        </div>
      </div>
    </main>
  );
}

export function PageFooter() {
  return (
    <footer className="border-t border-gc-border py-8">
      <PageContainer className="flex flex-col items-center gap-1 text-center">
        <BrandMark />
        <p className="font-gc-display text-xs text-gc-subtle">{PAGE_COPY.tagline}</p>
      </PageContainer>
    </footer>
  );
}
