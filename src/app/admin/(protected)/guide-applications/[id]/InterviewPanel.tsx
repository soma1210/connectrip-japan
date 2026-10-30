"use client";

import "@/components/interview/interview-ui.css";
import { useId, useState, useTransition } from "react";
import { formatDate } from "@/features/guide-community/format";
import { formatInterviewRange } from "@/features/guide-interviews/format";
import { INTERVIEW_STATUS_LABELS, type GuideInterview } from "@/features/guide-interviews/types";
import {
  approveAction,
  cancelAction,
  completeAction,
  rejectAction,
  requestAnotherTimeAction,
  resendConfirmationAction,
  sendInvitationAction,
  type InterviewActionState,
} from "./interview-actions";

const buttonClass = "min-h-11 rounded-lg px-3 py-2 text-sm font-medium leading-relaxed disabled:opacity-50";
const primary = `${buttonClass} bg-navy text-white hover:bg-navy/90`;
const secondary = `${buttonClass} border border-navy/20 bg-white text-navy hover:border-navy/50`;
const danger = `${buttonClass} border border-red/40 bg-white text-red hover:bg-red/5`;

const STATUS_TONES: Record<GuideInterview["status"], string> = {
  INVITED: "bg-navy/5 text-navy/70 ring-navy/15",
  PENDING_APPROVAL: "bg-gold/15 text-navy ring-gold/50",
  APPROVING: "bg-gold/15 text-navy ring-gold/50",
  CONFIRMED: "bg-emerald-50 text-emerald-900 ring-emerald-300",
  REJECTED: "bg-red/5 text-red ring-red/30",
  CANCELLED: "bg-navy/5 text-navy/70 ring-navy/10",
  COMPLETED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
};

function InterviewBadge({ status }: { status: GuideInterview["status"] }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_TONES[status]}`}>
      {INTERVIEW_STATUS_LABELS[status]}
    </span>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const inputId = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-xs text-navy/75">{label}</label>
      <div className="flex gap-1.5">
        <input id={inputId} aria-describedby={copyError ? `${inputId}-feedback` : undefined} readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="interview-copy h-11 min-w-0 flex-1 rounded border border-navy/15 bg-navy/[0.03] px-2 text-xs" />
        <button
          type="button"
          className="min-h-11 shrink-0 rounded-lg border border-navy/20 px-2 text-xs hover:border-navy/50"
          onClick={() => {
            setCopyError(false);
            if (!navigator.clipboard) { setCopyError(true); return; }
            navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2500);
            }, () => setCopyError(true));
          }}
        >
          <span aria-live="polite">{copied ? "コピー済み" : "コピー"}</span>
        </button>
      </div>
      {copyError ? <p id={`${inputId}-feedback`} role="status" className="text-xs text-red">コピーできませんでした。URLを選択して手動でコピーしてください。</p> : null}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 text-sm">
      <span className="text-xs leading-5 text-navy/75">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export function InterviewPanel({
  applicationId,
  interviews,
  calendarConfigured,
  mailConfigured,
}: {
  applicationId: string;
  /** Newest first. */
  interviews: GuideInterview[];
  calendarConfigured: boolean;
  mailConfigured: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<InterviewActionState | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [notifyOnReject, setNotifyOnReject] = useState(true);

  const current = interviews[0];
  const history = interviews.slice(1);
  const open = current && ["INVITED", "PENDING_APPROVAL", "APPROVING", "CONFIRMED"].includes(current.status);

  function run(action: () => Promise<InterviewActionState>, confirmMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    startTransition(async () => {
      setResult(await action());
      setRejecting(false);
    });
  }

  return (
    <section className="interview-ui interview-admin overflow-hidden rounded-xl border border-navy/20 bg-white shadow-sm">
      <div className="bg-navy px-4 py-3 text-white">
        <h2 className="text-base font-semibold tracking-wide">面談予約</h2>
        <p className="text-[11px] text-white/70">管理者のみ・応募者には表示されません</p>
      </div>

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        {!calendarConfigured ? (
          <p className="rounded-md border border-gold/60 bg-gold/10 px-3 py-2 text-xs">
            Google Calendar が未接続です。空き枠の表示と承認はできません（GOOGLE_* 環境変数を設定）。
          </p>
        ) : null}
        {!mailConfigured ? (
          <p className="rounded-md border border-gold/60 bg-gold/10 px-3 py-2 text-xs">
            SMTP 未設定：メールは送信されません。リンクや Meet URL をコピーして応募者へ送ってください。
          </p>
        ) : null}

        {result ? (
          <div
            role="status"
            className={`flex flex-col gap-2 rounded-md px-3 py-2 text-xs ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red/5 text-red"}`}
          >
            <p>{result.message}</p>
            {result.link ? <CopyField label="予約リンク（この画面でしか表示されません）" value={result.link} /> : null}
          </div>
        ) : null}

        {current ? (
          <div className="flex flex-col gap-3 rounded-lg bg-cream/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-navy/75">面談ステータス</span>
              <InterviewBadge status={current.status} />
            </div>

            {current.requested_start_at && current.requested_end_at ? (
              <Detail label={current.status === "CONFIRMED" || current.status === "COMPLETED" ? "面談日時" : "希望日時"}>
                <span className="font-semibold">{formatInterviewRange(current.requested_start_at, current.requested_end_at)}</span>
              </Detail>
            ) : null}
            {current.requested_at ? <Detail label="申請日時">{formatDate(current.requested_at, true)}</Detail> : null}
            {current.status === "INVITED" ? (
              <>
                <Detail label="案内日時">{formatDate(current.created_at, true)}</Detail>
                <Detail label="リンク期限">{formatDate(current.token_expires_at, true)}</Detail>
                <Detail label="案内メール">{current.invitation_email_sent_at ? "送信済み" : "未送信"}</Detail>
              </>
            ) : null}
            {current.approved_at ? <Detail label="承認日時">{formatDate(current.approved_at, true)}</Detail> : null}
            {current.status_reason && ["REJECTED", "CANCELLED"].includes(current.status) ? (
              <Detail label="理由">{current.status_reason}</Detail>
            ) : null}

            {current.status === "CONFIRMED" && current.meet_url ? (
              <>
                <Detail label="確定メール">
                  {current.confirmation_email_sent_at ? `送信済み（${formatDate(current.confirmation_email_sent_at, true)}）` : "未送信"}
                </Detail>
                <a href={current.meet_url} target="_blank" rel="noopener noreferrer" className={`${primary} flex items-center justify-center`}>
                  Google Meet を開く ↗
                </a>
                <CopyField label="Google Meet URL" value={current.meet_url} />
              </>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-navy/75">面談の案内はまだ送っていません。</p>
        )}

        {pending ? <p role="status" className="text-sm text-navy/75">処理中です。しばらくお待ちください…</p> : null}
        {/* Actions */}
        <div className="flex flex-col gap-2">
          {current?.status === "PENDING_APPROVAL" || current?.status === "APPROVING" ? (
            <>
              <button
                type="button"
                disabled={pending || !calendarConfigured}
                className={primary}
                onClick={() =>
                  run(
                    () => approveAction(applicationId, current.id),
                    "この面談を承認します。Google Calendar に登録し、Meet URL を発行して応募者へ確定メールを送ります。よろしいですか？",
                  )
                }
              >
                {pending ? "処理中…" : current.status === "APPROVING" ? "承認を再試行" : "面談を承認"}
              </button>
              {current.status === "PENDING_APPROVAL" ? (
                rejecting ? (
                  <div className="flex flex-col gap-2 rounded-md border border-navy/15 p-3">
                    <label className="flex flex-col gap-1 text-xs text-navy/75">
                      却下理由（社内用・任意）
                      <textarea
                        rows={2}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="rounded-md border border-navy/20 px-2 py-1.5 text-sm text-navy"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={notifyOnReject} onChange={(e) => setNotifyOnReject(e.target.checked)} />
                      応募者へ通知メールを送る
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        className={`${danger} flex-1`}
                        onClick={() => run(() => rejectAction(applicationId, current.id, rejectReason, notifyOnReject))}
                      >
                        却下する
                      </button>
                      <button type="button" disabled={pending} className={secondary} onClick={() => setRejecting(false)}>
                        戻る
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                    <button type="button" disabled={pending} className={danger} onClick={() => setRejecting(true)}>
                      却下
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className={secondary}
                      onClick={() =>
                        run(
                          () => requestAnotherTimeAction(applicationId, current.id),
                          "この申請を取り消し、新しい予約リンクを応募者へ送ります。よろしいですか？",
                        )
                      }
                    >
                      別の時間を依頼
                    </button>
                  </div>
                )
              ) : null}
            </>
          ) : null}

          {current?.status === "CONFIRMED" ? (
            <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              <button type="button" disabled={pending} className={secondary} onClick={() => run(() => resendConfirmationAction(applicationId, current.id))}>
                確定メールを再送
              </button>
              <button
                type="button"
                disabled={pending || new Date(current.requested_end_at!) > new Date()}
                className={secondary}
                title="面談終了後に押せます"
                onClick={() => run(() => completeAction(applicationId, current.id))}
              >
                面談済みにする
              </button>
              <button
                type="button"
                disabled={pending}
                className={`${danger} min-[400px]:col-span-2`}
                onClick={() =>
                  run(
                    () => cancelAction(applicationId, current.id),
                    "確定済みの面談をキャンセルし、Google Calendar の予定を削除します。応募者への連絡は別途必要です。よろしいですか？",
                  )
                }
              >
                面談をキャンセル
              </button>
            </div>
          ) : null}

          {current?.status === "INVITED" ? (
            <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              <button
                type="button"
                disabled={pending}
                className={secondary}
                onClick={() => run(() => sendInvitationAction(applicationId), "新しいリンクを発行して送ります。今のリンクは使えなくなります。よろしいですか？")}
              >
                リンクを再発行
              </button>
              <button type="button" disabled={pending} className={danger} onClick={() => run(() => cancelAction(applicationId, current.id), "面談の案内を取り消します。よろしいですか？")}>
                案内を取り消す
              </button>
            </div>
          ) : null}

          {!open ? (
            <button
              type="button"
              disabled={pending}
              className={primary}
              onClick={() => run(() => sendInvitationAction(applicationId), "応募者へ面談予約リンクを送ります。よろしいですか？")}
            >
              {pending ? "処理中…" : "面談案内を送る"}
            </button>
          ) : null}
        </div>

        {history.length > 0 ? (
          <details className="text-xs">
            <summary className="cursor-pointer text-navy/75">過去の面談・案内（{history.length}件）</summary>
            <ul className="mt-2 flex flex-col divide-y divide-navy/10">
              {history.map((interview) => (
                <li key={interview.id} className="flex flex-col gap-1 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-navy/75">{formatDate(interview.created_at, true)}</span>
                    <InterviewBadge status={interview.status} />
                  </div>
                  {interview.requested_start_at && interview.requested_end_at ? (
                    <span>{formatInterviewRange(interview.requested_start_at, interview.requested_end_at)}</span>
                  ) : null}
                  {interview.status_reason ? <span className="text-navy/75">{interview.status_reason}</span> : null}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  );
}
