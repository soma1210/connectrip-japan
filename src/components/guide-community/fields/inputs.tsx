// Low-level, reusable inputs. Each takes a value, an onChange and an optional
// error — no knowledge of the application form. Restyle freely: colors come
// from the --gc-* variables in src/app/guide-community/guide-community.css.

import { Fragment } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Option } from "@/features/guide-community/config/options";
import { FieldError, describedBy } from "./FieldShell";

// 48px tall, 16px text (prevents iOS zoom on focus), one radius everywhere.
const inputClass =
  "block w-full min-h-12 rounded-gc border border-gc-border-strong bg-gc-surface px-4 py-3 text-base leading-normal text-gc-text placeholder:text-gc-subtle transition-[border-color,box-shadow] hover:border-gc-muted/60 focus:border-gc-primary focus:outline-none focus:ring-4 focus:ring-gc-primary/15 aria-[invalid=true]:border-gc-danger aria-[invalid=true]:focus:ring-gc-danger/15";

type Common = {
  id: string;
  error?: string;
  hint?: string;
  onBlur?: () => void;
};

export function TextInput({
  id,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  autoComplete,
  maxLength,
  required,
}: Common & {
  type?: "text" | "email" | "tel";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      name={id}
      type={type}
      inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      autoComplete={autoComplete}
      maxLength={maxLength}
      aria-required={required || undefined}
      className={inputClass}
      {...describedBy(id, { hint, error })}
    />
  );
}

export function TextArea({
  id,
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  maxLength,
  required,
  recommendedLength,
}: Common & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  /** Display-only guide with a "120 / 500" counter; never blocks submission. */
  recommendedLength?: { min: number; max: number };
}) {
  const length = value.trim().length;
  const inRange =
    recommendedLength && length >= recommendedLength.min && length <= recommendedLength.max;
  const over = recommendedLength && length > recommendedLength.max;

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        id={id}
        name={id}
        rows={recommendedLength ? 7 : 5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-required={required || undefined}
        className={`${inputClass} min-h-36 resize-y`}
        {...describedBy(id, { hint, error })}
      />
      {recommendedLength ? (
        <p className="flex items-center justify-between gap-3 text-xs text-gc-subtle" aria-live="polite">
          <span>
            目安 {recommendedLength.min}〜{recommendedLength.max}文字
          </span>
          <span
            className={`font-gc-display tabular-nums ${
              over ? "text-gc-accent-ink" : inRange ? "font-semibold text-gc-primary" : ""
            }`}
          >
            {inRange ? <Check aria-hidden className="mr-0.5 inline size-3.5 align-[-2px]" /> : null}
            {length} / {recommendedLength.max}
          </span>
        </p>
      ) : null}
    </div>
  );
}

export function SelectInput({
  id,
  value,
  onChange,
  onBlur,
  error,
  hint,
  options,
  placeholder = "選択してください",
  required,
}: Common & {
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-required={required || undefined}
        className={`${inputClass} appearance-none pr-11 ${value ? "" : "text-gc-subtle"}`}
        {...describedBy(id, { hint, error })}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-gc-text">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-gc-muted"
      />
    </div>
  );
}

export type ChoiceLayout = "pills" | "grid" | "list" | "stack";

/**
 * Pick a layout from the longest label so options never squeeze or scroll
 * sideways: short labels wrap as pills, medium ones sit two per row, long
 * sentences get a full-width card each.
 */
export function choiceLayout(options: readonly Option[]): ChoiceLayout {
  const longest = Math.max(...options.map((option) => option.label.length));
  if (longest <= 6) return "pills";
  if (longest <= 11) return "grid";
  return "stack";
}

const layoutClass: Record<ChoiceLayout, string> = {
  pills: "flex flex-wrap gap-2",
  grid: "grid grid-cols-2 gap-2 sm:grid-cols-3",
  /** Vertical ○ list on phones, two per row from tablet width (language levels). */
  list: "grid grid-cols-1 gap-2 sm:grid-cols-2",
  stack: "grid grid-cols-1 gap-2",
};

/**
 * Selectable chips/cards for radio (single) or checkbox (multi) answers.
 * The native input stays in the DOM (visually hidden) for keyboard, screen
 * reader and form semantics. Render inside a FieldShell with `group`.
 */
export function ChoiceList({
  name,
  kind,
  options,
  isChecked,
  onToggle,
  layout = choiceLayout(options),
}: {
  name: string;
  kind: "radio" | "checkbox";
  options: readonly Option[];
  isChecked: (value: string) => boolean;
  onToggle: (value: string) => void;
  layout?: ChoiceLayout;
}) {
  return (
    <div className={layoutClass[layout]} data-layout={layout}>
      {options.map((option) => {
        const checked = isChecked(option.value);
        return (
          <label
            key={option.value}
            className={`gc-choice group flex min-h-12 cursor-pointer select-none items-center gap-2.5 border bg-gc-surface text-[15px] leading-snug text-gc-text transition-colors hover:border-gc-primary/50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gc-primary/20 has-[:checked]:border-gc-primary has-[:checked]:bg-gc-primary-soft has-[:checked]:font-semibold has-[:checked]:text-gc-primary ${
              layout === "pills" ? "rounded-full py-2.5 pl-3 pr-4" : "rounded-gc px-3.5 py-3"
            } border-gc-border-strong`}
          >
            <input
              type={kind}
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onToggle(option.value)}
              className="sr-only"
            />
            <ChoiceIndicator kind={kind} />
            <span className="min-w-0 [overflow-wrap:anywhere] [word-break:keep-all]">
              <BreakableLabel text={option.label} />
            </span>
          </label>
        );
      })}
    </div>
  );
}

/**
 * Japanese labels like 「ネイティブ／ネイティブレベル」 should wrap at the
 * separator, not mid-word: allow breaks only after ／ and ・ (keep-all on the
 * parent), falling back to breaking anywhere if a segment is still too long.
 */
function BreakableLabel({ text }: { text: string }) {
  const parts = text.split(/(?<=[／・])/);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? <wbr /> : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}

function ChoiceIndicator({ kind }: { kind: "radio" | "checkbox" }) {
  if (kind === "radio") {
    return (
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-gc-border-strong bg-gc-surface transition-colors group-has-[:checked]:border-gc-primary"
      >
        <span className="size-2.5 rounded-full bg-gc-primary opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-gc-border-strong bg-gc-surface transition-colors group-has-[:checked]:border-gc-primary group-has-[:checked]:bg-gc-primary"
    >
      <Check className="size-3.5 text-gc-on-primary opacity-0 group-has-[:checked]:opacity-100" strokeWidth={3} />
    </span>
  );
}

/** Free-text box revealed under a choice list when "その他" is picked. Same pattern everywhere. */
export function OtherInput({
  id,
  value,
  onChange,
  onBlur,
  error,
}: Common & { value: string; onChange: (value: string) => void }) {
  return (
    <div className="gc-appear flex flex-col gap-2 rounded-gc border-l-4 border-gc-primary/40 bg-gc-surface-muted p-3 sm:p-4">
      <label htmlFor={id} className="text-sm font-semibold text-gc-text">
        「その他」の内容を入力してください
      </label>
      <TextInput id={id} value={value} onChange={onChange} onBlur={onBlur} error={error} maxLength={200} />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
