import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmailBadge, InquiryStatusBadge, KindBadge, formatJst } from "@/admin/inquiries/InquiryBadges";
import { InquiryNoteForm, InquiryStatusForm, ResendEmailButton } from "@/admin/inquiries/InquiryForms";
import { payloadRows, SERVICE_LABEL } from "@/admin/inquiries/payloadRows";
import { requireAdmin } from "@/lib/admin-auth";
import { getInquiry, isInquiryId, type InquiryDetail, type InquiryEvent } from "@/lib/inquiries/admin";
import { MAX_ATTEMPTS } from "@/lib/inquiries/outbox";
import { STATUS_LABEL, allowedNextStatuses, isInquiryStatus } from "@/lib/inquiries/status";
import { dbFromEnv } from "@/lib/pg";

export const metadata: Metadata = {
  title: "問い合わせ詳細 · Connectrip Admin",
  robots: { index: false, follow: false },
};

export default async function AdminInquiryDetailPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!isInquiryId(id)) notFound();
  const db = dbFromEnv();
  if (!db) {
    return <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">データベースが未接続です。</p>;
  }
  let inquiry: InquiryDetail | null;
  try {
    inquiry = await getInquiry(db, id);
  } catch {
    return <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">読み込めませんでした。時間をおいて再読み込みしてください。</p>;
  }
  if (!inquiry) notFound();
  const q = inquiry;
  const staffEmail = q.outbox.find((o) => o.channel === "staff_email");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/admin/inquiries" className="text-sm text-slate-500 hover:text-navy">
          ← 問い合わせ・予約リクエスト
        </Link>
        <div className="min-w-0">
          <p className="font-mono text-xs text-slate-500">{q.ref}</p>
          <h1 className="break-words text-2xl font-semibold tracking-tight">{q.customerName}</h1>
          <p className="mt-1 text-sm text-slate-600">{formatJst(q.createdAt, true)} 受付</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <KindBadge value={q.kind} />
            <InquiryStatusBadge value={q.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <a href={`mailto:${q.customerEmail}?subject=${encodeURIComponent(`Connectrip Japan (${q.ref})`)}`} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:border-navy">
            メールで返信
          </a>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section title="顧客情報">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Info label="氏名">{q.customerName}</Info>
              <Info label="メールアドレス">
                <a href={`mailto:${q.customerEmail}`} className="break-all text-navy underline decoration-navy/30 underline-offset-2">
                  {q.customerEmail}
                </a>
              </Info>
              <Info label="希望サービス">{SERVICE_LABEL[q.service] ?? q.service}</Info>
              <Info label="予約希望日">{q.preferredDate ?? <Empty />}</Info>
              <Info label="参加人数">
                {q.adults == null && q.children == null ? <Empty /> : `大人 ${q.adults ?? 0} 名 / 子ども ${q.children ?? 0} 名`}
              </Info>
            </dl>
          </Section>

          <Section title="送信内容">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {payloadRows(q.kind, q.payload).map((row) => (
                <Info key={row.label} label={row.label} wide={(row.value?.length ?? 0) > 60}>
                  {row.value ? <span className="whitespace-pre-wrap break-words">{row.value}</span> : <Empty />}
                </Info>
              ))}
            </dl>
          </Section>

          <Section title="対応履歴">
            <ol className="flex flex-col gap-3">
              {q.events.map((e) => (
                <li key={e.id} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-xs text-slate-500">
                    {formatJst(e.createdAt, true)} ・ {actorLabel(e.actor)}
                  </p>
                  <p className="text-sm font-medium">{eventLabel(e)}</p>
                  {e.note && e.type !== "notification_sent" && e.type !== "notification_failed" ? <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{e.note}</p> : null}
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <aside className="flex flex-col gap-4">
          <Section title="ステータス変更">
            {isInquiryStatus(q.status) ? (
              <InquiryStatusForm key={q.version} id={q.id} refNo={q.ref} status={q.status} version={q.version} next={allowedNextStatuses(q.kind, q.status)} />
            ) : null}
          </Section>

          <Section title="通知メール（contact@ 宛）">
            {staffEmail ? (
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <EmailBadge value={staffEmail.status} />
                  <span className="text-xs text-slate-500">試行 {staffEmail.attempts} 回</span>
                </div>
                {staffEmail.sentAt ? <p className="text-xs text-slate-600">送信：{formatJst(staffEmail.sentAt, true)}</p> : null}
                {staffEmail.lastError ? <p className="text-xs text-red-700">最後のエラー：{ERROR_LABEL[staffEmail.lastError] ?? staffEmail.lastError}</p> : null}
                {staffEmail.status !== "sent" && staffEmail.nextAttemptAt ? <p className="text-xs text-slate-600">次回の自動再送：{formatJst(staffEmail.nextAttemptAt)}</p> : null}
                {staffEmail.status === "failed" && !staffEmail.nextAttemptAt ? <p className="text-xs text-slate-600">自動再送は上限（{MAX_ATTEMPTS} 回）に達しました。</p> : null}
                {staffEmail.status === "pending" || staffEmail.status === "failed" ? <ResendEmailButton id={q.id} /> : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">記録がありません。</p>
            )}
          </Section>

          <Section title="社内メモ">
            <InquiryNoteForm id={q.id} />
          </Section>
        </aside>
      </div>
    </div>
  );
}

const ERROR_LABEL: Record<string, string> = {
  not_configured: "メール送信設定（SMTP）が未設定",
  send_failed: "メール送信サービスへの送信に失敗",
  inquiry_unreadable: "保存内容からメールを作成できません",
};

function eventLabel(e: InquiryEvent): string {
  const s = (v: string | null) => (v && isInquiryStatus(v) ? STATUS_LABEL[v] : v ?? "—");
  switch (e.type) {
    case "received":
      return "フォームから受付";
    case "status_changed":
      return `ステータス変更：${s(e.fromStatus)} → ${s(e.toStatus)}`;
    case "note_added":
      return "社内メモ";
    case "notification_sent":
      return "通知メールを送信";
    case "notification_failed":
      return `通知メールの送信に失敗（${e.note ?? ""}）`;
    default:
      return e.type;
  }
}

function actorLabel(actor: string): string {
  if (actor === "website") return "サイトのフォーム";
  if (actor === "system") return "システム";
  if (actor === "system:retry-job") return "自動再送ジョブ";
  if (actor.startsWith("admin:")) return `管理者（セッション ${actor.slice(6)}）`;
  return actor;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-navy">{children}</dd>
    </div>
  );
}

function Empty() {
  return <span className="text-slate-400">—</span>;
}
