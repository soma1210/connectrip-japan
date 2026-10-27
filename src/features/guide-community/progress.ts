// Completion progress for the form, per section and overall. Counts only
// required questions that are currently visible, plus the consent checkbox,
// so the bar reaches 100% exactly when the form can be submitted.

import { SECTIONS, isVisible, type FormValues } from "./config/questions";
import { validateQuestion } from "./validation";

export type SectionProgress = {
  id: string;
  title: string;
  answered: number;
  total: number;
  complete: boolean;
};

export type FormProgress = {
  sections: SectionProgress[];
  answered: number;
  total: number;
  /** 0–100, rounded down. */
  percent: number;
};

export function computeProgress(values: FormValues): FormProgress {
  const sections = SECTIONS.map((section, index): SectionProgress => {
    const required = section.questions.filter((q) => q.required && isVisible(q, values));
    let answered = required.filter(
      (q) =>
        Object.keys(validateQuestion(q, values)).length === 0 &&
        // Language levels has nothing to answer until a language is picked.
        !(q.type === "languageLevels" && values[q.sourceField].length === 0),
    ).length;
    let total = required.length;

    // The consent checkbox lives at the end of the last section.
    if (index === SECTIONS.length - 1) {
      total += 1;
      if (values.privacy_consent) answered += 1;
    }
    return { id: section.id, title: section.title, answered, total, complete: answered === total };
  });

  const answered = sections.reduce((sum, s) => sum + s.answered, 0);
  const total = sections.reduce((sum, s) => sum + s.total, 0);
  return {
    sections,
    answered,
    total,
    percent: total === 0 ? 100 : Math.floor((answered / total) * 100),
  };
}
