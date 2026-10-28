import type { ReactNode } from "react";
import Link from "next/link";
import { formatGuests, formatIsoDate, formatTimestamp } from "@/admin/format";
import { selfReportedLabel, type AdminInquiryDetail } from "@/admin/customers/readModel";

export function InquiryDetailView({ inquiry }: { inquiry: AdminInquiryDetail }) {
  const guestLabel = inquiry.adults === null ? "—" : formatGuests(inquiry.adults, inquiry.children ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/admin/inquiries" className="text-sm text-slate-500 hover:text-navy">
          Inquiries
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Inquiry</p>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{inquiry.inquiryId}</h1>
          <p className="text-sm text-slate-600">{inquiry.summary}</p>
        </div>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          PROTOTYPE / PENDING HUMAN VISUAL REVIEW. Read only. Status labels are a provisional admin read model.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Inquiry overview">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Info label="Inquiry ID" value={inquiry.inquiryId} mono />
            <Info label="Status" value={inquiry.status} />
            <Info label="Created" value={formatTimestamp(inquiry.createdAt)} />
            <Info label="Inquiry type" value={inquiry.typeLabel} />
          </dl>
          <p className="mt-3 text-xs text-slate-500">Inquiry type is a mock label. It is not an approved taxonomy.</p>
        </Section>

        <Section title="Customer">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Customer ID</dt>
              <dd className="font-mono text-xs">
                <Link href={`/admin/customers/${inquiry.customerId}`} className="text-navy underline-offset-2 hover:underline">
                  {inquiry.customerId}
                </Link>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Full name</dt>
              <dd className="text-sm">
                <Link href={`/admin/customers/${inquiry.customerId}`} className="text-navy underline-offset-2 hover:underline">
                  {inquiry.customerName}
                </Link>
              </dd>
            </div>
            <Info label="Email" value={inquiry.email} />
            <Info label="Country" value={`${inquiry.countryName} (${inquiry.countryCode})`} />
          </dl>
        </Section>
      </div>

      <Section title="Trip">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Info label="Arriving" value={inquiry.arriving ? formatIsoDate(inquiry.arriving) : "—"} />
          <Info label="Leaving" value={inquiry.leaving ? formatIsoDate(inquiry.leaving) : "—"} />
          <Info label="Guests" value={guestLabel} />
        </dl>
      </Section>

      <Section title="Request">
        <dl className="grid gap-3">
          <Info label="What can we help you with?" value={inquiry.helpWith} />
          <Info label="Tell us about your trip" value={inquiry.tripNote} />
        </dl>
      </Section>

      <Section title="Acquisition">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Info label="Self-reported" value={inquiry.selfReported ? selfReportedLabel(inquiry.selfReported) : "—"} />
          <Info label="Measured" value={inquiry.measured ?? "—"} />
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
