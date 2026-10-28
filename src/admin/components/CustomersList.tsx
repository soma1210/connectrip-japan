"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatJpy, formatTimestamp } from "@/admin/format";
import { selfReportedLabel, type AdminCustomerListItem, type AdminListStatus } from "@/admin/customers/readModel";
import { StatusPill } from "./StatusPill";

type Tri = "ALL" | "YES" | "NO";

function statusText(status: AdminListStatus | null) {
  return status?.status ?? null;
}

export function CustomersList({ customers }: { customers: AdminCustomerListItem[] }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("ALL");
  const [hasBooking, setHasBooking] = useState<Tri>("ALL");
  const [hasInquiry, setHasInquiry] = useState<Tri>("ALL");

  const countries = useMemo(() => {
    const map = new Map<string, string>();
    for (const customer of customers) map.set(customer.countryCode, customer.countryName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [customers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const text = !q || [customer.fullName, customer.email, customer.customerId].some((value) => value.toLowerCase().includes(q));
      const countryOk = country === "ALL" || customer.countryCode === country;
      const bookingOk = hasBooking === "ALL" || (hasBooking === "YES" ? customer.bookingCount > 0 : customer.bookingCount === 0);
      const inquiryOk = hasInquiry === "ALL" || (hasInquiry === "YES" ? customer.inquiryCount > 0 : customer.inquiryCount === 0);
      return text && countryOk && bookingOk && inquiryOk;
    });
  }, [customers, query, country, hasBooking, hasInquiry]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Customers</p>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-slate-600">Mock read model. Search by name, email, or customer ID.</p>
      </header>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        PROTOTYPE / PENDING HUMAN VISUAL REVIEW. Mock data only. Not connected to Core or the database.
      </p>

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 sm:col-span-2 lg:col-span-1">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, or customer ID"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Country
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none"
          >
            <option value="ALL">All countries</option>
            {countries.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Has booking
          <select
            value={hasBooking}
            onChange={(event) => setHasBooking(event.target.value as Tri)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none"
          >
            <option value="ALL">Any</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Has inquiry
          <select
            value={hasInquiry}
            onChange={(event) => setHasInquiry(event.target.value as Tri)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none"
          >
            <option value="ALL">Any</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </label>
      </form>

      <p className="text-sm text-slate-600">
        {visible.length} of {customers.length}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-600">No customers match these filters.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {visible.map((customer) => (
              <li key={customer.customerId} className="rounded-md border border-slate-200 bg-white p-4">
                <CustomerIdentity customer={customer} />
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <Field label="Country" value={customer.countryName} />
                  <Field label="Bookings" value={String(customer.bookingCount)} />
                  <Field label="Revenue" value={formatJpy(customer.totalRevenueJpy)} />
                  <div>
                    <dt className="text-xs text-slate-500">Status</dt>
                    <dd className="mt-1">
                      <StatusValue status={customer.currentStatus} />
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 text-xs text-slate-600">
                  <p>{customer.lastActivityAt ? formatTimestamp(customer.lastActivityAt) : "No activity"}</p>
                  <AcquisitionLines customer={customer} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white md:block">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Country</th>
                  <th className="px-3 py-2 font-medium">Last activity</th>
                  <th className="px-3 py-2 font-medium">Bookings</th>
                  <th className="px-3 py-2 font-medium">Total revenue</th>
                  <th className="px-3 py-2 font-medium">Current status</th>
                  <th className="px-3 py-2 font-medium">Acquisition</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => (
                  <tr key={customer.customerId} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 align-top">
                      <CustomerIdentity customer={customer} />
                    </td>
                    <td className="px-3 py-3 align-top">{customer.countryName}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top text-slate-700">
                      {customer.lastActivityAt ? formatTimestamp(customer.lastActivityAt) : <Empty />}
                    </td>
                    <td className="px-3 py-3 align-top tabular-nums">{customer.bookingCount}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top tabular-nums">{formatJpy(customer.totalRevenueJpy)}</td>
                    <td className="px-3 py-3 align-top">
                      <StatusValue status={customer.currentStatus} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <AcquisitionLines customer={customer} />
                    </td>
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

function CustomerIdentity({ customer }: { customer: AdminCustomerListItem }) {
  return (
    <div className="min-w-0">
      <Link href={`/admin/customers/${customer.customerId}`} className="font-medium text-navy underline-offset-2 hover:underline">
        {customer.fullName}
      </Link>
      <p className="truncate text-xs text-slate-500">{customer.email}</p>
      <p className="font-mono text-[11px] text-slate-400">{customer.customerId}</p>
    </div>
  );
}

function AcquisitionLines({ customer }: { customer: AdminCustomerListItem }) {
  if (!customer.acquisition) return <Empty />;
  return (
    <div className="text-xs leading-5 text-slate-700">
      <p>
        <span className="text-slate-500">Self-reported </span>
        {customer.acquisition.selfReported ? selfReportedLabel(customer.acquisition.selfReported) : "—"}
      </p>
      <p>
        <span className="text-slate-500">Measured </span>
        {customer.acquisition.measured ?? "—"}
      </p>
      {customer.acquisition.additionalBookingCount > 0 ? (
        <p className="text-slate-400">
          +{customer.acquisition.additionalBookingCount} later booking
          {customer.acquisition.additionalBookingCount === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

function StatusValue({ status }: { status: AdminListStatus | null }) {
  const value = statusText(status);
  if (!value) return <Empty />;
  return <StatusPill value={value} />;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Empty() {
  return <span className="text-slate-400">—</span>;
}
