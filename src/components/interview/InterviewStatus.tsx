// Applicant-facing status messages for the booking page. Never shows the Meet
// URL: that is sent only in the confirmation email.

import type { ReactNode } from "react";

const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));

const time = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** "Monday, November 2, 2026 · 14:00–14:30 (Japan Time)" */
export function formatSlot(startIso: string, endIso: string) {
  return `${dateTime(startIso)} · ${time(startIso)}–${time(endIso)} (Japan Time)`;
}

export function StatusCard({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-navy/15 bg-white p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

export function InterviewStatus(
  props:
    | { state: "invalid" | "expired" | "closed" | "unavailable" }
    | { state: "requested" | "confirmed"; start: string; end: string },
) {
  switch (props.state) {
    case "invalid":
      return (
        <StatusCard title="This link is not valid">
          <p className="text-sm text-navy/70">Please check the booking link in your email from Connectrip Japan.</p>
        </StatusCard>
      );
    case "expired":
      return (
        <StatusCard title="This link has expired">
          <p className="text-sm text-navy/70">Please contact Connectrip Japan and we will send you a new link.</p>
        </StatusCard>
      );
    case "closed":
      return (
        <StatusCard title="This link is no longer active">
          <p className="text-sm text-navy/70">If you still need to book an interview, please contact Connectrip Japan.</p>
        </StatusCard>
      );
    case "unavailable":
      return (
        <StatusCard title="Booking is temporarily unavailable">
          <p className="text-sm text-navy/70">Please try again later.</p>
        </StatusCard>
      );
    case "requested":
      return (
        <StatusCard title="Your interview request has been submitted.">
          <p className="rounded-md bg-navy/[0.04] px-3 py-2 text-sm font-medium">{formatSlot(props.start, props.end)}</p>
          <p className="text-sm text-navy/70">
            We will send you a confirmation email once your interview has been approved.
          </p>
        </StatusCard>
      );
    case "confirmed":
      return (
        <StatusCard title="Your interview is confirmed.">
          <p className="rounded-md bg-navy/[0.04] px-3 py-2 text-sm font-medium">{formatSlot(props.start, props.end)}</p>
          <p className="text-sm text-navy/70">The Google Meet link has been sent to you by email.</p>
        </StatusCard>
      );
  }
}
