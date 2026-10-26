"use client";

// All client-side form behaviour — state, conditional visibility, errors,
// progress and submission — with no markup. Any UI (the current minimal one
// or an Astra redesign) only needs to call this hook and render its output.

import { useCallback, useMemo, useState } from "react";
import { INITIAL_VALUES, type FormValues, type Question, isVisible } from "./config/questions";
import { computeProgress } from "./progress";
import { validateQuestion, validateValues } from "./validation";
import type { FieldErrors } from "./types";

export const SUBMIT_ENDPOINT = "/api/guide-applications";

export type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function useGuideApplicationForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  /** Fields the user has left at least once (or every field after a submit attempt). */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  const allErrors = useMemo(() => validateValues(values), [values]);
  const progress = useMemo(() => computeProgress(values), [values]);

  /** Errors to display: shown once a field is touched, or everywhere after a submit attempt. */
  const errorFor = useCallback(
    (field: string): string | undefined => {
      const message = allErrors[field] ?? serverErrors[field];
      if (!message) return undefined;
      const base = field.split(".")[0];
      return submitAttempted || touched[field] || touched[base] ? message : undefined;
    },
    [allErrors, serverErrors, submitAttempted, touched],
  );

  const setValue = useCallback(<K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setServerErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const toggleValue = useCallback(
    (field: { [K in keyof FormValues]: FormValues[K] extends string[] ? K : never }[keyof FormValues], value: string) => {
      setValues((prev) => {
        const current = prev[field];
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        return { ...prev, [field]: next };
      });
      setTouched((prev) => ({ ...prev, [field]: true }));
    },
    [],
  );

  const setLanguageLevel = useCallback((language: string, level: string) => {
    setValues((prev) => ({
      ...prev,
      language_levels: { ...prev.language_levels, [language]: level },
    }));
    setTouched((prev) => ({ ...prev, [`language_levels.${language}`]: true }));
  }, []);

  const touch = useCallback((field: string) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const visible = useCallback((question: Question) => isVisible(question, values), [values]);

  const hasQuestionError = useCallback(
    (question: Question) => Object.keys(validateQuestion(question, values)).length > 0,
    [values],
  );

  const submit = useCallback(async () => {
    setSubmitAttempted(true);
    if (Object.keys(allErrors).length > 0) {
      setStatus("idle");
      return { ok: false as const, firstErrorField: Object.keys(allErrors)[0] };
    }

    setStatus("submitting");
    try {
      const response = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => null);

      if (response.status === 422 && body?.errors) {
        setServerErrors(body.errors as FieldErrors);
        setStatus("idle");
        return { ok: false as const, firstErrorField: Object.keys(body.errors)[0] };
      }
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      setStatus("success");
      return { ok: true as const };
    } catch {
      setStatus("error");
      return { ok: false as const };
    }
  }, [allErrors, values]);

  return {
    values,
    setValue,
    toggleValue,
    setLanguageLevel,
    touch,
    errorFor,
    visible,
    hasQuestionError,
    progress,
    status,
    submitAttempted,
    hasErrors: Object.keys(allErrors).length > 0,
    submit,
  };
}

export type GuideApplicationFormApi = ReturnType<typeof useGuideApplicationForm>;
