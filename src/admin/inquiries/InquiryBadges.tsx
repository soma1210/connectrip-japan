import { KIND_LABEL, STATUS_LABEL, STATUS_TONE, isInquiryStatus, type InquiryKind } from "@/lib/inquiries/status";

const PILL = "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset";

export function InquiryStatusBadge({ value }: { value: string }) {
  if (!isInquiryStatus(value)) return <span className={`${PILL} bg-slate-100 text-slate-700 ring-slate-200`}>{value}</span>;
  return <span className={`${PILL} ${STATUS_TONE[value]}`}>{STATUS_LABEL[value]}</span>;
}

export function KindBadge({ value }: { value: InquiryKind }) {
  const tone = value === "booking_request" ? "bg-navy text-white ring-navy" : "bg-white text-navy ring-slate-300";
  return <span className={`${PILL} ${tone}`}>{KIND_LABEL[value] ?? value}</span>;
}

const EMAIL: Record<string, { label: string; tone: string }> = {
  sent: { label: "通知済み", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  pending: { label: "送信待ち", tone: "bg-amber-50 text-amber-900 ring-amber-200" },
  sending: { label: "送信中", tone: "bg-amber-50 text-amber-900 ring-amber-200" },
  failed: { label: "通知失敗", tone: "bg-red-50 text-red-800 ring-red-200" },
};

export function EmailBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-slate-400">—</span>;
  const e = EMAIL[value] ?? { label: value, tone: "bg-slate-100 text-slate-700 ring-slate-200" };
  return <span className={`${PILL} ${e.tone}`}>{e.label}</span>;
}

/** "2026/11/16 14:03" in Japan time. */
export function formatJst(at: Date, withSeconds = false): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
  }).format(at);
}
