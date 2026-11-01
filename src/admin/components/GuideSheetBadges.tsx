import { INTERVIEW_STATUSES, STATUSES, choiceOf } from "@/features/guide-sheet/config";
import type { GuideSheetData } from "@/features/guide-sheet/types";

const PILL = "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset";

export function SheetStatusBadge({ value }: { value: string }) {
  if (!value) return <span className="text-xs text-slate-400">—</span>;
  const status = choiceOf(STATUSES, value);
  return <span className={`${PILL} ${status.tone}`}>{status.label}</span>;
}

export function InterviewStatusBadge({ value }: { value: string }) {
  if (!value) return <span className="text-xs text-slate-400">—</span>;
  const status = choiceOf(INTERVIEW_STATUSES, value);
  return <span className={`${PILL} ${status.tone}`}>{status.label}</span>;
}

export function EvaluationBadge({ value }: { value: string }) {
  if (!value) return <span className="text-xs text-slate-400">未評価</span>;
  return <span className={`${PILL} bg-gold/15 text-navy ring-gold/50`}>{value}</span>;
}

/** Sample-data notice and read errors, shown above the list and the detail page. */
export function GuideSheetNotices({ data }: { data: Pick<GuideSheetData, "source" | "errors"> }) {
  return (
    <>
      {data.source === "sample" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          ローカル開発モード：Google Sheets の認証情報が未設定のため、架空のサンプルデータを表示しています。
        </p>
      ) : null}
      {data.errors.map((error) => (
        <p key={error} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ))}
    </>
  );
}
