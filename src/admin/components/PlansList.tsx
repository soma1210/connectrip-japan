"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDuration, formatIsoDate, formatTimestamp } from "@/admin/format";
import {
  ADMIN_PLANNER_STATUSES,
  ADMIN_PLANNING_STATUSES,
  type AdminPlanListItem,
  type AdminPlannerStatus,
  type AdminPlanningStatus,
} from "@/admin/customers/readModel";
import { StatusPill } from "./StatusPill";

type GuideFilter = "ALL" | "ASSIGNED" | "UNASSIGNED";

export function PlansList({ plans }: { plans: AdminPlanListItem[] }) {
  const [query, setQuery] = useState("");
  const [plannerStatus, setPlannerStatus] = useState<AdminPlannerStatus | "ALL">("ALL");
  const [planningStatus, setPlanningStatus] = useState<AdminPlanningStatus | "ALL">("ALL");
  const [guide, setGuide] = useState<GuideFilter>("ALL");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plans.filter((plan) => {
      const text = !q || [plan.planId, plan.bookingId, plan.customerName, plan.email].some((value) => value.toLowerCase().includes(q));
      const plannerOk = plannerStatus === "ALL" || plan.plannerStatus === plannerStatus;
      const planningOk = planningStatus === "ALL" || plan.planningStatus === planningStatus;
      const guideOk = guide === "ALL" || (guide === "ASSIGNED" ? plan.guideAssigned : !plan.guideAssigned);
      return text && plannerOk && planningOk && guideOk;
    });
  }, [plans, query, plannerStatus, planningStatus, guide]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Operations</p>
        <h1 className="text-2xl font-semibold tracking-tight">Private Day Plans</h1>
        <p className="text-sm text-slate-600">Where each booking stands after the reservation. Search by plan, booking, name, or email.</p>
      </header>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        PROTOTYPE / PENDING HUMAN VISUAL REVIEW. Planning status is a provisional office read model, not a shared contract.
      </p>

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Plan, booking, name, or email"
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-navy focus:outline-none"
          />
        </label>
        <Select label="Planner status" value={plannerStatus} onChange={setPlannerStatus} options={["ALL", ...ADMIN_PLANNER_STATUSES]} />
        <Select label="Planning status" value={planningStatus} onChange={setPlanningStatus} options={["ALL", ...ADMIN_PLANNING_STATUSES]} />
        <Select label="Guide" value={guide} onChange={setGuide} options={["ALL", "ASSIGNED", "UNASSIGNED"]} />
      </form>

      <p className="text-sm text-slate-600">
        {visible.length} of {plans.length}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-600">No plans match these filters.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 lg:hidden">
            {visible.map((plan) => (
              <li key={plan.planId} className="rounded-md border border-slate-200 bg-white p-4">
                <PlanIdentity plan={plan} />
                <Link href={`/admin/customers/${plan.customerId}`} className="mt-1 block font-medium text-navy underline-offset-2 hover:underline">
                  {plan.customerName}
                </Link>
                <p className="truncate text-xs text-slate-500">{plan.email}</p>
                <p className="mt-2 text-sm text-slate-700">
                  <Link href={`/admin/bookings/${plan.bookingId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
                    {plan.bookingId}
                  </Link>
                  {" · "}
                  {formatIsoDate(plan.bookingDate)}
                </p>
                <p className="text-sm text-slate-600">{formatDuration(plan.durationMinutes)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <StatusPill value={plan.plannerStatus} />
                  <StatusPill value={plan.planningStatus} />
                </div>
                <p className="mt-2 text-xs text-slate-600">{plan.guideAssigned ? "Assigned" : "Unassigned"}</p>
                <p className="text-xs text-slate-500">{plan.updatedAt ? formatTimestamp(plan.updatedAt) : "—"}</p>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white lg:block">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Plan", "Customer", "Booking", "Tour date", "Duration", "Planner status", "Planning status", "Guide", "Last updated"].map((label) => (
                    <th key={label} className="whitespace-nowrap px-3 py-2 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((plan) => (
                  <tr key={plan.planId} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 align-top">
                      <PlanIdentity plan={plan} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Link href={`/admin/customers/${plan.customerId}`} className="font-medium text-navy underline-offset-2 hover:underline">
                        {plan.customerName}
                      </Link>
                      <p className="max-w-[12rem] truncate text-xs text-slate-500">{plan.email}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <Link href={`/admin/bookings/${plan.bookingId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
                        {plan.bookingId}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">
                      {formatIsoDate(plan.bookingDate)}
                      <p className="text-xs text-slate-500">{plan.startTime} JST</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">{formatDuration(plan.durationMinutes)}</td>
                    <td className="px-3 py-3 align-top">
                      <StatusPill value={plan.plannerStatus} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <StatusPill value={plan.planningStatus} />
                    </td>
                    <td className="px-3 py-3 align-top text-xs">{plan.guideAssigned ? "Assigned" : "Unassigned"}</td>
                    <td className="whitespace-nowrap px-3 py-3 align-top text-xs text-slate-600">{plan.updatedAt ? formatTimestamp(plan.updatedAt) : "—"}</td>
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

function PlanIdentity({ plan }: { plan: AdminPlanListItem }) {
  return (
    <Link href={`/admin/plans/${plan.planId}`} className="font-mono text-xs text-navy underline-offset-2 hover:underline">
      {plan.planId}
    </Link>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "ALL" ? "All" : option === "ASSIGNED" ? "Assigned" : option === "UNASSIGNED" ? "Unassigned" : option}
          </option>
        ))}
      </select>
    </label>
  );
}
