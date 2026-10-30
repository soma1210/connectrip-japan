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
  return `${dateTime(startIso)} · ${time(startIso)}–${time(endIso)} JST`;
}

export function StatusCard({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col gap-5 rounded-xl border border-navy/15 border-t-[3px] border-t-gold bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-serif text-2xl leading-snug sm:text-3xl">{title}</h2>
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
          <p className="text-sm text-navy/70">Please contact Connectrip Japan for a new interview booking link.</p>
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
        <StatusCard title="We couldn’t load the available times.">
          <p className="text-sm text-navy/70">Please try again in a moment.</p>
        </StatusCard>
      );
    case "requested":
      return (
        <StatusCard title="Interview Request Submitted">
          <p className="rounded-lg bg-cream px-4 py-4 text-base font-medium">{formatSlot(props.start, props.end)}</p>
          <p className="text-sm text-navy/70">
            We will send you a confirmation email once your interview has been approved.
          </p>
        </StatusCard>
      );
    case "confirmed":
      return (
        <StatusCard title="Your Interview Is Confirmed">
          <p className="rounded-lg bg-cream px-4 py-4 text-base font-medium">{formatSlot(props.start, props.end)}</p>
          <p className="text-sm text-navy/70">Please check your confirmation email for the Google Meet link. If it has not arrived, please contact Connectrip Japan.</p>
        </StatusCard>
      );
  }
}
