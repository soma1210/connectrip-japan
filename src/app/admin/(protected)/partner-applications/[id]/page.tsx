import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FIELDS, QUESTION_NUMBERS, STEPS, industryLabel, type FieldKey } from "@/features/partner-survey/config/questions";
import {
  INTERNAL_RATING_MAX,
  INTERNAL_RATING_MIN,
} from "@/features/partner-survey/config/pipeline";
import { formatDate } from "@/features/guide-community/format";
import type { PartnerApplication } from "@/features/partner-survey/types";
import {
  getPartnerApplication,
  getPartnerPipelineStatuses,
} from "@/lib/data/partner-applications";
import { PartnerStatusBadge } from "../PartnerStatusBadge";
import { savePartnerAdminFields } from "./actions";

function answerText(key: FieldKey, app: PartnerApplication): string {
  if (key === "industry") return industryLabel(app.industry);
  return (app[key] as string | null) ?? "";
}

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

/** Free-text answers: label above, full-width readable block. */
function LongRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <dt className="text-xs leading-relaxed text-navy/55">{label}</dt>
      <dd className="whitespace-pre-wrap break-words rounded-md bg-navy/[0.03] px-3 py-2.5 text-sm leading-[1.9]">{text}</dd>
    </div>
  );
}

const empty = <span className="text-navy/35">—</span>;

export default async function AdminPartnerApplicationDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/partner-applications/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [app, statuses] = await Promise.all([getPartnerApplication(id), getPartnerPipelineStatuses()]);
  if (!app) notFound();


  return (
    <div className="relative left-1/2 flex w-[min(1100px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-6">
      <Link
        href="/admin/partner-applications"
        className="w-fit rounded-md border border-navy/20 bg-white px-3 py-2 text-sm text-navy transition-colors hover:border-navy"
      >
        ← パートナー応募一覧に戻る
      </Link>

      {/* Summary */}
      <header className="flex flex-col gap-4 rounded-lg border border-navy/15 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-navy/55">受付番号 {app.receipt_no}</p>
            <h1 className="mt-1 break-words text-2xl font-semibold">{app.company_name}</h1>
            <p className="mt-1 text-xs text-navy/55">
              {formatDate(app.created_at, true)} 応募 ・ {industryLabel(app.industry)} ・ {app.area}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <PartnerStatusBadge status={app.pipeline_status} statuses={statuses} />
            <Stars rating={app.internal_rating} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-md bg-navy/5 px-3 py-1.5">担当：{app.contact_name}</span>
          <a href={`mailto:${app.email}`} className="break-all rounded-md border border-navy/15 px-3 py-1.5 hover:border-navy/40">
            ✉ {app.email}
          </a>
          <a href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} className="rounded-md border border-navy/15 px-3 py-1.5 hover:border-navy/40">
            ☎ {app.phone}
          </a>
          {app.website_url ? (
            <a
              href={app.website_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="max-w-full truncate rounded-md border border-navy/15 px-3 py-1.5 hover:border-navy/40"
            >
              🔗 {app.website_url}
            </a>
          ) : null}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Internal Management — first on phones, right column on desktop */}
        <aside className="lg:sticky lg:top-6 lg:order-2">
          <form
            action={savePartnerAdminFields.bind(null, app.id)}
            className="overflow-hidden rounded-lg border-2 border-navy bg-white"
          >
            <div className="bg-navy px-4 py-3 text-white">
              <p className="text-sm font-semibold tracking-wide">Internal Management</p>
              <p className="text-[11px] text-white/70">管理者のみ・回答者には表示されません</p>
            </div>
            <div className="flex flex-col gap-5 p-4">
              {saved ? (
                <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  ✓ 保存しました
                </p>
              ) : null}
              <label className="flex flex-col gap-1.5 text-xs font-medium text-navy/60">
                ステータス
                <select
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
                  placeholder="連絡履歴、商談メモ、条件交渉の状況など"
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

        {/* Survey answers, in form order */}
        <div className="flex flex-col gap-4 lg:order-1">
          {STEPS.map((step) => (
            <Group key={step.id} title={step.title}>
              {step.fields.map((key) => {
                const def = FIELDS[key];
                const label = `Q${QUESTION_NUMBERS[key]}. ${def.label}`;
                const text = answerText(key, app);
                if (def.kind === "textarea" && text) return <LongRow key={key} label={label} text={text} />;
                return (
                  <Row key={key} label={label}>
                    {text || (def.required ? empty : <span className="text-navy/35">（未回答）</span>)}
                  </Row>
                );
              })}
            </Group>
          ))}
          <Group title="受付情報">
            <Row label="受付番号">{app.receipt_no}</Row>
            <Row label="応募日時">{formatDate(app.created_at, true)}</Row>
            <Row label="情報の取り扱い">同意済み（{formatDate(app.privacy_consented_at, true)}）</Row>
            <Row label="回答元">{app.source === "hp" ? "HP（/partner/apply）" : app.source}</Row>
          </Group>
        </div>
      </div>
    </div>
  );
}
