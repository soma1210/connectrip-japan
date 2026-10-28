"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatGuests, formatIsoDate, formatTimestamp } from "@/admin/format";
import { ADMIN_INQUIRY_STATUSES, selfReportedLabel, type AdminInquiryListItem, type AdminInquiryStatus } from "@/admin/customers/readModel";
import { StatusPill } from "./StatusPill";

export function InquiriesList({ inquiries }: { inquiries: AdminInquiryListItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminInquiryStatus | "ALL">("ALL");
  const [country, setCountry] = useState("ALL");
  const [typeLabel, setTypeLabel] = useState("ALL");

  const countries = useMemo(() => {
    const map = new Map<string, string>();
    for (const inquiry of inquiries) map.set(inquiry.countryCode, inquiry.countryName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [inquiries]);

  const types = useMemo(() => [...new Set(inquiries.map((inquiry) => inquiry.typeLabel))].sort(), [inquiries]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      const text = !q || [inquiry.inquiryId, inquiry.customerName, inquiry.email].some((value) => value.toLowerCase().includes(q));
      const statusOk = status === "ALL" || inquiry.status === status;
      const countryOk = country === "ALL" || inquiry.countryCode === country;
      const typeOk = typeLabel === "ALL" || inquiry.typeLabel === typeLabel;
      return text && statusOk && countryOk && typeOk;
    });
  }, [inquiries, query, status, country, typeLabel]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Customers</p>
        <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
        <p className="text-sm text-slate-600">Questions before booking. Search by inquiry ID, name, or email.</p>
      </header>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        PROTOTYPE / PENDING HUMAN VISUAL REVIEW. Inquiry status is a provisional admin read model, not a shared contract.
      </p>

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Inquiry ID, name, or email"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as AdminInquiryStatus | "ALL")}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            {ADMIN_INQUIRY_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
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
          Inquiry type
          <select
            value={typeLabel}
            onChange={(event) => setTypeLabel(event.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none"
          >
            <option value="ALL">All types</option>
            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </form>

      <p className="text-sm text-slate-600">
        {visible.length} of {inquiries.length}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-600">No inquiries match these filters.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 lg:hidden">
            {visible.map((inquiry) => (
              <li key={inquiry.inquiryId} className="rounded-md border border-slate-200 bg-white p-4">
                <InquiryIdentity inquiry={inquiry} />
                <Link href={`/admin/customers/${inquiry.customerId}`} className="mt-1 block font-medium text-navy underline-offset-2 hover:underline">
                  {inquiry.customerName}
                </Link>
                <p className="truncate text-xs text-slate-500">{inquiry.email}</p>
                <p className="mt-2 text-sm text-slate-700">{inquiry.countryName}</p>
                <p className="text-sm text-slate-700">{inquiry.typeLabel}</p>
                <p className="text-sm text-slate-600">{tripDates(inquiry)}</p>
                <p className="text-sm text-slate-600">{guests(inquiry)}</p>
                <div className="mt-2">
                  <StatusPill value={inquiry.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{formatTimestamp(inquiry.createdAt)}</p>
                <Acquisition inquiry={inquiry} />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white lg:block">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Inquiry", "Customer", "Country", "Trip dates", "Guests", "Inquiry type", "Status", "Created", "Acquisition"].map((label) => (
                    <th key={label} className="whitespace-nowrap px-3 py-2 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((inquiry) => (
                  <tr key={inquiry.inquiryId} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 align-top">
                      <InquiryIdentity inquiry={inquiry} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Link href={`/admin/customers/${inquiry.customerId}`} className="font-medium text-navy underline-offset-2 hover:underline">
                        {inquiry.customerName}
                      </Link>
                      <p className="max-w-[12rem] truncate text-xs text-slate-500">{inquiry.email}</p>
                    </td>
                    <td className="px-3 py-3 align-top">{inquiry.countryName}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">{tripDates(inquiry)}</td>
                    <td className="px-3 py-3 align-top">{guests(inquiry)}</td>
                    <td className="px-3 py-3 align-top">{inquiry.typeLabel}</td>
                    <td className="px-3 py-3 align-top">
                      <StatusPill value={inquiry.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-slate-600">{formatTimestamp(inquiry.createdAt)}</td>
                    <td className="px-3 py-3 align-top">
                      <Acquisition inquiry={inquiry} />
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

function InquiryIdentity({ inquiry }: { inquiry: AdminInquiryListItem }) {
  return (
    <Link href={`/admin/inquiries/${inquiry.inquiryId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
      {inquiry.inquiryId}
    </Link>
  );
}

function tripDates(inquiry: AdminInquiryListItem) {
  if (!inquiry.arriving && !inquiry.leaving) return "—";
  if (inquiry.arriving && inquiry.leaving) return `${formatIsoDate(inquiry.arriving)} – ${formatIsoDate(inquiry.leaving)}`;
  return formatIsoDate(inquiry.arriving ?? inquiry.leaving ?? "");
}

function guests(inquiry: AdminInquiryListItem) {
  if (inquiry.adults === null) return "—";
  return formatGuests(inquiry.adults, inquiry.children ?? 0);
}

function Acquisition({ inquiry }: { inquiry: AdminInquiryListItem }) {
  return (
    <div className="text-xs leading-5 text-slate-700">
      <p>
        <span className="text-slate-500">Self-reported </span>
        {inquiry.selfReported ? selfReportedLabel(inquiry.selfReported) : "—"}
      </p>
      <p>
        <span className="text-slate-500">Measured </span>
        {inquiry.measured ?? "—"}
      </p>
    </div>
  );
}
