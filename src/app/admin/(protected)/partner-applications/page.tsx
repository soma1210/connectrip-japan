import Link from "next/link";
import { INDUSTRIES, industryLabel } from "@/features/partner-survey/config/questions";
import { formatDate } from "@/features/guide-community/format";
import type { PartnerApplicationFilters } from "@/features/partner-survey/types";
import {
  getPartnerPipelineStatuses,
  listPartnerApplications,
  partnerStorageMode,
} from "@/lib/data/partner-applications";
import { ClickableRow } from "../guide-applications/ClickableRow";
import { PartnerStatusBadge } from "./PartnerStatusBadge";

const controlClass =
  "h-10 w-full rounded-md border border-navy/15 bg-white px-3 text-sm text-navy focus:border-navy/50 focus:outline-none focus:ring-2 focus:ring-navy/10";

function parseFilters(
  params: Record<string, string | string[] | undefined>,
  statuses: string[],
): PartnerApplicationFilters {
  const one = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  };
  const status = one("pipeline_status");
  const industry = one("industry");
  return {
    q: one("q")?.slice(0, 100),
    pipeline_status: status && statuses.includes(status) ? status : undefined,
    industry: industry && INDUSTRIES.some((option) => option.value === industry) ? industry : undefined,
  };
}

export default async function AdminPartnerApplicationsPage({
  searchParams,
}: PageProps<"/admin/partner-applications">) {
  const statuses = await getPartnerPipelineStatuses();
  const filters = parseFilters(await searchParams, statuses);
  const applications = await listPartnerApplications(filters);
  const activeCount = Object.values(filters).filter(Boolean).length;
  const detail = (id: string) => `/admin/partner-applications/${id}`;

  return (
    // Break out of the admin layout's narrow column so the table has room.
    <div className="relative left-1/2 flex w-[min(1200px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">パートナー応募</h1>
          <p className="mt-1 text-sm text-navy/60">パートナーアンケート（/partner/apply）の回答一覧</p>
        </div>
        <Link
          href="/partner/apply"
          target="_blank"
          className="rounded-md border border-navy/20 bg-white px-3 py-2 text-xs hover:border-navy/50"
        >
          アンケートを開く ↗
        </Link>
      </div>

      {partnerStorageMode === "local-file" ? (
        <p className="rounded-md border border-gold/60 bg-gold/10 px-4 py-3 text-sm">
          ローカル開発モード：データベース未接続のため、回答は{" "}
          <code className="bg-navy/5 px-1">.data/partner-applications.json</code> に保存されています。
        </p>
      ) : null}
      {partnerStorageMode === "none" ? (
        <p className="rounded-md border border-red/40 bg-red/5 px-4 py-3 text-sm">
          データベースが未接続のため、パートナーアンケートは送信を受け付けていません。
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
          {activeCount ? (
            <Link href="/admin/partner-applications" className="text-xs text-navy/60 underline-offset-2 hover:underline">
              Clear filters
            </Link>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-navy/60">
            キーワード（会社名・担当者・メール・電話・エリア・受付番号）
            <input type="search" name="q" defaultValue={filters.q ?? ""} placeholder="例：茶の庭 / P-20261027" className={controlClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-navy/60">
            ステータス
            <select name="pipeline_status" defaultValue={filters.pipeline_status ?? ""} className={controlClass}>
              <option value="">すべて</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-navy/60">
            業種
            <select name="industry" defaultValue={filters.industry ?? ""} className={controlClass}>
              <option value="">すべて</option>
              {INDUSTRIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="h-10 shrink-0 rounded-md bg-navy px-6 text-sm text-white hover:bg-navy/90">
            絞り込む
          </button>
        </div>
      </form>

      <p className="text-sm text-navy/70">
        <span className="text-lg font-semibold text-navy">{applications.length}</span> 件
        {activeCount ? "（絞り込み中）" : ""}
      </p>

      {applications.length === 0 ? (
        <p className="rounded-lg border border-dashed border-navy/20 bg-white px-4 py-12 text-center text-sm text-navy/50">
          {activeCount ? "条件に合う回答がありません。" : "まだ回答がありません。"}
        </p>
      ) : (
        <>
          {/* Phones: one card per application */}
          <ul className="flex flex-col gap-3 md:hidden">
            {applications.map((app) => (
              <li key={app.id}>
                <Link
                  href={detail(app.id)}
                  className="flex flex-col gap-3 rounded-lg border border-navy/15 bg-white p-4 active:bg-cream"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{app.company_name}</p>
                      <p className="text-xs text-navy/50">
                        {formatDate(app.created_at, true)} ・ {app.receipt_no}
                      </p>
                    </div>
                    <PartnerStatusBadge status={app.pipeline_status} statuses={statuses} />
                  </div>
                  <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-navy/50">業種</dt>
                    <dd>{industryLabel(app.industry)}</dd>
                    <dt className="text-navy/50">エリア</dt>
                    <dd className="break-words">{app.area}</dd>
                    <dt className="text-navy/50">担当者</dt>
                    <dd className="break-words">{app.contact_name}</dd>
                    <dt className="text-navy/50">メール</dt>
                    <dd className="break-all">{app.email}</dd>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>

          {/* Tablets and up: table */}
          <div className="hidden overflow-x-auto rounded-lg border border-navy/15 bg-white md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-navy/10 bg-navy/[0.03] text-xs text-navy/60">
                <tr>
                  {["会社名・施設名", "業種", "エリア", "担当者", "メールアドレス", "応募日時", "ステータス", ""].map((heading) => (
                    <th key={heading || "detail"} className="whitespace-nowrap px-4 py-3 font-medium">
                      {heading || <span className="sr-only">詳細</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {applications.map((app) => (
                  <ClickableRow key={app.id} href={detail(app.id)}>
                    <td className="min-w-40 px-4 py-3">
                      <Link
                        href={detail(app.id)}
                        className="font-semibold text-navy underline decoration-navy/30 underline-offset-4 group-hover:decoration-navy"
                      >
                        {app.company_name}
                        <span aria-hidden className="ml-1 inline-block text-navy/40 transition-transform group-hover:translate-x-0.5 group-hover:text-navy">
                          →
                        </span>
                      </Link>
                      <p className="mt-0.5 text-xs text-navy/50">{app.receipt_no}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{industryLabel(app.industry)}</td>
                    <td className="min-w-28 max-w-48 px-4 py-3 text-xs">
                      <p className="line-clamp-2 break-words">{app.area}</p>
                    </td>
                    <td className="min-w-24 max-w-40 px-4 py-3 text-xs">
                      <p className="line-clamp-2 break-words">{app.contact_name}</p>
                    </td>
                    <td className="max-w-52 px-4 py-3 text-xs">
                      <p className="truncate">{app.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-navy/60">{formatDate(app.created_at, true)}</td>
                    <td className="px-4 py-3">
                      <PartnerStatusBadge status={app.pipeline_status} statuses={statuses} />
                    </td>
                    <td className="whitespace-nowrap py-3 pl-2 pr-4 text-right">
                      <Link
                        href={detail(app.id)}
                        className="inline-flex items-center rounded-md border border-navy/20 bg-white px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:border-navy group-hover:border-navy/50"
                      >
                        詳細を見る →
                      </Link>
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
