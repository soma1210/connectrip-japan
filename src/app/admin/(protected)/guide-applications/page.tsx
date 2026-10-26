import Link from "next/link";
import {
  AREAS,
  DAYS,
  EMPLOYMENT_STATUSES,
  GUIDE_EXPERIENCE,
  GUIDE_PURPOSES,
  INTERVIEW_PREFERENCES,
  LANGUAGE_LEVELS,
  LANGUAGES,
  MONTHLY_AVAILABILITY,
  labelOf,
  type Option,
} from "@/features/guide-community/config/options";
import { hasActiveFilters, parseFilters } from "@/features/guide-community/filters";
import {
  formatChoice,
  formatChoices,
  formatDate,
  languageName,
} from "@/features/guide-community/format";
import type { GuideApplication, GuideApplicationFilters } from "@/features/guide-community/types";
import {
  getPipelineStatuses,
  guideStorageMode,
  listGuideApplications,
} from "@/lib/data/guide-applications";
import { StatusBadge } from "./StatusBadge";

const controlClass =
  "h-10 w-full rounded-md border border-navy/15 bg-white px-3 text-sm text-navy focus:border-navy/50 focus:outline-none focus:ring-2 focus:ring-navy/10";

const LEVEL_OPTIONS = LANGUAGE_LEVELS.map((level) => ({ ...level, label: `${level.label} 以上` }));

/** 月・水・土 style short form of the available days. */
function shortDays(days: string[]) {
  return days.map((day) => (day === "Irregular" ? "不定期" : labelOf(DAYS, day).slice(0, 1))).join("・");
}

function FilterSelect({
  name,
  label,
  options,
  value,
}: {
  name: keyof GuideApplicationFilters;
  label: string;
  options: readonly Option[];
  value?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-navy/60">
      {label}
      <select name={name} defaultValue={value ?? ""} className={`${controlClass} ${value ? "border-navy/40 font-medium" : ""}`}>
        <option value="">すべて</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LanguageList({ app, compact = false }: { app: GuideApplication; compact?: boolean }) {
  return (
    <ul className={compact ? "flex flex-wrap gap-1" : "flex flex-col gap-0.5"}>
      {app.languages.map((skill) => (
        <li
          key={skill.language}
          className={compact ? "rounded bg-navy/5 px-1.5 py-0.5 text-xs" : undefined}
        >
          <span className="font-medium">{languageName(skill)}</span>
          <span className="text-navy/50">・{labelOf(LANGUAGE_LEVELS, skill.level)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminGuideApplicationsPage({
  searchParams,
}: PageProps<"/admin/guide-applications">) {
  const statuses = await getPipelineStatuses();
  const filters = parseFilters(await searchParams, statuses);
  const applications = await listGuideApplications(filters);
  const statusOptions = statuses.map((status) => ({ value: status, label: status }));
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    // Break out of the admin layout's narrow column so the table has room.
    <div className="relative left-1/2 flex w-[min(1200px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">ガイド応募者</h1>
          <p className="mt-1 text-sm text-navy/60">Connectrip Guide Community の応募一覧</p>
        </div>
        <Link
          href="/guide-community"
          target="_blank"
          className="rounded-md border border-navy/20 bg-white px-3 py-2 text-xs hover:border-navy/50"
        >
          応募フォームを開く ↗
        </Link>
      </div>

      {guideStorageMode === "local-file" ? (
        <p className="rounded-md border border-gold/60 bg-gold/10 px-4 py-3 text-sm">
          ローカル開発モード：データベース未接続のため、応募は{" "}
          <code className="bg-navy/5 px-1">.data/guide-applications.json</code> に保存されています。
        </p>
      ) : null}
      {guideStorageMode === "none" ? (
        <p className="rounded-md border border-red/40 bg-red/5 px-4 py-3 text-sm">
          データベースが未接続のため、応募フォームは送信を受け付けていません。
          <code className="bg-navy/5 px-1">POSTGRES_URL</code> を設定し{" "}
          <code className="bg-navy/5 px-1">bun run db:init</code> を実行してください。
        </p>
      ) : null}

      <form method="get" className="flex flex-col gap-4 rounded-lg border border-navy/15 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            Filters
            {activeCount ? (
              <span className="ml-2 rounded-full bg-navy px-2 py-0.5 text-[11px] font-medium text-white">
                {activeCount}
              </span>
            ) : null}
          </p>
          {hasActiveFilters(filters) ? (
            <Link href="/admin/guide-applications" className="text-xs text-navy/60 underline-offset-2 hover:underline">
              Clear filters
            </Link>
          ) : null}
        </div>

        <label className="flex flex-col gap-1 text-xs font-medium text-navy/60">
          キーワード（名前・メール・電話・市区町村）
          <input type="search" name="q" defaultValue={filters.q ?? ""} placeholder="例：山田 / @gmail.com" className={controlClass} />
        </label>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <FilterSelect name="pipeline_status" label="ステータス" options={statusOptions} value={filters.pipeline_status} />
          <FilterSelect name="language" label="言語" options={LANGUAGES} value={filters.language} />
          <FilterSelect name="min_level" label="言語レベル" options={LEVEL_OPTIONS} value={filters.min_level} />
          <FilterSelect name="area" label="対応エリア" options={AREAS} value={filters.area} />
          <FilterSelect name="guide_experience" label="ガイド経験" options={GUIDE_EXPERIENCE} value={filters.guide_experience} />
          <FilterSelect name="employment_status" label="職業" options={EMPLOYMENT_STATUSES} value={filters.employment_status} />
          <FilterSelect name="day" label="稼働可能曜日" options={DAYS} value={filters.day} />
          <FilterSelect name="monthly_availability" label="月間稼働可能日数" options={MONTHLY_AVAILABILITY} value={filters.monthly_availability} />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-navy/50">
            言語とレベルを両方選ぶと「その言語がそのレベル以上」の応募者に絞り込みます。
          </p>
          <button type="submit" className="h-10 shrink-0 rounded-md bg-navy px-6 text-sm text-white hover:bg-navy/90">
            絞り込む
          </button>
        </div>
      </form>

      <p className="text-sm text-navy/70">
        <span className="text-lg font-semibold text-navy">{applications.length}</span> 件
        {hasActiveFilters(filters) ? "（絞り込み中）" : ""}
      </p>

      {applications.length === 0 ? (
        <p className="rounded-lg border border-dashed border-navy/20 bg-white px-4 py-12 text-center text-sm text-navy/50">
          {hasActiveFilters(filters) ? "条件に合う応募者がいません。" : "まだ応募がありません。"}
        </p>
      ) : (
        <>
          {/* Phones: one card per applicant */}
          <ul className="flex flex-col gap-3 md:hidden">
            {applications.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/admin/guide-applications/${app.id}`}
                  className="flex flex-col gap-3 rounded-lg border border-navy/15 bg-white p-4 active:bg-cream"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{app.name}</p>
                      <p className="text-xs text-navy/50">
                        {formatDate(app.created_at)} 応募 ・ {app.prefecture} {app.city}
                      </p>
                    </div>
                    <StatusBadge status={app.pipeline_status} statuses={statuses} />
                  </div>
                  <LanguageList app={app} compact />
                  <dl className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-navy/50">対応エリア</dt>
                    <dd>{formatChoices(AREAS, app.available_areas, app.available_areas_other)}</dd>
                    <dt className="text-navy/50">ガイド経験</dt>
                    <dd>{formatChoice(GUIDE_EXPERIENCE, app.guide_experience)}</dd>
                    <dt className="text-navy/50">職業</dt>
                    <dd>{formatChoice(EMPLOYMENT_STATUSES, app.employment_status, app.employment_status_other)}</dd>
                    <dt className="text-navy/50">稼働</dt>
                    <dd>
                      {formatChoice(MONTHLY_AVAILABILITY, app.monthly_availability)}／月 ・ {shortDays(app.available_days)}
                    </dd>
                    <dt className="text-navy/50">面談希望</dt>
                    <dd>{formatChoice(INTERVIEW_PREFERENCES, app.interview_preference)}</dd>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>

          {/* Tablets and up: table */}
          <div className="hidden overflow-x-auto rounded-lg border border-navy/15 bg-white md:block">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-navy/10 bg-navy/[0.03] text-xs text-navy/60">
                <tr>
                  {["名前・居住", "ステータス", "言語・レベル", "対応エリア", "ガイド経験", "職業", "稼働", "目的", "応募日"].map(
                    (heading) => (
                      <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {applications.map((app) => (
                  <tr key={app.id} className="align-top transition-colors hover:bg-cream/70">
                    <td className="min-w-36 px-4 py-3">
                      <Link
                        href={`/admin/guide-applications/${app.id}`}
                        className="font-semibold underline-offset-2 hover:underline"
                      >
                        {app.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-navy/50">
                        {app.prefecture} {app.city}
                      </p>
                    </td>
                    <td className="min-w-32 px-4 py-3">
                      <StatusBadge status={app.pipeline_status} statuses={statuses} />
                      <p className="mt-1.5 text-xs text-navy/50">
                        {formatChoice(INTERVIEW_PREFERENCES, app.interview_preference)}
                      </p>
                    </td>
                    <td className="min-w-44 px-4 py-3 text-xs">
                      <LanguageList app={app} />
                    </td>
                    <td className="min-w-28 px-4 py-3 text-xs">
                      {formatChoices(AREAS, app.available_areas, app.available_areas_other)}
                    </td>
                    <td className="min-w-28 px-4 py-3 text-xs">{formatChoice(GUIDE_EXPERIENCE, app.guide_experience)}</td>
                    <td className="min-w-24 px-4 py-3 text-xs">
                      {formatChoice(EMPLOYMENT_STATUSES, app.employment_status, app.employment_status_other)}
                    </td>
                    <td className="min-w-24 px-4 py-3 text-xs">
                      <p className="whitespace-nowrap font-medium">
                        {formatChoice(MONTHLY_AVAILABILITY, app.monthly_availability)}／月
                      </p>
                      <p className="text-navy/50">{shortDays(app.available_days)}</p>
                    </td>
                    <td className="min-w-40 max-w-56 px-4 py-3 text-xs text-navy/70">
                      <p className="line-clamp-3">
                        {formatChoices(GUIDE_PURPOSES, app.guide_purposes, app.guide_purposes_other)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-navy/60">{formatDate(app.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
