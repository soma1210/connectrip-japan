// Pipeline status pill. Statuses come from the database, so colors are picked
// by position in the pipeline (early → late) rather than by name.

const TONES = [
  "bg-navy/5 text-navy/70 ring-navy/15",
  "bg-gold/15 text-navy ring-gold/50",
  "bg-sky-50 text-sky-900 ring-sky-200",
  "bg-violet-50 text-violet-900 ring-violet-200",
  "bg-indigo-50 text-indigo-900 ring-indigo-200",
  "bg-emerald-50 text-emerald-900 ring-emerald-200",
  "bg-emerald-600 text-white ring-emerald-600",
];

export function StatusBadge({ status, statuses }: { status: string; statuses: string[] }) {
  const index = Math.max(0, statuses.indexOf(status));
  const tone = TONES[Math.min(index, TONES.length - 1)];
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {status}
    </span>
  );
}
