export function BookingLoading() {
  return (
    <div role="status" className="rounded-xl border border-navy/15 bg-white p-6 sm:p-8">
      <p className="flex items-center gap-3 text-sm text-navy/80">
        <span aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-navy/15 border-t-navy" />
        Checking available times...
      </p>
      <div aria-hidden="true" className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => <div key={i} className="h-16 rounded-lg bg-navy/5" />)}
      </div>
    </div>
  );
}
