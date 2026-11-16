/**
 * Inquiry statuses for the admin screens (Phase 2, 2026-11-16). Client-safe:
 * no server imports. The database CHECK constraint holds the same list.
 *
 * A booking request is never confirmed automatically: 'confirmed' is only
 * reached by an admin action that also re-types the reference number
 * (server-checked), and never for a plain contact inquiry.
 */
export const INQUIRY_STATUSES = ["received", "in_review", "proposed", "confirmed", "declined", "cancelled"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export type InquiryKind = "contact" | "booking_request";

export const STATUS_LABEL: Record<InquiryStatus, string> = {
  received: "新規受付",
  in_review: "対応中",
  proposed: "提案済み",
  confirmed: "予約確定",
  declined: "お断り",
  cancelled: "キャンセル",
};

export const STATUS_TONE: Record<InquiryStatus, string> = {
  received: "bg-sky-50 text-sky-800 ring-sky-200",
  in_review: "bg-amber-50 text-amber-900 ring-amber-200",
  proposed: "bg-violet-50 text-violet-800 ring-violet-200",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  declined: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-200",
};

export const KIND_LABEL: Record<InquiryKind, string> = { contact: "問い合わせ", booking_request: "予約リクエスト" };

/** Where each status may go next. Declined / cancelled can be reopened; confirmed can only be cancelled. */
const NEXT: Record<InquiryStatus, InquiryStatus[]> = {
  received: ["in_review", "proposed", "confirmed", "declined", "cancelled"],
  in_review: ["received", "proposed", "confirmed", "declined", "cancelled"],
  proposed: ["in_review", "confirmed", "declined", "cancelled"],
  confirmed: ["cancelled"],
  declined: ["in_review"],
  cancelled: ["in_review"],
};

export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return typeof value === "string" && (INQUIRY_STATUSES as readonly string[]).includes(value);
}

export function allowedNextStatuses(kind: InquiryKind, from: InquiryStatus): InquiryStatus[] {
  // A question is not a booking: it can never become 'confirmed'.
  return NEXT[from].filter((to) => !(kind === "contact" && to === "confirmed"));
}

export const NOTE_MAX = 5000;
