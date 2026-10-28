"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatGuests, formatIsoDate, formatJpy } from "@/admin/format";
import {
  ADMIN_BOOKING_STATUSES,
  ADMIN_PAYMENT_STATUSES,
  type AdminBookingAttention,
  type AdminBookingListItem,
  type AdminBookingStatus,
  type AdminPaymentStatus,
} from "@/admin/customers/readModel";
import { StatusPill } from "./StatusPill";

type AttentionKey = keyof AdminBookingAttention;

const ATTENTION: { key: AttentionKey; label: string }[] = [
  { key: "awaitingPayment", label: "Awaiting payment" },
  { key: "awaitingConfirmation", label: "Awaiting confirmation" },
  { key: "upcoming", label: "Upcoming" },
  { key: "plannerNotSubmitted", label: "Planner not submitted" },
  { key: "guideUnassigned", label: "Guide unassigned" },
];

export function BookingsList({ bookings }: { bookings: AdminBookingListItem[] }) {
  const [query, setQuery] = useState("");
  const [bookingStatus, setBookingStatus] = useState<AdminBookingStatus | "ALL">("ALL");
  const [paymentStatus, setPaymentStatus] = useState<AdminPaymentStatus | "ALL">("ALL");
  const [date, setDate] = useState("");
  const [attention, setAttention] = useState<AttentionKey | null>(null);

  const counts = useMemo(() => {
    const tally = {} as Record<AttentionKey, number>;
    for (const item of ATTENTION) tally[item.key] = bookings.filter((booking) => booking.attention[item.key]).length;
    return tally;
  }, [bookings]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const text =
        !q ||
        [booking.bookingId, booking.customerName, booking.customerEmail].some((value) => value.toLowerCase().includes(q));
      const statusOk = bookingStatus === "ALL" || booking.bookingStatus === bookingStatus;
      const paymentOk = paymentStatus === "ALL" || booking.paymentStatuses.includes(paymentStatus);
      const dateOk = !date || booking.bookingDate === date;
      const attentionOk = !attention || booking.attention[attention];
      return text && statusOk && paymentOk && dateOk && attentionOk;
    });
  }, [bookings, query, bookingStatus, paymentStatus, date, attention]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Operations</p>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="text-sm text-slate-600">Daily view. Read only. Search by booking ID, customer name, or email.</p>
      </header>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        PROTOTYPE / PENDING HUMAN VISUAL REVIEW. Indicators are calculated for this screen. They are not saved statuses.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ATTENTION.map((item) => {
          const selected = attention === item.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setAttention(selected ? null : item.key)}
              className={`shrink-0 rounded-md border px-3 py-2 text-left text-sm ${
                selected ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-navy hover:border-slate-400"
              }`}
            >
              <span className="block text-[11px] uppercase tracking-wide opacity-70">{item.label}</span>
              <span className="tabular-nums font-semibold">{counts[item.key]}</span>
            </button>
          );
        })}
      </div>

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Booking ID, name, or email"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Booking status
          <select
            value={bookingStatus}
            onChange={(event) => setBookingStatus(event.target.value as AdminBookingStatus | "ALL")}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            {ADMIN_BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Payment status
          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value as AdminPaymentStatus | "ALL")}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none"
          >
            <option value="ALL">All payments</option>
            {ADMIN_PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Booking date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none"
          />
        </label>
      </form>

      <p className="text-sm text-slate-600">
        {visible.length} of {bookings.length}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-600">No bookings match these filters.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 lg:hidden">
            {visible.map((booking) => (
              <li key={booking.bookingId} className="rounded-md border border-slate-200 bg-white p-4">
                <BookingIdentity booking={booking} />
                <p className="mt-2 text-sm text-slate-700">
                  {formatIsoDate(booking.bookingDate)} · {booking.startTime} JST
                </p>
                <p className="text-sm text-slate-600">{formatGuests(booking.adults, booking.children)}</p>
                <p className="mt-1 tabular-nums">{formatJpy(booking.totalJpy)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <StatusPill value={booking.bookingStatus} />
                  <PaymentPills statuses={booking.paymentStatuses} />
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Planner {booking.plannerSubmitted ? "submitted" : "not submitted"} · Guide {booking.guideNoted ? "noted on timeline" : "unassigned"}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white lg:block">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Booking", "Customer", "Service", "Date / time", "Guests", "Total", "Booking status", "Payment status", "Planner", "Guide"].map(
                    (label) => (
                      <th key={label} className="whitespace-nowrap px-3 py-2 font-medium">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((booking) => (
                  <tr key={booking.bookingId} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 align-top">
                      <BookingIdentity booking={booking} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Link href={`/admin/customers/${booking.customerId}`} className="font-medium text-navy underline-offset-2 hover:underline">
                        {booking.customerName}
                      </Link>
                      <p className="max-w-[14rem] truncate text-xs text-slate-500">{booking.customerEmail}</p>
                    </td>
                    <td className="px-3 py-3 align-top" title={booking.service}>
                      Private Guide
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">
                      {formatIsoDate(booking.bookingDate)}
                      <p className="text-xs text-slate-500">{booking.startTime} JST</p>
                    </td>
                    <td className="px-3 py-3 align-top">{formatGuests(booking.adults, booking.children)}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums">{formatJpy(booking.totalJpy)}</td>
                    <td className="px-3 py-3 align-top">
                      <StatusPill value={booking.bookingStatus} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <PaymentPills statuses={booking.paymentStatuses} />
                    </td>
                    <td className="px-3 py-3 align-top text-xs">{booking.plannerSubmitted ? "Submitted" : "Not submitted"}</td>
                    <td className="px-3 py-3 align-top text-xs">{booking.guideNoted ? "Timeline noted" : "Unassigned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function BookingIdentity({ booking }: { booking: AdminBookingListItem }) {
  return (
    <div className="min-w-0">
      <Link href={`/admin/bookings/${booking.bookingId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
        {booking.bookingId}
      </Link>
      <p className="text-sm">{booking.planName}</p>
    </div>
  );
}

function PaymentPills({ statuses }: { statuses: AdminPaymentStatus[] }) {
  if (statuses.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {statuses.map((status, index) => (
        <StatusPill key={`${status}-${index}`} value={status} />
      ))}
    </div>
  );
}
