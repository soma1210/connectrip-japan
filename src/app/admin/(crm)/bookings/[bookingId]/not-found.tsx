import Link from "next/link";

export default function BookingNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Booking not found</h1>
      <p className="text-sm text-slate-600">That booking ID is not in the prototype data.</p>
      <Link href="/admin/bookings" className="text-sm text-navy underline-offset-2 hover:underline">
        Back to bookings
      </Link>
    </div>
  );
}
