import type { ReactNode } from "react";
import Link from "next/link";
import { formatDuration, formatGuests, formatIsoDate, formatJpy, formatTimestamp } from "@/admin/format";
import { interestLabel, selfReportedLabel, type AdminBookingDetail } from "@/admin/customers/readModel";
import { StatusPill } from "./StatusPill";

export function BookingDetailView({ booking }: { booking: AdminBookingDetail }) {
  const { overview, customer } = booking;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/admin/bookings" className="text-sm text-slate-500 hover:text-navy">
          Bookings
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Booking</p>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{overview.bookingId}</h1>
          <p className="text-sm text-slate-600">{overview.planName}</p>
        </div>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          PROTOTYPE / PENDING HUMAN VISUAL REVIEW. Read only. No confirm, cancel, refund, or assign actions.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Booking overview">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Info label="Booking ID" value={overview.bookingId} mono />
            <Info label="Service" value="Private Guide" />
            <Info label="Plan" value={overview.planName} />
            <Info label="Booking date" value={formatIsoDate(overview.bookingDate)} />
            <Info label="Start time" value={`${overview.startTime} JST`} />
            <Info label="Duration" value={formatDuration(overview.durationMinutes)} />
            <Info label="Adults" value={String(overview.adults)} />
            <Info label="Children" value={String(overview.children)} />
            <Info label="Guests" value={formatGuests(overview.adults, overview.children)} />
            <Info label="Total" value={`${formatJpy(overview.totalJpy)} ${overview.currency}`} />
            <div>
              <dt className="text-xs text-slate-500">Booking status</dt>
              <dd className="mt-1">
                <StatusPill value={overview.bookingStatus} />
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="Customer">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Customer ID</dt>
              <dd className="font-mono text-xs">
                <Link href={`/admin/customers/${customer.customerId}`} className="text-navy underline-offset-2 hover:underline">
                  {customer.customerId}
                </Link>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Full name</dt>
              <dd className="text-sm">
                <Link href={`/admin/customers/${customer.customerId}`} className="text-navy underline-offset-2 hover:underline">
                  {customer.fullName}
                </Link>
              </dd>
            </div>
            <Info label="Email" value={customer.email} />
            <Info label="Country" value={`${customer.countryName} (${customer.countryCode})`} />
          </dl>
        </Section>
      </div>

      <Section title="Trip preferences">
        <p className="mb-3 text-xs text-slate-500">Collected with this booking. Not stored on the customer profile.</p>
        {booking.trip ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Info label="Arriving" value={formatIsoDate(booking.trip.arriving)} />
            <Info label="Leaving" value={formatIsoDate(booking.trip.leaving)} />
            <Info label="Interests" value={booking.trip.interests.map(interestLabel).join(", ")} />
            <Info label="Trip description" value={booking.trip.tripDescription ?? "—"} />
          </dl>
        ) : (
          <Empty>No trip preferences on this booking.</Empty>
        )}
      </Section>

      <Section title="Planner">
        {booking.planId ? (
          <p className="mb-2 text-sm">
            <Link href={`/admin/plans/${booking.planId}`} className="text-navy underline-offset-2 hover:underline">
              Open private day plan
            </Link>
          </p>
        ) : null}
        {booking.planner.submitted ? (
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium">Submitted</p>
            <p className="text-xs text-slate-500">{booking.planner.submittedAt ? formatTimestamp(booking.planner.submittedAt) : "No timestamp"}</p>
            <p className="text-xs text-slate-500">The prototype fixture records the submission only. It has no separate planner answers.</p>
          </div>
        ) : (
          <p className="text-sm">Not submitted</p>
        )}
      </Section>

      <Section title="Payment">
        {booking.payments.length === 0 ? (
          <Empty>No payments.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {booking.payments.map((payment) => (
              <li key={payment.paymentId} className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <dl className="grid gap-2 sm:grid-cols-3">
                  <Info label="Payment reference" value={payment.paymentId} mono />
                  <Info label="Amount" value={formatJpy(payment.amountJpy)} />
                  <Info label="Currency" value="JPY" />
                </dl>
                <StatusPill value={payment.paymentStatus} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Guide assignment">
        <p className="text-sm">{booking.guideNoted ? "Timeline noted" : "Unassigned"}</p>
        <p className="mt-1 text-xs text-slate-500">No assignment record. This line only reflects the existing timeline fixture.</p>
      </Section>

      <Section title="Acquisition">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Info label="Self-reported" value={booking.acquisition.selfReported ? selfReportedLabel(booking.acquisition.selfReported) : "—"} />
          <Info label="Measured" value={booking.acquisition.measured ?? "—"} />
        </dl>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-sm break-words ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}
