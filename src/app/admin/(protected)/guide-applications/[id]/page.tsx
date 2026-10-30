import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LANGUAGE_LEVELS, labelOf } from "@/features/guide-community/config/options";
import { SECTIONS, type Question } from "@/features/guide-community/config/questions";
import {
  INTERNAL_RATING_MAX,
  INTERNAL_RATING_MIN,
} from "@/features/guide-community/config/pipeline";
import {
  formatChoice,
  formatChoices,
  formatDate,
  formatLanguages,
  languageName,
} from "@/features/guide-community/format";
import type { GuideApplication } from "@/features/guide-community/types";
import { getGuideApplication, getPipelineStatuses } from "@/lib/data/guide-applications";
import { listInterviewsForApplication } from "@/lib/data/guide-interviews";
import { isCalendarConfigured } from "@/lib/google-calendar";
import { isMailConfigured } from "@/lib/mailer";
import { StatusBadge } from "../StatusBadge";
import { saveAdminFields } from "./actions";
import { InterviewPanel } from "./InterviewPanel";

/** Display text for one question's answer, driven by the same config as the form. */
function answerText(question: Question, app: GuideApplication): string {
  switch (question.type) {
    case "location":
      return `${app.prefecture} ${app.city}`;
    case "languageLevels":
      return formatLanguages(app.languages);
    case "checkbox": {
      // Languages are stored as {language, level} pairs, with the "Other" name inside the pair.
      if (question.field === "languages") {
        return formatChoices(
          question.options,
          app.languages.map((skill) => skill.language),
          app.languages.find((skill) => skill.custom_name)?.custom_name,
        );
      }
      const values = app[question.field as keyof GuideApplication] as string[];
      const other = question.otherField
        ? (app[question.otherField as keyof GuideApplication] as string | null)
        : null;
      return formatChoices(question.options, values, other);
    }
    case "radio":
    case "select": {
      const value = app[question.field as keyof GuideApplication] as string | null;
      const other = question.otherField
        ? (app[question.otherField as keyof GuideApplication] as string | null)
        : null;
      return formatChoice(question.options, value, other);
    }
    default:
      return (app[question.field as keyof GuideApplication] as string | null) ?? "";
  }
}

/** Admin-facing names for the form's sections (keyed by section id). */
const GROUP_TITLES: Record<string, string> = {
  basic: "基本情報",
  languages: "言語",
  experience: "ガイド経験",
  availability: "稼働条件",
  work: "仕事・目的",
  about: "人物情報",
  interview: "面談",
};

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-xs text-navy/40">未評価</span>;
  return (
    <span className="text-sm tracking-tight text-gold" aria-label={`社内評価 ${rating}`}>
      {"★".repeat(rating)}
      <span className="text-navy/15">{"★".repeat(INTERNAL_RATING_MAX - rating)}</span>
    </span>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-navy/15 bg-white">
      <h2 className="border-b border-navy/10 bg-navy/[0.03] px-4 py-2.5 text-sm font-semibold">{title}</h2>
      <dl className="divide-y divide-navy/10">{children}</dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
      <dt className="text-xs leading-relaxed text-navy/55">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

/** Free-text answers (motivation, self-introduction…): label above, full-width readable block. */
function LongRow({ label, text, highlight = false }: { label: string; text: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <dt className={`text-xs leading-relaxed ${highlight ? "font-semibold text-navy" : "text-navy/55"}`}>{label}</dt>
      <dd
        className={`whitespace-pre-wrap break-words rounded-md leading-[1.9] ${
          highlight
            ? "border-l-4 border-gold bg-cream/70 px-4 py-3 text-[15px]"
            : "bg-navy/[0.03] px-3 py-2.5 text-sm"
        }`}
      >
        {text}
      </dd>
    </div>
  );
}

const empty = <span className="text-navy/35">—</span>;

export default async function AdminGuideApplicationDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/guide-applications/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [app, statuses, interviews] = await Promise.all([
    getGuideApplication(id),
    getPipelineStatuses(),
    listInterviewsForApplication(id),
  ]);
  if (!app) notFound();

  return (
    <div className="relative left-1/2 flex w-[min(1100px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-6">
      <Link
        href="/admin/guide-applications"
        className="w-fit rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy transition-colors hover:border-navy"
      >
        ← 応募者一覧に戻る
      </Link>

      {/* Summary */}
      <header className="flex flex-col gap-4 rounded-lg border border-navy/15 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">{app.name}</h1>
            <p className="mt-1 text-xs text-navy/55">
              {formatDate(app.created_at, true)} 応募 ・ {app.prefecture} {app.city}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={app.pipeline_status} statuses={statuses} />
            <Stars rating={app.internal_rating} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <a href={`mailto:${app.email}`} className="rounded-md border border-navy/15 px-3 py-1.5 hover:border-navy/40">
            ✉ {app.email}
          </a>
          <a href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} className="rounded-md border border-navy/15 px-3 py-1.5 hover:border-navy/40">
            ☎ {app.phone}
          </a>
        </div>
        <ul className="flex flex-wrap gap-1.5">
          {app.languages.map((skill) => (
            <li key={skill.language} className="rounded-full bg-navy/5 px-2.5 py-1 text-xs">
              <span className="font-semibold">{languageName(skill)}</span>
              <span className="text-navy/55"> ・{labelOf(LANGUAGE_LEVELS, skill.level)}</span>
            </li>
          ))}
        </ul>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Internal Management — first on phones, right column on desktop */}
        {/* Not sticky: with the interview panel the column can be taller than the screen. */}
        <aside className="flex flex-col gap-4 lg:order-2">
          <InterviewPanel
            applicationId={app.id}
            interviews={interviews}
            calendarConfigured={isCalendarConfigured}
            mailConfigured={isMailConfigured}
          />
          <form
            action={saveAdminFields.bind(null, app.id)}
            className="overflow-hidden rounded-lg border-2 border-navy bg-white"
          >
            <div className="bg-navy px-4 py-3 text-white">
              <p className="text-sm font-semibold tracking-wide">Internal Management</p>
              <p className="text-[11px] text-white/70">管理者のみ・応募者には表示されません</p>
            </div>
            <div className="flex flex-col gap-5 p-4">
              {saved ? (
                <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  ✓ 保存しました
                </p>
              ) : null}
              <label className="flex flex-col gap-1.5 text-xs font-medium text-navy/60">
                ステータス
                {/* Keyed so the select follows changes made elsewhere (interview approval / completion)
                    without a reload; defaultValue alone is only read on mount. */}
                <select
                  key={app.pipeline_status}
                  name="pipeline_status"
                  defaultValue={app.pipeline_status}
                  className="h-10 rounded-md border border-navy/20 bg-white px-3 text-sm text-navy focus:border-navy/50 focus:outline-none"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="flex flex-col gap-1.5">
                <legend className="mb-1.5 text-xs font-medium text-navy/60">
                  社内評価（{INTERNAL_RATING_MIN}〜{INTERNAL_RATING_MAX}）
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {[null, ...Array.from({ length: INTERNAL_RATING_MAX - INTERNAL_RATING_MIN + 1 }, (_, i) => INTERNAL_RATING_MIN + i)].map(
                    (rating) => (
                      <label
                        key={rating ?? "none"}
                        className="flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border border-navy/20 px-2.5 text-sm has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy/30"
                      >
                        <input
                          type="radio"
                          name="internal_rating"
                          value={rating ?? ""}
                          defaultChecked={(app.internal_rating ?? null) === rating}
                          className="sr-only"
                        />
                        {rating == null ? "未評価" : `★${rating}`}
                      </label>
                    ),
                  )}
                </div>
              </fieldset>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-navy/60">
                社内メモ
                <textarea
                  name="internal_notes"
                  rows={7}
                  defaultValue={app.internal_notes}
                  placeholder="面談メモ、連絡履歴など"
                  className="rounded-md border border-navy/20 px-3 py-2 text-sm leading-relaxed text-navy focus:border-navy/50 focus:outline-none"
                />
              </label>
              <button type="submit" className="h-10 rounded-md bg-navy text-sm font-medium text-white hover:bg-navy/90">
                保存する
              </button>
              <p className="text-[11px] text-navy/45">最終更新 {formatDate(app.updated_at, true)}</p>
            </div>
          </form>
        </aside>

        {/* Applicant answers */}
        <div className="flex flex-col gap-4 lg:order-1">
          {SECTIONS.map((section) => (
            <Group key={section.id} title={GROUP_TITLES[section.id] ?? section.title}>
              {section.questions.map((question) => {
                if (question.type === "languageLevels") {
                  return (
                    <Row key={question.number} label={`Q${question.number}. ${question.label}`}>
                      <ul className="flex flex-col gap-1">
                        {app.languages.map((skill) => (
                          <li key={skill.language} className="flex flex-wrap items-center gap-2">
                            <span className="min-w-20 font-medium">{languageName(skill)}</span>
                            <span className="rounded bg-navy/5 px-2 py-0.5 text-xs">
                              {labelOf(LANGUAGE_LEVELS, skill.level)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Row>
                  );
                }
                const text = answerText(question, app);
                const label = `Q${question.number}. ${question.label}`;
                if (question.type === "textarea" && text) {
                  return (
                    <LongRow
                      key={question.number}
                      label={label}
                      text={text}
                      highlight={question.field === "self_introduction"}
                    />
                  );
                }
                return (
                  <Row key={question.number} label={label}>
                    {text || (question.visibleWhen ? <span className="text-navy/35">（該当なし）</span> : empty)}
                  </Row>
                );
              })}
              {section.id === "interview" ? (
                <Row label="応募日時">{formatDate(app.created_at, true)}</Row>
              ) : null}
            </Group>
          ))}
          <Group title="同意">
            <Row label="個人情報の取り扱い">同意済み（{formatDate(app.privacy_consented_at, true)}）</Row>
          </Group>
        </div>
      </div>
    </div>
  );
}
