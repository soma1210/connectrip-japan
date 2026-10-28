import type { ReactNode } from "react";
import { PARTNER_STATUSES, PRIORITIES, dueState } from "@/features/partner-registration/admin";

const PILL = "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset";

export function PartnerStatusBadge({ value }: { value: string }) {
  const status = PARTNER_STATUSES.find((item) => item.value === value);
  return <span className={`${PILL} ${status?.tone ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>{status?.label ?? value}</span>;
}

export function PriorityBadge({ value }: { value: string | null }) {
  const priority = PRIORITIES.find((item) => item.value === value);
  if (!priority) return <span className="text-xs text-slate-400">未設定</span>;
  return <span className={`${PILL} ${priority.tone}`}>{priority.label}</span>;
}

/** Multi-select answers as small chips. With `max`, the rest collapse into "+N". */
export function ChoiceChips({ labels, max }: { labels: string[]; max?: number }) {
  if (labels.length === 0) return <span className="text-slate-400">—</span>;
  const shown = max === undefined ? labels : labels.slice(0, max);
  const hidden = labels.length - shown.length;
  return (
    <span className="flex flex-wrap gap-1" title={hidden > 0 ? labels.join(" / ") : undefined}>
      {shown.map((label) => (
        <span key={label} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
          {label}
        </span>
      ))}
      {hidden > 0 ? <span className="px-1 py-0.5 text-xs font-medium text-slate-500">+{hidden}</span> : null}
    </span>
  );
}

const DUE_TONE = {
  overdue: "text-red-700 font-semibold",
  soon: "text-amber-800 font-semibold",
  later: "text-slate-700",
} as const;

const DUE_NOTE = { overdue: "期限切れ", soon: "まもなく", later: null } as const;

/** Next action date (YYYY-MM-DD), colored by how close it is to today. */
export function NextActionDate({ date, today, children }: { date: string | null; today: string; children?: ReactNode }) {
  const state = dueState(date, today);
  if (!date || !state) return <span className="text-xs text-slate-400">—</span>;
  const note = DUE_NOTE[state];
  return (
    <span className={`text-xs ${DUE_TONE[state]}`}>
      {formatShortDate(date)}
      {note ? <span className="ml-1 rounded bg-current/10 px-1 text-[10px]">{note}</span> : null}
      {children}
    </span>
  );
}

/** 2026/11/3 (火) */
export function formatShortDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = "日月火水木金土"[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}/${month}/${day} (${weekday})`;
}

/** 2026/10/28 14:05 in Japan time. */
export function formatAnsweredAt(iso: string, withTime = false) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}
