"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  EMPTY_FILTERS,
  NOT_SET,
  datePart,
  distinctValues,
  filterApplications,
  filtersToQuery,
  hasActiveFilters,
  parseFilters,
  type GuideSheetFilters,
} from "@/features/guide-sheet/admin";
import { INTERVIEW_STATUSES, STATUSES, choiceOf } from "@/features/guide-sheet/config";
import type { GuideSheetData, SheetApplication } from "@/features/guide-sheet/types";
import { ClickableRow } from "./ClickableRow";
import { ChoiceChips } from "./PartnerRegistrationBadges";
import { EvaluationBadge, GuideSheetNotices, InterviewStatusBadge, SheetStatusBadge } from "./GuideSheetBadges";
import { GuideSheetRefresh } from "./GuideSheetRefresh";

type Option = { value: string; label: string };

const controlClass =
  "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none";

/** Chips shown per row for languages and areas before "+N". */
const CHIP_LIMIT = 3;

const detailHref = (row: SheetApplication) => `/admin/guide-sheet/${encodeURIComponent(row.key)}`;

export function GuideSheetList({ data }: { data: GuideSheetData }) {
  const { applications } = data;

  // Read from the URL on mount so coming back from a detail page restores the filters.
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => parseFilters(Object.fromEntries(searchParams)));

  function update(next: Partial<GuideSheetFilters>) {
    const merged = { ...filters, ...next };
    setFilters(merged);
    const query = filtersToQuery(merged);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  const visible = useMemo(() => filterApplications(applications, filters), [applications, filters]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of applications) map.set(row.fields.status, (map.get(row.fields.status) ?? 0) + 1);
    return map;
  }, [applications]);

  // Statuses the sheet uses but this app does not know yet still get a card and a filter entry.
  const statusValues = useMemo(
    () => distinctValues([...STATUSES.map((status) => status.value), ...applications.map((row) => row.fields.status)]),
    [applications],
  );

  const options = useMemo(() => {
    const withNotSet = (values: string[], label: (value: string) => string, notSet: string): Option[] => [
      ...values.map((value) => ({ value, label: label(value) })),
      { value: NOT_SET, label: notSet },
    ];
    return {
      status: statusValues.map((value) => ({ value, label: choiceOf(STATUSES, value).label })),
      interview: withNotSet(
        distinctValues(applications.map((row) => row.fields.interviewStatus)),
        (value) => choiceOf(INTERVIEW_STATUSES, value).label,
        "未入力",
      ),
      evaluation: withNotSet(
        distinctValues(applications.map((row) => row.fields.evaluation)).sort(),
        (value) => value,
        "未評価",
      ),
      language: distinctValues(applications.flatMap((row) => row.languages)).map((value) => ({ value, label: value })),
      area: distinctValues(applications.flatMap((row) => row.areas)).map((value) => ({ value, label: value })),
    };
  }, [applications, statusValues]);

  const active = hasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Guides</p>
          <h1 className="text-2xl font-semibold tracking-tight">ガイド応募（Google Form）</h1>
          <p className="text-sm text-slate-600">
            Google Sheets「Connectrip Guide Applications」の回答を読み取り専用で表示しています。行をクリックすると詳細を開きます。
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <GuideSheetRefresh fetchedAt={data.fetchedAt} />
          {data.sheetUrl ? (
            <a href={data.sheetUrl} target="_blank" rel="noreferrer" className="text-xs text-slate-500 underline underline-offset-2 hover:text-navy">
              Google Sheets で開く
            </a>
          ) : null}
        </div>
      </header>

      <GuideSheetNotices data={data} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="応募総数" count={applications.length} selected={!filters.status} onClick={() => update({ status: "" })} />
        {statusValues.map((status) => (
          <SummaryCard
            key={status}
            label={choiceOf(STATUSES, status).label}
            count={counts.get(status) ?? 0}
            selected={filters.status === status}
            onClick={() => update({ status: filters.status === status ? "" : status })}
          />
        ))}
      </div>

      <form className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          検索
          <input
            type="search"
            value={filters.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="名前、メールアドレス、Application ID"
            className={controlClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <FilterSelect label="Status" value={filters.status} options={options.status} onChange={(value) => update({ status: value })} />
          <FilterSelect label="Interview Status" value={filters.interview} options={options.interview} onChange={(value) => update({ interview: value })} />
          <FilterSelect label="Evaluation" value={filters.evaluation} options={options.evaluation} onChange={(value) => update({ evaluation: value })} />
          <FilterSelect label="言語" value={filters.language} options={options.language} onChange={(value) => update({ language: value })} />
          <FilterSelect label="対応エリア" value={filters.area} options={options.area} onChange={(value) => update({ area: value })} />
        </div>
      </form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          <span className="text-base font-semibold text-navy">{visible.length}</span> / {applications.length} 件
        </p>
        {active ? (
          <button
            type="button"
            onClick={() => update(EMPTY_FILTERS)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-navy hover:border-navy"
          >
            すべて解除
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600">
          {applications.length === 0 ? "まだ応募がありません。" : "条件に合う応募者がいません。"}
        </p>
      ) : (
        <>
          {/* Phones and tablets: one card per applicant */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {visible.map((row) => (
              <li key={row.key}>
                <Link href={detailHref(row)} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4 active:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{row.fields.name || "（名前なし）"}</p>
                      <p className="truncate text-xs text-slate-500">{row.fields.applicationId || "ID 未採番"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <SheetStatusBadge value={row.fields.status} />
                      <InterviewStatusBadge value={row.fields.interviewStatus} />
                    </div>
                  </div>
                  <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-slate-500">評価</dt>
                    <dd>
                      <EvaluationBadge value={row.fields.evaluation} />
                    </dd>
                    <dt className="text-slate-500">言語</dt>
                    <dd>
                      <Languages row={row} />
                    </dd>
                    <dt className="text-slate-500">対応エリア</dt>
                    <dd>
                      <ChoiceChips labels={row.areas} max={CHIP_LIMIT} />
                    </dd>
                    <dt className="text-slate-500">応募日</dt>
                    <dd>{datePart(row.fields.submittedAt) || "—"}</dd>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: only what is checked every day. Everything else is on the detail page. */}
          <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white lg:block">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  {["名前 / Application ID", "Status", "Interview", "Evaluation", "言語", "対応エリア", "居住地", "応募日"].map((label) => (
                    <th key={label} className="whitespace-nowrap px-3 py-2.5 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => (
                  <ClickableRow key={row.key} href={detailHref(row)}>
                    <td className="min-w-40 max-w-56 px-3 py-3">
                      <Link
                        href={detailHref(row)}
                        className="font-semibold text-navy underline decoration-navy/25 underline-offset-4 group-hover:decoration-navy"
                      >
                        {row.fields.name || "（名前なし）"}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">{row.fields.applicationId || "ID 未採番"}</p>
                    </td>
                    <td className="px-3 py-3">
                      <SheetStatusBadge value={row.fields.status} />
                    </td>
                    <td className="px-3 py-3">
                      <InterviewStatusBadge value={row.fields.interviewStatus} />
                    </td>
                    <td className="px-3 py-3">
                      <EvaluationBadge value={row.fields.evaluation} />
                    </td>
                    <td className="min-w-36 px-3 py-3">
                      <Languages row={row} />
                    </td>
                    <td className="min-w-32 px-3 py-3">
                      <ChoiceChips labels={row.areas} max={CHIP_LIMIT} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600">{row.fields.prefecture || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600">{datePart(row.fields.submittedAt) || "—"}</td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Languages({ row }: { row: SheetApplication }) {
  return (
    <span className="flex flex-col gap-1">
      <ChoiceChips labels={row.languages} max={CHIP_LIMIT} />
      {row.fields.languageLevel ? <span className="text-[11px] text-slate-500">レベル：{row.fields.languageLevel}</span> : null}
    </span>
  );
}

function SummaryCard({ label, count, selected, onClick }: { label: string; count: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col items-start gap-1 rounded-md border px-4 py-3 text-left transition-colors ${
        selected ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-navy hover:border-slate-400"
      }`}
    >
      <span className={`text-xs ${selected ? "text-white/80" : "text-slate-500"}`}>{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{count}</span>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-600">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={`${controlClass} ${value ? "border-navy font-medium" : ""}`}>
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
