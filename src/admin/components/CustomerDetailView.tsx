import type { ReactNode } from "react";
import Link from "next/link";
import { formatGuests, formatIsoDate, formatJpy, formatTimestamp } from "@/admin/format";
import {
  interestLabel,
  selfReportedLabel,
  type AdminCustomerDetail,
} from "@/admin/customers/readModel";
import { StatusPill } from "./StatusPill";

const JUMPS = [
  ["profile", "Profile"],
  ["acquisition", "Acquisition"],
  ["bookings", "Bookings"],
  ["plans", "Plans"],
  ["inquiries", "Inquiries"],
  ["trips", "Trips"],
  ["payments", "Payments"],
  ["timeline", "Timeline"],
] as const;

export function CustomerDetailView({ customer }: { customer: AdminCustomerDetail }) {
  const { profile } = customer;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/admin/customers" className="text-sm text-slate-500 hover:text-navy">
          Customers
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Customer</p>
          <h1 className="text-2xl font-semibold tracking-tight">{profile.fullName}</h1>
          <p className="font-mono text-xs text-slate-500">{profile.customerId}</p>
        </div>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          PROTOTYPE / PENDING HUMAN VISUAL REVIEW. Mock data only. Payment status is separate from booking status.
        </p>
        <nav className="flex gap-2 overflow-x-auto text-sm" aria-label="Customer sections">
          {JUMPS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-slate-400">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section id="profile" title="Profile">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Info label="Customer ID" value={profile.customerId} mono />
            <Info label="Full name" value={profile.fullName} />
            <Info label="Email" value={profile.email} />
            <Info label="Country" value={`${profile.countryName} (${profile.countryCode})`} />
          </dl>
        </Section>

        <Section id="acquisition" title="Acquisition">
          {customer.bookings.length === 0 ? (
            <Empty>No booking acquisition on this customer.</Empty>
          ) : (
            <ul className="flex flex-col gap-4">
              {customer.bookings.map((booking) => (
                <li key={booking.bookingId} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <Link href={`/admin/bookings/${booking.bookingId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
                    {booking.bookingId}
                  </Link>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Info label="Self-reported" value={booking.selfReported ? selfReportedLabel(booking.selfReported) : "—"} />
                    <Info label="Measured" value={booking.measured ?? "—"} />
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section id="bookings" title="Bookings">
        {customer.bookings.length === 0 ? (
          <Empty>No bookings.</Empty>
        ) : (
          <>
            <ul className="flex flex-col gap-3 lg:hidden">
              {customer.bookings.map((booking) => (
                <li key={booking.bookingId} className="rounded-md border border-slate-200 p-3">
                  <Link href={`/admin/bookings/${booking.bookingId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
                    {booking.bookingId}
                  </Link>
                  <p className="mt-1 font-medium">{booking.planName}</p>
                  <p className="text-sm text-slate-600">
                    Private Guide · {formatIsoDate(booking.bookingDate)} · {booking.startTime} JST
                  </p>
                  <p className="text-sm text-slate-600">{formatGuests(booking.adults, booking.children)}</p>
                  <p className="mt-1 tabular-nums">{formatJpy(booking.totalJpy)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <StatusPill value={booking.bookingStatus} />
                    {booking.paymentStatuses.map((status) => (
                      <StatusPill key={status} value={status} />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {["Booking ID", "Service", "Plan", "Date", "Time", "Guests", "Booking status", "Payment status", "Total"].map((label) => (
                      <th key={label} className="px-2 py-2 font-medium whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customer.bookings.map((booking) => (
                    <tr key={booking.bookingId} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-2 font-mono text-xs">
                        <Link href={`/admin/bookings/${booking.bookingId}`} className="text-navy underline-offset-2 hover:underline">
                          {booking.bookingId}
                        </Link>
                      </td>
                      <td className="px-2 py-2" title={booking.service}>
                        Private Guide
                      </td>
                      <td className="px-2 py-2">{booking.planName}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{formatIsoDate(booking.bookingDate)}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{booking.startTime} JST</td>
                      <td className="px-2 py-2">{formatGuests(booking.adults, booking.children)}</td>
                      <td className="px-2 py-2">
                        <StatusPill value={booking.bookingStatus} />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1">
                          {booking.paymentStatuses.length === 0 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            booking.paymentStatuses.map((status) => <StatusPill key={status} value={status} />)
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap tabular-nums">{formatJpy(booking.totalJpy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      <Section id="plans" title="Private Day Plans">
        {customer.plans.length === 0 ? (
          <Empty>No private day plans.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {customer.plans.map((plan) => (
              <li key={plan.planId} className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/admin/plans/${plan.planId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
                    {plan.planId}
                  </Link>
                  <p className="text-xs text-slate-500">Booking {plan.bookingId}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusPill value={plan.plannerStatus} />
                  <StatusPill value={plan.planningStatus} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="inquiries" title="Inquiries">
        {customer.inquiries.length === 0 ? (
          <Empty>No inquiries.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {customer.inquiries.map((inquiry) => (
              <li key={inquiry.inquiryId} className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/admin/inquiries/${inquiry.inquiryId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
                    {inquiry.inquiryId}
                  </Link>
                  <p className="text-sm">{inquiry.summary}</p>
                  <p className="text-xs text-slate-500">{formatTimestamp(inquiry.createdAt)}</p>
                </div>
                <StatusPill value={inquiry.status} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="trips" title="Trips">
        <p className="mb-3 text-xs text-slate-500">Preferences belong to a booking, not the customer profile.</p>
        {customer.trips.length === 0 ? (
          <Empty>No trip preferences.</Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {customer.trips.map((trip) => (
              <li key={trip.bookingId} className="rounded-md border border-slate-200 p-3">
                <Link href={`/admin/bookings/${trip.bookingId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
                  {trip.bookingId}
                </Link>
                <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                  <Info label="Arriving" value={formatIsoDate(trip.arriving)} />
                  <Info label="Leaving" value={formatIsoDate(trip.leaving)} />
                  <Info label="Interests" value={trip.interests.map(interestLabel).join(", ")} />
                  <Info label="Trip description" value={trip.tripDescription ?? "—"} />
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="payments" title="Payments">
        {customer.payments.length === 0 ? (
          <Empty>No payments.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {customer.payments.map((payment) => (
              <li key={payment.paymentId} className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-slate-500">
                    {payment.paymentId} · {payment.bookingId}
                  </p>
                  <p className="text-sm tabular-nums">{formatJpy(payment.amountJpy)}</p>
                  <p className="text-xs text-slate-500">{payment.occurredAt ? formatTimestamp(payment.occurredAt) : "No timestamp"}</p>
                </div>
                <StatusPill value={payment.paymentStatus} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="timeline" title="Timeline">
        {customer.timeline.length === 0 ? (
          <Empty>No activity.</Empty>
        ) : (
          <ol className="flex flex-col gap-0">
            {customer.timeline.map((event) => (
              <li key={event.id} className="grid grid-cols-[auto_1fr] gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-navy" aria-hidden />
                <div className="border-b border-slate-100 pb-3">
                  <p className="text-sm font-medium">{event.label}</p>
                  <p className="text-xs text-slate-500">
                    {formatTimestamp(event.at)} · {event.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 rounded-md border border-slate-200 bg-white p-4">
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
