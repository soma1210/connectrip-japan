// Partner pipeline status pill. Statuses come from the database, so colors go
// by position in the pipeline (early → late), except the two side exits
// 保留 / 見送り, which are muted wherever they sit in the list.

const TONES = [
  "bg-gold/15 text-navy ring-gold/50",
  "bg-sky-50 text-sky-900 ring-sky-200",
  "bg-violet-50 text-violet-900 ring-violet-200",
  "bg-indigo-50 text-indigo-900 ring-indigo-200",
  "bg-blue-50 text-blue-900 ring-blue-200",
  "bg-teal-50 text-teal-900 ring-teal-200",
  "bg-emerald-50 text-emerald-900 ring-emerald-200",
  "bg-emerald-600 text-white ring-emerald-600",
];

const BY_NAME: Record<string, string> = {
  保留: "bg-amber-50 text-amber-900 ring-amber-200",
  見送り: "bg-navy/5 text-navy/50 ring-navy/15",
};

export function PartnerStatusBadge({ status, statuses }: { status: string; statuses: string[] }) {
  const ordered = statuses.filter((name) => !BY_NAME[name]);
  const index = Math.max(0, ordered.indexOf(status));
  const tone = BY_NAME[status] ?? TONES[Math.min(index, TONES.length - 1)];
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {status}
    </span>
  );
}
