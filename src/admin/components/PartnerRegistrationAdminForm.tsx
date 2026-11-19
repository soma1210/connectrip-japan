"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { savePartnerRegistrationAdminFields, type SaveAdminFieldsState } from "@/admin/partner-registrations/actions";
import {
  ADMIN_LIMITS,
  NEXT_ACTION_SUGGESTIONS,
  PARTNER_STATUSES,
  PRIORITIES,
} from "@/features/partner-registration/admin";
import type { PartnerRegistration } from "@/features/partner-registration/types";
import { formatAnsweredAt } from "./PartnerRegistrationBadges";

const controlClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none";

/** ③ 管理者用情報. Only admins see or edit these fields. */
export function PartnerRegistrationAdminForm({ registration }: { registration: PartnerRegistration }) {
  const [state, action, pending] = useActionState<SaveAdminFieldsState, FormData>(
    savePartnerRegistrationAdminFields.bind(null, registration.id),
    null,
  );

  // Submitted by hand rather than <form action>: React resets a form after an
  // action, which would wipe the inputs when a save fails.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        ステータス
        <select name="status" defaultValue={registration.status} className={`${controlClass} h-10`}>
          {PARTNER_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-xs font-medium text-slate-600">優先度</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {[...PRIORITIES.map((priority) => ({ value: priority.value, label: priority.value })), { value: "", label: "未設定" }].map((option) => (
            <label
              key={option.value || "none"}
              className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white text-sm text-navy has-checked:border-navy has-checked:bg-navy has-checked:text-white"
            >
              <input type="radio" name="priority" value={option.value} defaultChecked={(registration.priority ?? "") === option.value} className="sr-only" />
              {option.label}
            </label>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">A：優先 / B：通常 / C：低</p>
      </fieldset>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        次回アクション
        <input
          name="next_action"
          defaultValue={registration.next_action ?? ""}
          list="partner-next-action-suggestions"
          maxLength={ADMIN_LIMITS.nextAction}
          placeholder="例：オンライン商談"
          className={`${controlClass} h-10`}
        />
        <datalist id="partner-next-action-suggestions">
          {NEXT_ACTION_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        次回対応日
        <input type="date" name="next_action_at" defaultValue={registration.next_action_at ?? ""} className={`${controlClass} h-10`} />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        内部メモ
        <textarea
          name="internal_notes"
          defaultValue={registration.internal_notes}
          rows={7}
          maxLength={ADMIN_LIMITS.internalNotes}
          placeholder="社内向けのメモ（事業者には表示されません）"
          className={`${controlClass} py-2 leading-relaxed`}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存する"}
        </button>
        {state && !pending ? (
          <p role="status" className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
      <p className="text-[11px] text-slate-500">最終更新 {formatAnsweredAt(registration.updated_at, true)}</p>
    </form>
  );
}
