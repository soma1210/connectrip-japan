const TONE: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-950 ring-amber-200",
  PENDING_CONFIRMATION: "bg-sky-50 text-sky-950 ring-sky-200",
  CONFIRMED: "bg-emerald-50 text-emerald-950 ring-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 ring-slate-200",
  EXPIRED: "bg-stone-100 text-stone-600 ring-stone-200",
  pending: "bg-amber-50 text-amber-950 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-950 ring-emerald-200",
  failed: "bg-red-50 text-red-900 ring-red-200",
  refunded: "bg-violet-50 text-violet-950 ring-violet-200",
  NEW: "bg-sky-50 text-sky-950 ring-sky-200",
  IN_PROGRESS: "bg-amber-50 text-amber-950 ring-amber-200",
  PROPOSAL_SENT: "bg-indigo-50 text-indigo-950 ring-indigo-200",
  ACCEPTED: "bg-emerald-50 text-emerald-950 ring-emerald-200",
  CONVERTED: "bg-teal-50 text-teal-950 ring-teal-200",
  NOT_SUBMITTED: "bg-amber-50 text-amber-950 ring-amber-200",
  SUBMITTED: "bg-sky-50 text-sky-950 ring-sky-200",
  NOT_STARTED: "bg-slate-100 text-slate-600 ring-slate-200",
  PLANNING: "bg-amber-50 text-amber-950 ring-amber-200",
  PROPOSED: "bg-indigo-50 text-indigo-950 ring-indigo-200",
  FINALIZED: "bg-emerald-50 text-emerald-950 ring-emerald-200",
};

export function StatusPill({ value }: { value: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONE[value] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {value}
    </span>
  );
}
