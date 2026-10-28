import type { ReactNode } from "react";
import Link from "next/link";
import {
  BUSINESS_CATEGORIES,
  CURRENT_CHALLENGES,
  CUSTOMER_TYPES,
  INBOUND_EXPERIENCE,
  INTERESTED_COLLABORATIONS,
  OTHER,
  optionLabel,
  optionLabels,
} from "@/features/partner-registration/config";
import type { PartnerRegistration } from "@/features/partner-registration/types";
import { PartnerRegistrationAdminForm } from "./PartnerRegistrationAdminForm";
import { ChoiceChips, NextActionDate, PartnerStatusBadge, PriorityBadge, formatAnsweredAt } from "./PartnerRegistrationBadges";

export function PartnerRegistrationDetailView({ registration: row, today }: { registration: PartnerRegistration; today: string }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/admin/partner-registrations" className="text-sm text-slate-500 hover:text-navy">
          ← 事業者アンケート回答
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Partner survey</p>
            <h1 className="break-words text-2xl font-semibold tracking-tight">{row.company_name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {row.contact_name} ・ {formatAnsweredAt(row.created_at, true)} 回答
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PartnerStatusBadge value={row.status} />
              <PriorityBadge value={row.priority} />
              {row.next_action_at ? (
                <NextActionDate date={row.next_action_at} today={today}>
                  {row.next_action ? <span className="ml-1 font-normal">{row.next_action}</span> : null}
                </NextActionDate>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href={`mailto:${row.email}`} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:border-navy">
              メールを送る
            </a>
            {row.phone ? (
              <a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:border-navy">
                電話する
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section title="① 基本情報">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Info label="会社名 / 店舗名">{row.company_name}</Info>
              <Info label="担当者名">{row.contact_name}</Info>
              <Info label="事業カテゴリ">
                {optionLabel(BUSINESS_CATEGORIES, row.business_category)}
                <OtherText value={row.business_category === OTHER ? row.business_category_other : null} />
              </Info>
              <Info label="所在地 / 対応エリア">{row.area}</Info>
              <Info label="Webサイト">{row.website ? <ExternalLink value={row.website} /> : <Empty />}</Info>
              <Info label="SNSアカウント">
                {row.social_accounts.length ? (
                  <ul className="flex flex-col gap-0.5">
                    {row.social_accounts.map((account) => (
                      <li key={account}>
                        <ExternalLink value={account} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty />
                )}
              </Info>
              <Info label="メールアドレス">
                <a href={`mailto:${row.email}`} className="text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy">
                  {row.email}
                </a>
              </Info>
              <Info label="電話番号">{row.phone ?? <Empty />}</Info>
            </dl>
          </Section>

          <Section title="② アンケート回答">
            <dl className="flex flex-col gap-5">
              <Info label="主な顧客層">
                <ChoiceChips labels={optionLabels(CUSTOMER_TYPES, row.customer_types)} />
              </Info>
              <Info label="外国人受入実績">{optionLabel(INBOUND_EXPERIENCE, row.inbound_experience)}</Info>
              <Info label="自社 / 店舗の強み・おすすめポイント">
                <Prose text={row.strengths} />
              </Info>
              <Info label="現在感じている課題">
                <ChoiceChips labels={optionLabels(CURRENT_CHALLENGES, row.current_challenges)} />
                <OtherText value={row.current_challenges.includes(OTHER) ? row.current_challenges_other : null} />
              </Info>
              <Info label="興味のある連携内容">
                <ChoiceChips labels={optionLabels(INTERESTED_COLLABORATIONS, row.interested_collaborations)} />
                <OtherText value={row.interested_collaborations.includes(OTHER) ? row.interested_collaborations_other : null} />
              </Info>
              <Info label="自由記入">{row.additional_notes ? <Prose text={row.additional_notes} /> : <Empty />}</Info>
            </dl>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-6">
          <Section title="③ 管理者用情報">
            <PartnerRegistrationAdminForm registration={row} />
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-4 border-b border-slate-100 pb-2 text-sm font-semibold text-navy">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-xs text-slate-500">{label}</dt>
      <dd className="break-words text-sm">{children}</dd>
    </div>
  );
}

function Empty() {
  return <span className="text-slate-400">—</span>;
}

/** Free text exactly as answered, line breaks kept. */
function Prose({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap rounded bg-slate-50 px-3 py-2 leading-relaxed">{text}</p>;
}

function OtherText({ value }: { value: string | null }) {
  if (!value) return null;
  return <p className="mt-1.5 text-sm text-slate-700">その他：{value}</p>;
}

/**
 * Website / SNS answer. Only http(s) URLs become links. "www.example.com" gets
 * https:// added; an account name like "@connectrip" stays plain text.
 */
function ExternalLink({ value }: { value: string }) {
  const href = toHttpUrl(value);
  if (!href) return <span>{value}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-navy underline decoration-navy/30 underline-offset-2 hover:decoration-navy">
      {value} ↗
    </a>
  );
}

function toHttpUrl(value: string) {
  const candidate = /^https?:\/\//i.test(value) ? value : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value) ? `https://${value}` : null;
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
