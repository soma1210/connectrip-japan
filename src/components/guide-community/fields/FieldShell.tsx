import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

/**
 * Shared frame for every question: a quiet divider with the label,
 * 必須/任意 badge, hint, examples, the input(s) and the error message.
 * Presentational only.
 *
 * `group` renders a <fieldset>/<legend> (for radio/checkbox sets) instead of
 * a <label>-based header. `invalid` tints the question divider; pass it when any
 * field inside the question has an error.
 */
export function FieldShell({
  id,
  label,
  required,
  hint,
  examples,
  error,
  invalid,
  group = false,
  className = "",
  children,
}: {
  id: string;
  label: string;
  required: boolean;
  hint?: string;
  examples?: string[];
  error?: string;
  invalid?: boolean;
  group?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const Wrapper = group ? "fieldset" : "div";
  const hasError = Boolean(error) || Boolean(invalid);

  const heading = (
    <span className="flex flex-col gap-1">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[17px] font-bold leading-snug text-gc-text">{label}</span>
        <RequiredBadge required={required} />
      </span>
    </span>
  );

  return (
    <Wrapper
      id={group ? id : undefined}
      data-field={id}
      data-invalid={hasError || undefined}
      className={`gc-question min-w-0 transition-colors ${
        hasError ? "border-gc-danger/45" : "border-gc-border"
      } ${className}`}
    >
      {group ? (
        <legend className="float-left w-full p-0">{heading}</legend>
      ) : (
        <label htmlFor={id} className="block">
          {heading}
        </label>
      )}
      <div className="clear-both flex flex-col gap-3 pt-3">
        {hint ? (
          <p id={`${id}-hint`} className="-mt-1 text-sm leading-relaxed text-gc-muted">
            {hint}
          </p>
        ) : null}
        {examples?.length ? (
          <p className="-mt-1 text-sm text-gc-muted">例：{examples.join(" / ")}</p>
        ) : null}
        {children}
        <FieldError id={`${id}-error`} message={error} />
      </div>
    </Wrapper>
  );
}

export function RequiredBadge({ required }: { required: boolean }) {
  return required ? (
    <span className="inline-flex items-center rounded-full bg-gc-primary-soft px-2 py-0.5 text-[11px] font-semibold leading-4 text-gc-primary">
      必須
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gc-surface-muted px-2 py-0.5 text-[11px] font-medium leading-4 text-gc-muted">
      任意
    </span>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm leading-snug text-gc-danger">
      <AlertCircle aria-hidden className="mt-px size-4 shrink-0" strokeWidth={2} />
      {message}
    </p>
  );
}

/** aria-* props linking an input to its hint and error text. */
export function describedBy(id: string, { hint, error }: { hint?: string; error?: string }) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": ids.length ? ids.join(" ") : undefined,
  } as const;
}
