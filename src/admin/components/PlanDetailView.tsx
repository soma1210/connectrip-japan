import type { ReactNode } from "react";
import Link from "next/link";
import { formatDuration, formatGuests, formatIsoDate, formatJpy } from "@/admin/format";
import { interestLabel, type AdminPlanDetail } from "@/admin/customers/readModel";
import { StatusPill } from "./StatusPill";

const STEPS = ["Planner Submitted", "Planning", "Plan Proposed", "Finalized"] as const;

export function PlanDetailView({ plan }: { plan: AdminPlanDetail }) {
  const current =
    plan.plannerStatus === "NOT_SUBMITTED" ? 0 : plan.planningStatus === "PLANNING" ? 1 : plan.planningStatus === "PROPOSED" ? 2 : plan.planningStatus === "FINALIZED" ? 3 : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/admin/plans" className="text-sm text-slate-500 hover:text-navy">
          Private Day Plans
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Private Day Plan</p>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{plan.planId}</h1>
          <p className="text-sm text-slate-600">{plan.customerName}</p>
        </div>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          PROTOTYPE / PENDING HUMAN VISUAL REVIEW. Read only. Planning status is a provisional office read model.
        </p>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Planning progress</h2>
        <ol className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {STEPS.map((label, index) => {
            const done = plan.planningStatus === "FINALIZED" || index < current;
            const active = plan.planningStatus !== "FINALIZED" && index === current;
            return (
              <li key={label} className="flex min-w-0 items-center gap-2 sm:flex-1">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    done ? "bg-navy text-white" : active ? "bg-white text-navy ring-2 ring-navy" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`text-sm ${done || active ? "text-navy" : "text-slate-400"}`}>{label}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-slate-500">Progress is shown for staff. Nothing on this screen can be changed.</p>
      </section>

      <Section title="Overview">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Plan ID" value={plan.planId} mono />
          <div className="min-w-0">
            <dt className="text-xs text-slate-500">Booking ID</dt>
            <dd className="font-mono text-xs">
              <Link href={`/admin/bookings/${plan.bookingId}`} className="text-navy underline-offset-2 hover:underline">
                {plan.bookingId}
              </Link>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-slate-500">Customer</dt>
            <dd className="text-sm">
              <Link href={`/admin/customers/${plan.customerId}`} className="text-navy underline-offset-2 hover:underline">
                {plan.customerName}
              </Link>
            </dd>
          </div>
          <Info label="Tour date" value={formatIsoDate(plan.bookingDate)} />
          <Info label="Start time" value={`${plan.startTime} JST`} />
          <Info label="Duration" value={formatDuration(plan.durationMinutes)} />
          <Info label="Guests" value={formatGuests(plan.adults, plan.children)} />
          <div>
            <dt className="text-xs text-slate-500">Booking status</dt>
            <dd className="mt-1">
              <StatusPill value={plan.bookingStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Planner status</dt>
            <dd className="mt-1">
              <StatusPill value={plan.plannerStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Planning status</dt>
            <dd className="mt-1">
              <StatusPill value={plan.planningStatus} />
            </dd>
          </div>
          <Info label="Guide assignment" value={plan.guideAssigned ? "Assigned" : "Unassigned"} />
        </dl>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Customer">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2">
              <dt className="text-xs text-slate-500">Full name</dt>
              <dd className="text-sm">
                <Link href={`/admin/customers/${plan.customerId}`} className="text-navy underline-offset-2 hover:underline">
                  {plan.customerName}
                </Link>
              </dd>
            </div>
            <Info label="Email" value={plan.email} />
            <Info label="Country" value={`${plan.countryName} (${plan.countryCode})`} />
            <Info label="Arrival date" value={plan.arriving ? formatIsoDate(plan.arriving) : "—"} />
            <Info label="Departure date" value={plan.leaving ? formatIsoDate(plan.leaving) : "—"} />
          </dl>
        </Section>

        <Section title="Booking">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Info label="Plan" value={plan.planName} />
            <Info label="Date" value={formatIsoDate(plan.bookingDate)} />
            <Info label="Start time" value={`${plan.startTime} JST`} />
            <Info label="Duration" value={formatDuration(plan.durationMinutes)} />
            <Info label="Guest composition" value={formatGuests(plan.adults, plan.children)} />
            <Info label="Total" value={formatJpy(plan.totalJpy)} />
            <div>
              <dt className="text-xs text-slate-500">Payment status</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {plan.paymentStatuses.length === 0 ? <span className="text-sm text-slate-400">—</span> : plan.paymentStatuses.map((status) => <StatusPill key={status} value={status} />)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Booking status</dt>
              <dd className="mt-1">
                <StatusPill value={plan.bookingStatus} />
              </dd>
            </div>
          </dl>
        </Section>
      </div>

      <Section title="Booking preferences">
        <p className="mb-3 text-xs text-slate-500">Collected with the booking. Read only.</p>
        <dl className="grid gap-3">
          <Info label="Interests" value={plan.interests.length === 0 ? "—" : plan.interests.map(interestLabel).join(", ")} />
          <Info label="General trip description" value={plan.tripDescription ?? "—"} />
        </dl>
      </Section>

      <Section title="Private Day Planner">
        <p className="mb-3 text-xs text-slate-500">Submitted after booking. Interests are not asked again here.</p>
        {plan.plannerStatus === "SUBMITTED" ? (
          <dl className="grid gap-3">
            <Info label="Places they want to visit" value={plan.places ?? "—"} />
            <Info label="Ideal day" value={plan.idealDay ?? "—"} />
            <Info label="Additional requests" value={plan.anythingElse ?? "—"} />
          </dl>
        ) : (
          <p className="text-sm text-slate-600">Planner not submitted.</p>
        )}
      </Section>

      <Section title="Guide">
        <p className="text-sm">{plan.guideAssigned ? "Assigned" : "Unassigned"}</p>
        <p className="mt-1 text-xs text-slate-500">Assignment changes are not available on this screen.</p>
      </Section>

      <Section title="Internal planning">
        <p className="text-sm text-slate-600">No internal notes in this prototype.</p>
      </Section>

      {plan.relatedInquiryId ? (
        <Section title="Related inquiry">
          <Link href={`/admin/inquiries/${plan.relatedInquiryId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
            {plan.relatedInquiryId}
          </Link>
          <p className="mt-1 text-xs text-slate-500">Linked because this inquiry already records this booking.</p>
        </Section>
      ) : null}
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
