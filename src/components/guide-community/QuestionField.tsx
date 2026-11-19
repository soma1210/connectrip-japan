"use client";

// Connects one question definition (config/questions.ts) to the form hook and
// the presentational inputs. Adding a question type = one new case here.

import { Languages } from "lucide-react";
import { LANGUAGES, OTHER, labelOf } from "@/features/guide-community/config/options";
import type { Question } from "@/features/guide-community/config/questions";
import type { GuideApplicationFormApi } from "@/features/guide-community/useGuideApplicationForm";
import { FieldError, FieldShell } from "./fields/FieldShell";
import { ChoiceList, OtherInput, SelectInput, TextArea, TextInput } from "./fields/inputs";

const fieldId = (field: string) => `field-${field}`;

export function QuestionField({
  question,
  form,
}: {
  question: Question;
  form: GuideApplicationFormApi;
}) {
  const { values, setValue, toggleValue, setLanguageLevel, touch, errorFor } = form;
  const shell = {
    label: question.label,
    required: question.required,
    hint: question.hint,
    examples: question.examples,
    // Conditional questions fade in when they appear.
    className: question.visibleWhen ? "gc-appear" : "",
  };

  switch (question.type) {
    case "text":
    case "email":
    case "tel": {
      const id = fieldId(question.field);
      return (
        <FieldShell id={id} {...shell} error={errorFor(question.field)}>
          <TextInput
            id={id}
            type={question.type}
            value={values[question.field]}
            onChange={(value) => setValue(question.field, value)}
            onBlur={() => touch(question.field)}
            error={errorFor(question.field)}
            hint={question.hint}
            placeholder={question.placeholder}
            autoComplete={question.autoComplete}
            maxLength={question.maxLength}
            required={question.required}
          />
        </FieldShell>
      );
    }

    case "textarea": {
      const id = fieldId(question.field);
      // Example answers read lighter as a placeholder than as a list above the box.
      const placeholder =
        question.placeholder ??
        (question.examples?.length ? `例：${question.examples.join("、")}` : undefined);
      return (
        <FieldShell id={id} {...shell} examples={undefined} error={errorFor(question.field)}>
          <TextArea
            id={id}
            value={values[question.field]}
            onChange={(value) => setValue(question.field, value)}
            onBlur={() => touch(question.field)}
            error={errorFor(question.field)}
            hint={question.hint}
            placeholder={placeholder}
            maxLength={question.maxLength}
            required={question.required}
            recommendedLength={question.recommendedLength}
          />
        </FieldShell>
      );
    }

    case "select": {
      const id = fieldId(question.field);
      return (
        <FieldShell id={id} {...shell} error={errorFor(question.field)}>
          <SelectInput
            id={id}
            value={values[question.field]}
            onChange={(value) => setValue(question.field, value)}
            onBlur={() => touch(question.field)}
            error={errorFor(question.field)}
            hint={question.hint}
            options={question.options}
            required={question.required}
          />
        </FieldShell>
      );
    }

    case "radio":
    case "checkbox": {
      const multi = question.type === "checkbox";
      const selected: string[] = multi
        ? (values[question.field] as string[])
        : [values[question.field] as string];
      const otherField = question.otherField;
      const otherError = otherField ? errorFor(otherField) : undefined;
      return (
        <FieldShell
          id={fieldId(question.field)}
          {...shell}
          error={errorFor(question.field)}
          invalid={Boolean(otherError)}
          group
        >
          <ChoiceList
            name={question.field}
            kind={multi ? "checkbox" : "radio"}
            options={question.options}
            isChecked={(value) => selected.includes(value)}
            onToggle={(value) => {
              if (question.type === "checkbox") {
                toggleValue(question.field, value);
              } else {
                setValue(question.field, value);
                touch(question.field);
              }
            }}
          />
          {otherField && selected.includes(OTHER) ? (
            <OtherInput
              id={fieldId(otherField)}
              value={values[otherField]}
              onChange={(value) => setValue(otherField, value)}
              onBlur={() => touch(otherField)}
              error={otherError}
            />
          ) : null}
        </FieldShell>
      );
    }

    case "location": {
      const { prefecture, city } = question;
      const prefectureError = errorFor("prefecture");
      const cityError = errorFor("city");
      return (
        <FieldShell id="q-location" {...shell} invalid={Boolean(prefectureError || cityError)} group>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={fieldId("prefecture")} className="text-sm font-semibold text-gc-muted">
                {prefecture.label}
              </label>
              <SelectInput
                id={fieldId("prefecture")}
                value={values.prefecture}
                onChange={(value) => setValue("prefecture", value)}
                onBlur={() => touch("prefecture")}
                error={prefectureError}
                options={prefecture.options}
                required={question.required}
              />
              <FieldError id={`${fieldId("prefecture")}-error`} message={prefectureError} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={fieldId("city")} className="text-sm font-semibold text-gc-muted">
                {city.label}
              </label>
              <TextInput
                id={fieldId("city")}
                value={values.city}
                onChange={(value) => setValue("city", value)}
                onBlur={() => touch("city")}
                error={cityError}
                placeholder={city.placeholder}
                autoComplete="address-level2"
                maxLength={city.maxLength}
                required={question.required}
              />
              <FieldError id={`${fieldId("city")}-error`} message={cityError} />
            </div>
          </div>
        </FieldShell>
      );
    }

    case "languageLevels": {
      const languages = values[question.sourceField];
      const anyError = languages.some((language) => errorFor(`language_levels.${language}`));
      return (
        <FieldShell id="q-language_levels" {...shell} invalid={anyError} group>
          {languages.length === 0 ? (
            <p className="flex items-center gap-2 rounded-gc border border-dashed border-gc-border-strong px-4 py-4 text-sm text-gc-subtle">
              <Languages aria-hidden className="size-4 shrink-0" />
              上の質問で言語を選ぶと、ここで言語ごとのレベルを選べます。
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {languages.map((language) => {
                const key = `language_levels.${language}`;
                const error = errorFor(key);
                const isOther = language === OTHER;
                const name = isOther
                  ? values.languages_other.trim() || "その他の言語"
                  : labelOf(LANGUAGES, language);
                return (
                  <div
                    key={language}
                    id={fieldId(key)}
                    role="radiogroup"
                    aria-label={`${name}のレベル`}
                    className={`gc-language gc-appear flex flex-col gap-3 rounded-gc border p-4 sm:p-5 ${
                      error ? "border-gc-danger/45 bg-gc-danger-soft/40" : "border-gc-border bg-gc-bg"
                    }`}
                  >
                    <p className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-gc-text">{name}</span>
                      {!isOther ? (
                        <span className="font-gc-display text-xs font-medium text-gc-subtle">{language}</span>
                      ) : null}
                    </p>
                    <ChoiceList
                      name={key}
                      kind="radio"
                      options={question.levels}
                      layout="list"
                      isChecked={(level) => values.language_levels[language] === level}
                      onToggle={(level) => setLanguageLevel(language, level)}
                    />
                    <FieldError id={`${fieldId(key)}-error`} message={error} />
                  </div>
                );
              })}
            </div>
          )}
        </FieldShell>
      );
    }
  }
}
