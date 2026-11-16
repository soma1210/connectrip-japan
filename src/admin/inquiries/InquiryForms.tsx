"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { addInquiryNoteAction, changeInquiryStatusAction, resendInquiryEmailAction, type InquiryActionState } from "@/app/admin/(protected)/inquiries/actions";
import { NOTE_MAX, STATUS_LABEL, type InquiryStatus } from "@/lib/inquiries/status";

const control = "w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none";
const button = "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50";

function Message({ state }: { state: InquiryActionState }) {
  if (!state) return null;
  return (
    <p role="status" className={`rounded-md px-3 py-2 text-sm ${state.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800"}`}>
      {state.message}
    </p>
  );
}

/**
 * Status change. 'confirmed' asks for the reference number again (checked
 * on the server too): a booking is only confirmed by a deliberate action.
 */
export function InquiryStatusForm({ id, refNo, status, version, next }: { id: string; refNo: string; status: InquiryStatus; version: number; next: InquiryStatus[] }) {
  const [state, action, pending] = useActionState<InquiryActionState, FormData>(changeInquiryStatusAction.bind(null, id), null);
  const [to, setTo] = useState<InquiryStatus | "">("");
  const [typed, setTyped] = useState("");
  const confirming = to === "confirmed";
  const ready = to !== "" && (!confirming || typed.trim().toUpperCase() === refNo);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }

  if (next.length === 0) return <p className="text-sm text-slate-500">このステータスから変更できる先はありません。</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input type="hidden" name="version" value={version} />
      <p className="text-xs text-slate-500">
        現在：<span className="font-medium text-navy">{STATUS_LABEL[status]}</span>
      </p>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        変更後のステータス
        <select name="status" value={to} onChange={(e) => setTo(e.target.value as InquiryStatus | "")} className={`${control} h-10`} required>
          <option value="">選択してください</option>
          {next.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      {confirming ? (
        <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-medium">予約を確定します</p>
          <p className="text-xs leading-relaxed">
            確定はお客様との合意（日時・人数・料金）が済んでいる場合のみ行ってください。自動ではお客様にメールは送られません。確認のため受付番号
            <span className="mx-1 font-mono font-semibold">{refNo}</span>を入力してください。
          </p>
          <input name="confirm_ref" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" placeholder={refNo} className={`${control} h-10 font-mono`} aria-label="確認のための受付番号" />
        </div>
      ) : null}
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        変更理由・メモ（任意）
        <textarea name="note" rows={2} maxLength={NOTE_MAX} className={`${control} py-2`} />
      </label>
      <button type="submit" disabled={pending || !ready} className={`${button} ${confirming ? "bg-emerald-700 text-white hover:bg-emerald-800" : "bg-navy text-white hover:bg-navy/90"}`}>
        {pending ? "保存中…" : confirming ? "予約を確定する" : "ステータスを変更"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function InquiryNoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<InquiryActionState, FormData>(addInquiryNoteAction.bind(null, id), null);
  const ref = useRef<HTMLFormElement>(null);
  // Clear the text only after a successful save (a failed save keeps what was typed).
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form ref={ref} onSubmit={submit} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        社内メモ（お客様には表示されません）
        <textarea name="note" rows={3} maxLength={NOTE_MAX} required className={`${control} py-2`} />
      </label>
      <button type="submit" disabled={pending} className={`${button} self-start border border-navy text-navy hover:bg-navy hover:text-white`}>
        {pending ? "保存中…" : "メモを追加"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function ResendEmailButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState<InquiryActionState>(() => resendInquiryEmailAction(id), null);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" disabled={pending} onClick={() => startTransition(() => action())} className={`${button} border border-navy text-navy hover:bg-navy hover:text-white`}>
        {pending ? "送信中…" : "通知メールを再送"}
      </button>
      <Message state={state} />
    </div>
  );
}
