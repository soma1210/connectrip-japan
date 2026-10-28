import Link from "next/link";
import { formatGuests, formatIsoDate, formatJpy, formatTimestamp } from "@/admin/format";
import type { AdminBookingListItem, AdminDashboard } from "@/admin/customers/readModel";
import { StatusPill } from "./StatusPill";

export function DashboardView({ dashboard }: { dashboard: AdminDashboard }) {
  const attention = dashboard.needsAttention;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Overview</p>
          <h1 className="text-2xl font-semibold tracking-tight">What needs attention today?</h1>
          <p className="text-sm text-slate-600">Operations dashboard. Counts come from the same prototype bookings, inquiries, and payments.</p>
        </div>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          PROTOTYPE / PENDING HUMAN VISUAL REVIEW. Needs Attention is a screen grouping, not a saved status.
        </p>
        <nav className="flex flex-wrap gap-2" aria-label="Quick navigation">
          <Link href="/admin/customers" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-navy hover:border-slate-400">
            Customers
          </Link>
          <Link href="/admin/bookings" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-navy hover:border-slate-400">
            Bookings
          </Link>
        </nav>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Needs attention</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AttentionCard title="Awaiting payment" count={attention.awaitingPayment.length} href="/admin/bookings" rows={attention.awaitingPayment} />
          <AttentionCard title="Awaiting confirmation" count={attention.awaitingConfirmation.length} href="/admin/bookings" rows={attention.awaitingConfirmation} />
          <AttentionCard title="Planner not submitted" count={attention.plannerNotSubmitted.length} href="/admin/plans" action="Plans" rows={attention.plannerNotSubmitted} planLink />
          <AttentionCard title="Guide unassigned" count={attention.guideUnassigned.length} href="/admin/bookings" rows={attention.guideUnassigned} />
          <article className="rounded-md border border-slate-200 bg-white p-4 sm:col-span-2 xl:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium">Open inquiries</h3>
              <Link href="/admin/inquiries" className="shrink-0 text-xs text-navy underline-offset-2 hover:underline">
                Inquiries
              </Link>
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{attention.openInquiries.length}</p>
            <p className="text-xs text-slate-500">NEW, IN_PROGRESS, PROPOSAL_SENT, or ACCEPTED on this screen only.</p>
            {attention.openInquiries.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">None</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {attention.openInquiries.map((inquiry) => (
                  <li key={inquiry.inquiryId} className="min-w-0 text-sm">
                    <Link href={`/admin/customers/${inquiry.customerId}`} className="font-medium text-navy underline-offset-2 hover:underline">
                      {inquiry.customerName}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      <Link href={`/admin/inquiries/${inquiry.inquiryId}`} className="font-mono text-navy underline-offset-2 hover:underline">
                        {inquiry.inquiryId}
                      </Link>
                      {" · "}
                      {inquiry.summary}
                    </p>
                    <StatusPill value={inquiry.status} />
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Upcoming bookings</h2>
          <Link href="/admin/bookings" className="text-xs text-navy underline-offset-2 hover:underline">
            All bookings
          </Link>
        </div>
        <p className="mb-3 text-xs text-slate-500">Booking date is today or later in Japan. Cancelled and expired rows are left out.</p>
        {dashboard.upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming bookings.</p>
        ) : (
          <>
            <ul className="flex flex-col gap-3 lg:hidden">
              {dashboard.upcoming.map((booking) => (
                <li key={booking.bookingId} className="rounded-md border border-slate-200 p-3">
                  <BookingLinks booking={booking} />
                  <p className="mt-1 text-sm text-slate-700">
                    {formatIsoDate(booking.bookingDate)} · {booking.startTime} JST
                  </p>
                  <p className="text-sm text-slate-600">Private Guide · {formatGuests(booking.adults, booking.children)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusPill value={booking.bookingStatus} />
                    <span className="text-xs text-slate-600">{booking.guideNoted ? "Timeline noted" : "Unassigned"}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {["Date", "Time", "Customer", "Booking", "Service", "Guests", "Booking status", "Guide"].map((label) => (
                      <th key={label} className="whitespace-nowrap px-2 py-2 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboard.upcoming.map((booking) => (
                    <tr key={booking.bookingId} className="border-b border-slate-100 last:border-0">
                      <td className="whitespace-nowrap px-2 py-2">{formatIsoDate(booking.bookingDate)}</td>
                      <td className="whitespace-nowrap px-2 py-2">{booking.startTime} JST</td>
                      <td className="px-2 py-2">
                        <Link href={`/admin/customers/${booking.customerId}`} className="text-navy underline-offset-2 hover:underline">
                          {booking.customerName}
                        </Link>
                      </td>
                      <td className="px-2 py-2">
                        <Link href={`/admin/bookings/${booking.bookingId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
                          {booking.bookingId}
                        </Link>
                      </td>
                      <td className="px-2 py-2">Private Guide</td>
                      <td className="px-2 py-2">{formatGuests(booking.adults, booking.children)}</td>
                      <td className="px-2 py-2">
                        <StatusPill value={booking.bookingStatus} />
                      </td>
                      <td className="px-2 py-2 text-xs">{booking.guideNoted ? "Timeline noted" : "Unassigned"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{dashboard.monthLabel}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Bookings" value={String(dashboard.month.bookingsCreated)} note="Created this month, Japan time." />
          <Metric
            label="Revenue"
            value={formatJpy(dashboard.month.revenuePaidJpy)}
            note="PROVISIONAL DISPLAY RULE. Sum of payments marked paid and recorded this month. Refunds are not subtracted."
          />
          <Metric label="Customers" value={String(dashboard.month.customersWithActivity)} note="Distinct customers with a booking, inquiry, or timeline event this month." />
          <Metric label="New inquiries" value={String(dashboard.month.inquiriesCreated)} note="Inquiries created this month. Not the inquiry status NEW." />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recent activity</h2>
        <p className="mb-3 text-xs text-slate-500">Derived from the prototype timeline. Not an audit log.</p>
        {dashboard.recentActivity.length === 0 ? (
          <p className="text-sm text-slate-500">No activity.</p>
        ) : (
          <ol className="flex flex-col">
            {dashboard.recentActivity.map((event) => (
              <li key={event.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-slate-100 py-3 last:border-0">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-navy" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{event.label}</p>
                  <p className="text-xs text-slate-500">{formatTimestamp(event.at)}</p>
                  <p className="mt-1 truncate text-sm">
                    <Link href={`/admin/customers/${event.customerId}`} className="text-navy underline-offset-2 hover:underline">
                      {event.customerName}
                    </Link>
                    {event.bookingId ? (
                      <>
                        {" · "}
                        <Link href={`/admin/bookings/${event.bookingId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
                          {event.bookingId}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function AttentionCard({
  title,
  count,
  href,
  rows,
  action = "Bookings",
  planLink = false,
}: {
  title: string;
  count: number;
  href: string;
  rows: AdminBookingListItem[];
  action?: string;
  planLink?: boolean;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <Link href={href} className="shrink-0 text-xs text-navy underline-offset-2 hover:underline">
          {action}
        </Link>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">None</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((booking) => (
            <li key={booking.bookingId} className="min-w-0 text-sm">
              <BookingLinks booking={booking} planLink={planLink} />
              <p className="text-xs text-slate-500">
                {formatIsoDate(booking.bookingDate)} · {booking.startTime} JST
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function BookingLinks({ booking, planLink = false }: { booking: AdminBookingListItem; planLink?: boolean }) {
  const primaryHref = planLink && booking.planId ? `/admin/plans/${booking.planId}` : `/admin/bookings/${booking.bookingId}`;
  const primaryLabel = planLink && booking.planId ? booking.planId : booking.bookingId;
  return (
    <p className="min-w-0 truncate">
      <Link href={primaryHref} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
        {primaryLabel}
      </Link>
      {" · "}
      <Link href={`/admin/customers/${booking.customerId}`} className="text-navy underline-offset-2 hover:underline">
        {booking.customerName}
      </Link>
    </p>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</h3>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>
    </article>
  );
}
