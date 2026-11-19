"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BUSINESS_CATEGORIES,
  CURRENT_CHALLENGES,
  CUSTOMER_TYPES,
  INBOUND_EXPERIENCE,
  INTERESTED_COLLABORATIONS,
  OTHER,
  optionLabel,
  optionLabels,
  type ChoiceOption,
} from "@/features/partner-registration/config";
import {
  EMPTY_FILTERS,
  NO_PRIORITY,
  PARTNER_STATUSES,
  PRIORITIES,
  SORTS,
  SUMMARY_STATUSES,
  filterAndSort,
  filtersToQuery,
  hasActiveFilters,
  parseFilters,
  statusLabel,
  type PartnerRegistrationFilters,
  type PartnerSort,
} from "@/features/partner-registration/admin";
import type { PartnerRegistration } from "@/features/partner-registration/types";
import { ClickableRow } from "./ClickableRow";
import {
  ChoiceChips,
  NextActionDate,
  PartnerStatusBadge,
  PriorityBadge,
  formatAnsweredAt,
} from "./PartnerRegistrationBadges";

type StorageMode = "postgres" | "local-file" | "none";

const controlClass =
  "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none";

/** Chips shown per row for challenges and collaborations before "+N". */
const CHIP_LIMIT = 2;

export function PartnerRegistrationsList({
  registrations,
  today,
  storageMode,
}: {
  registrations: PartnerRegistration[];
  today: string;
  storageMode: StorageMode;
}) {
  // Read from the URL on mount (not from page props) so coming back from a detail page restores the filters.
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => parseFilters(Object.fromEntries(searchParams)));

  // Keep the URL in step so the filtered list survives opening a detail page and coming back.
  function update(next: Partial<PartnerRegistrationFilters>) {
    const merged = { ...filters, ...next };
    setFilters(merged);
    const query = filtersToQuery(merged);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  const visible = useMemo(() => filterAndSort([...registrations], filters), [registrations, filters]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of registrations) map.set(row.status, (map.get(row.status) ?? 0) + 1);
    return map;
  }, [registrations]);

  const active = hasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Partners</p>
        <h1 className="text-2xl font-semibold tracking-tight">事業者アンケート回答</h1>
        <p className="text-sm text-slate-600">事業者向けアンケート（/partner/apply）の回答一覧です。行をクリックすると詳細を開きます。</p>
      </header>

      {storageMode === "local-file" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          ローカル開発モード：データベース未接続のため、<code className="rounded bg-white/60 px-1">.data/partner-registrations.json</code>{" "}
          を表示しています。
        </p>
      ) : null}
      {storageMode === "none" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          データベースが未接続です。<code className="rounded bg-white/60 px-1">POSTGRES_URL</code> を設定してください。
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="総回答数" count={registrations.length} selected={!filters.status} onClick={() => update({ status: "" })} />
        {SUMMARY_STATUSES.map((status) => (
          <SummaryCard
            key={status}
            label={statusLabel(status)}
            count={counts.get(status) ?? 0}
            selected={filters.status === status}
            onClick={() => update({ status: filters.status === status ? "" : status })}
          />
        ))}
      </div>

      <form className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4" onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            検索
            <input
              type="search"
              value={filters.q}
              onChange={(event) => update({ q: event.target.value })}
              placeholder="会社名・店舗名、担当者名、所在地、メールアドレス"
              className={controlClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            並び替え
            <select value={filters.sort} onChange={(event) => update({ sort: event.target.value as PartnerSort })} className={controlClass}>
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <FilterSelect label="事業カテゴリ" value={filters.business_category} options={BUSINESS_CATEGORIES} onChange={(value) => update({ business_category: value })} />
          <FilterSelect label="ステータス" value={filters.status} options={PARTNER_STATUSES} onChange={(value) => update({ status: value })} />
          <FilterSelect
            label="優先度"
            value={filters.priority}
            options={[...PRIORITIES, { value: NO_PRIORITY, label: "未設定" }]}
            onChange={(value) => update({ priority: value })}
          />
          <FilterSelect label="外国人受入実績" value={filters.inbound_experience} options={INBOUND_EXPERIENCE} onChange={(value) => update({ inbound_experience: value })} />
          <FilterSelect label="興味のある連携" value={filters.collaboration} options={INTERESTED_COLLABORATIONS} onChange={(value) => update({ collaboration: value })} />
        </div>
      </form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          <span className="text-base font-semibold text-navy">{visible.length}</span> / {registrations.length} 件
        </p>
        {active ? (
          <button
            type="button"
            onClick={() => update({ ...EMPTY_FILTERS, sort: filters.sort })}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-navy hover:border-navy"
          >
            すべて解除
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600">
          {registrations.length === 0 ? "まだ回答がありません。" : "条件に合う回答がありません。"}
        </p>
      ) : (
        <>
          {/* Phones and tablets: one card per answer */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {visible.map((row) => (
              <li key={row.id}>
                <Link href={`/admin/partner-registrations/${row.id}`} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4 active:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{row.company_name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {row.contact_name} ・ {categoryLabel(row)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <PartnerStatusBadge value={row.status} />
                      <PriorityBadge value={row.priority} />
                    </div>
                  </div>
                  <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-slate-500">所在地・エリア</dt>
                    <dd>{row.area}</dd>
                    <dt className="text-slate-500">受入実績</dt>
                    <dd>{optionLabel(INBOUND_EXPERIENCE, row.inbound_experience)}</dd>
                    <dt className="text-slate-500">連携</dt>
                    <dd>
                      <ChoiceChips labels={optionLabels(INTERESTED_COLLABORATIONS, row.interested_collaborations)} max={CHIP_LIMIT} />
                    </dd>
                    <dt className="text-slate-500">次回対応</dt>
                    <dd>
                      <NextAction row={row} today={today} />
                    </dd>
                    <dt className="text-slate-500">回答日</dt>
                    <dd>{formatAnsweredAt(row.created_at)}</dd>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table. Admin columns come first so they stay visible without scrolling. */}
          <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white lg:block">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  {["会社名 / 担当者", "ステータス", "優先度", "次回対応", "回答日", "事業カテゴリ", "所在地 / エリア", "主な顧客層", "外国人受入実績", "現在の課題", "興味のある連携"].map(
                    (label) => (
                      <th key={label} className="whitespace-nowrap px-3 py-2.5 font-medium">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => (
                  <ClickableRow key={row.id} href={`/admin/partner-registrations/${row.id}`}>
                    <td className="min-w-40 max-w-56 px-3 py-3">
                      <Link
                        href={`/admin/partner-registrations/${row.id}`}
                        className="font-semibold text-navy underline decoration-navy/25 underline-offset-4 group-hover:decoration-navy"
                      >
                        {row.company_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">{row.contact_name}</p>
                    </td>
                    <td className="px-3 py-3">
                      <PartnerStatusBadge value={row.status} />
                    </td>
                    <td className="px-3 py-3">
                      <PriorityBadge value={row.priority} />
                    </td>
                    <td className="min-w-32 px-3 py-3">
                      <NextAction row={row} today={today} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600">{formatAnsweredAt(row.created_at)}</td>
                    <td className="min-w-24 px-3 py-3 text-xs">{categoryLabel(row)}</td>
                    <td className="min-w-28 max-w-40 px-3 py-3 text-xs">{row.area}</td>
                    <td className="min-w-32 px-3 py-3">
                      <ChoiceChips labels={optionLabels(CUSTOMER_TYPES, row.customer_types)} max={CHIP_LIMIT} />
                    </td>
                    <td className="min-w-28 px-3 py-3 text-xs">{optionLabel(INBOUND_EXPERIENCE, row.inbound_experience)}</td>
                    <td className="min-w-36 px-3 py-3">
                      <ChoiceChips labels={optionLabels(CURRENT_CHALLENGES, row.current_challenges)} max={CHIP_LIMIT} />
                    </td>
                    <td className="min-w-36 px-3 py-3">
                      <ChoiceChips labels={optionLabels(INTERESTED_COLLABORATIONS, row.interested_collaborations)} max={CHIP_LIMIT} />
                    </td>
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
  options: readonly ChoiceOption[];
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

function NextAction({ row, today }: { row: PartnerRegistration; today: string }) {
  if (!row.next_action && !row.next_action_at) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className="flex flex-col gap-0.5">
      {row.next_action_at ? <NextActionDate date={row.next_action_at} today={today} /> : null}
      {row.next_action ? <span className="text-xs text-slate-600">{row.next_action}</span> : null}
    </span>
  );
}

function categoryLabel(row: PartnerRegistration) {
  const label = optionLabel(BUSINESS_CATEGORIES, row.business_category);
  return row.business_category === OTHER && row.business_category_other ? `${label}（${row.business_category_other}）` : label;
}

