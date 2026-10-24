"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import type {
  InquiryFieldName,
  InquiryFieldSpec,
  InquiryFormModel,
  InquiryFormState,
  InquiryFormValues,
  InquirySubmitHandler,
} from "@/contracts";
import { cn } from "@/lib/cn";
import { TbdMark, TbdText } from "./Tbd";

// Class strings reused from the current site's ReservationSection.
const inputClass =
  "border border-cream/20 bg-navy-light px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none";
const labelClass = "flex flex-col gap-2 text-xs tracking-[0.1em] text-cream/70";

function isRequired(field: InquiryFieldSpec) {
  return field.required.status !== "TBD" && field.required.value;
}

function FieldLabel({ field }: { field: InquiryFieldSpec }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <TbdText value={field.label} slot="Field label" />
      {isRequired(field) ? <span className="text-red">*</span> : null}
    </span>
  );
}

function readValues(form: HTMLFormElement, fields: InquiryFieldSpec[]): InquiryFormValues {
  const data = new FormData(form);
  const text = (name: InquiryFieldName) => {
    const v = data.get(name);
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const num = (name: string) => {
    const v = data.get(name);
    return typeof v === "string" && v !== "" ? Number(v) : undefined;
  };
  const values: InquiryFormValues = {};
  for (const field of fields) {
    switch (field.name) {
      case "name":
      case "email":
      case "country":
      case "preferredDate":
      case "placesToVisit":
      case "idealDay":
      case "notes":
      case "message":
        values[field.name] = text(field.name);
        break;
      case "partySize":
        values.partySize = { adults: num("partySize") };
        break;
      case "children":
        values.children = { count: num("children") };
        break;
      case "destinations":
        values.destinations = data.getAll("destinations") as InquiryFormValues["destinations"];
        break;
      case "activities":
        values.activities = data.getAll("activities") as InquiryFormValues["activities"];
        break;
      default:
        break;
    }
  }
  return values;
}

function Field({ field, error }: { field: InquiryFieldSpec; error?: string }) {
  const errorLine = error ? <span className="text-[11px] normal-case tracking-normal text-red">{error}</span> : null;
  const help = field.helpText ? (
    <TbdText value={field.helpText} slot="Help text" className="text-[11px] normal-case tracking-normal text-cream/50" />
  ) : null;

  if (field.kind === "multiselect") {
    return (
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-xs tracking-[0.1em] text-cream/70">
          <FieldLabel field={field} />
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {field.options?.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-cream/85">
              <input type="checkbox" name={field.name} value={option.value} className="h-4 w-4 border-cream/30 bg-navy-light accent-red" />
              <TbdText value={option.label} slot="Option" />
            </label>
          ))}
        </div>
        {help}
        {errorLine}
      </fieldset>
    );
  }

  const common = { name: field.name, required: isRequired(field), maxLength: field.maxLength };

  return (
    <label className={labelClass}>
      <FieldLabel field={field} />
      {field.kind === "textarea" ? (
        <textarea {...common} rows={4} className={cn(inputClass, "resize-none")} />
      ) : (
        <input
          {...common}
          type={field.kind === "email" ? "email" : field.kind === "date" ? "date" : field.kind === "number" || field.kind === "children" ? "number" : "text"}
          min={field.kind === "number" || field.kind === "children" ? 0 : undefined}
          className={inputClass}
        />
      )}
      {help}
      {errorLine}
    </label>
  );
}

/**
 * Inquiry form driven entirely by `InquiryFormModel`. Submits only through
 * the handler it receives (mock in the preview).
 */
export function InquiryForm({ model, onSubmit, notice }: { model: InquiryFormModel; onSubmit: InquirySubmitHandler; notice?: string }) {
  const [state, setState] = useState<InquiryFormState>({ phase: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if ((new FormData(form).get(model.honeypotFieldName) as string | null)?.length) return;
    setState({ phase: "submitting" });
    const result = await onSubmit(readValues(form, model.fields));
    setState(result.ok ? { phase: "submitted" } : { phase: "error", result });
  }

  if (state.phase === "submitted") {
    return (
      <div className="flex flex-col items-center gap-6 border border-gold/30 bg-navy-dark p-10 text-center">
        <CheckCircle2 className="h-14 w-14 text-gold" strokeWidth={1.5} />
        <TbdText value={model.successMessage} slot="Success message" as="p" className="text-sm text-cream/80" />
        {notice ? <p className="text-xs text-cream/50">{notice}</p> : null}
        <button type="button" onClick={() => setState({ phase: "idle" })} className="text-xs text-cream/60 underline hover:text-gold">
          Reset preview
        </button>
      </div>
    );
  }

  const fieldErrors = state.phase === "error" ? state.result.fieldErrors : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8 border border-gold/30 bg-navy-dark p-6 md:p-10">
      <TbdText value={model.expectationNote} slot="Expectation note" as="p" className="text-sm text-cream/75" />

      <div className="grid gap-6 sm:grid-cols-2">
        {model.fields.map((field) => (
          <div key={field.name} className={field.kind === "textarea" || field.kind === "multiselect" ? "sm:col-span-2" : undefined}>
            <Field field={field} error={fieldErrors?.[field.name]} />
          </div>
        ))}
      </div>

      <input type="text" name={model.honeypotFieldName} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="flex flex-col gap-2 text-xs text-cream/60">
        <TbdText value={model.consent.label} slot="Consent wording" />
        <a href={model.consent.privacyHref} className="w-fit underline hover:text-gold">
          Privacy Policy
        </a>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={state.phase === "submitting"}
          className="w-fit border border-gold bg-red px-8 py-4 text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover disabled:opacity-60"
        >
          {model.submitLabel.status === "TBD" ? <TbdMark slot="Submit copy" note={model.submitLabel.note} className="border-cream/50 bg-transparent text-cream" /> : model.submitLabel.value}
        </button>
        {state.phase === "error" ? <p className="text-sm text-red">Error: {state.result.kind}</p> : null}
        {notice ? <p className="text-xs text-cream/50">{notice}</p> : null}
      </div>
    </form>
  );
}
