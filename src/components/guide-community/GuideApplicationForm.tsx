"use client";

import type { FormEvent } from "react";
import {
  PRIVACY_CONSENT_LABEL,
  PRIVACY_NOTICE,
  SECTIONS,
} from "@/features/guide-community/config/questions";
import { useGuideApplicationForm } from "@/features/guide-community/useGuideApplicationForm";
import {
  CompletionScreen,
  ConsentSection,
  FormProgress,
  FormSection,
  Hero,
  PageContainer,
  PageFooter,
  SubmitArea,
} from "./FormParts";
import { QuestionField } from "./QuestionField";
import { useActiveStep } from "./useActiveStep";

const SECTION_IDS = SECTIONS.map((section) => section.id);

/** Bring the first invalid field into view after a failed submit. */
function focusField(field?: string) {
  if (!field) return;
  const element =
    document.getElementById(`field-${field}`) ??
    document.getElementById(field.startsWith("language_levels") ? "q-language_levels" : "") ??
    document.getElementById(field === "prefecture" || field === "city" ? "q-location" : "");
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    element.focus({ preventScroll: true });
  }
}

/** `homeHref`: the Connectrip Japan site top for the "Back to" links. */
export function GuideApplicationForm({ homeHref }: { homeHref: string }) {
  const form = useGuideApplicationForm();
  const { values, setValue, errorFor, visible, progress, status, submitAttempted, hasErrors } = form;
  const activeStep = useActiveStep(SECTION_IDS);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await form.submit();
    if (result.ok) {
      window.scrollTo({ top: 0 });
    } else {
      focusField(result.firstErrorField);
    }
  }

  if (status === "success") return <CompletionScreen homeHref={homeHref} />;

  return (
    <>
      <Hero homeHref={homeHref} />
      <main className="pb-16">
        <PageContainer>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-12">
            <FormProgress
              progress={progress}
              currentStep={{ index: activeStep, total: SECTIONS.length, title: SECTIONS[activeStep].title }}
            />

            {SECTIONS.map((section, index) => (
              <FormSection
                key={section.id}
                id={section.id}
                index={index}
                title={section.title}
                subtitle={section.subtitle}
                description={section.description}
              >
                {section.questions.filter(visible).map((question) => (
                  <QuestionField key={question.number} question={question} form={form} />
                ))}
              </FormSection>
            ))}

            <div className="flex flex-col gap-6">
              <ConsentSection
                notice={PRIVACY_NOTICE}
                label={PRIVACY_CONSENT_LABEL}
                checked={values.privacy_consent}
                onChange={(checked) => setValue("privacy_consent", checked)}
                error={errorFor("privacy_consent")}
              />

              {/* Honeypot — hidden from people and assistive tech. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.website}
                    onChange={(event) => setValue("website", event.target.value)}
                  />
                </label>
              </div>

              <SubmitArea
                submitting={status === "submitting"}
                canSubmit={values.privacy_consent}
                showFixErrors={submitAttempted && hasErrors}
                showSubmitError={status === "error"}
              />
            </div>
          </form>
        </PageContainer>
      </main>
      <PageFooter />
    </>
  );
}
