"use client";

// Applicant booking flow: choose a date → choose a time → confirm → submitted.
// Talks to /api/interviews/availability and /api/interviews/request; both only
// ever return free start times and the applicant's own request.

import { useCallback, useEffect, useState } from "react";
import type { DaySlots } from "@/features/guide-interviews/availability";
import { APPLICANT_MESSAGES } from "@/features/guide-interviews/messages";
import { BookingCalendar } from "./BookingCalendar";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { InterviewStatus, formatSlot } from "./InterviewStatus";

type View =
  | { state: "invalid" | "expired" | "closed" }
  | { state: "choose"; name: string; expiresAt: string }
  | { state: "requested" | "confirmed"; name: string; start: string; end: string };

type Step = "choose" | "confirm";

const JST_OFFSET = "+09:00";

/** The slot in the visitor's own time zone, when that differs from Japan time. */
function localTimeNote(date: string, time: string): string | null {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!zone || zone === "Asia/Tokyo") return null;
  const start = new Date(`${date}T${time}:00${JST_OFFSET}`);
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(start);
  return `Your local time: ${formatted}`;
}

const isoAt = (date: string, time: string, plusMinutes = 0) =>
  new Date(new Date(`${date}T${time}:00${JST_OFFSET}`).getTime() + plusMinutes * 60_000).toISOString();

export function BookingFlow({ token, name }: { token: string; name: string }) {
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("choose");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalView, setFinalView] = useState<View | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const loadSlots = useCallback(async () => {
    try {
      const response = await fetch("/api/interviews/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 404) setFinalView({ state: "invalid" });
        else setUnavailable(true);
        return;
      }
      if (body.view.state !== "choose") {
        setFinalView(body.view as View);
        return;
      }
      const loaded = body.days as DaySlots[];
      setDays(loaded);
      // Keep the chosen date if it still has slots, otherwise start at the first one.
      setDate((current) => (current && loaded.some((d) => d.date === current) ? current : loaded[0]?.date ?? null));
    } catch {
      setUnavailable(true);
    }
  }, [token]);

  useEffect(() => {
    // Fetch on mount; the setState calls happen after the await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSlots();
  }, [loadSlots]);

  async function submit() {
    if (!date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/interviews/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, date, time }),
      });
      const body = await response.json();
      if (response.ok) {
        setFinalView(body.view as View);
        return;
      }
      setError(body.message ?? APPLICANT_MESSAGES.UNAVAILABLE);
      if (body.code === "ALREADY_REQUESTED" || body.code === "EXPIRED" || body.code === "INVALID_TOKEN") {
        await loadSlots();
        return;
      }
      // The slot was taken or breaks a rule: show fresh slots and let them pick again.
      setTime(null);
      setStep("choose");
      await loadSlots();
    } catch {
      setError(APPLICANT_MESSAGES.UNAVAILABLE);
    } finally {
      setSubmitting(false);
    }
  }

  if (finalView) {
    if (finalView.state === "requested" || finalView.state === "confirmed") {
      return <InterviewStatus state={finalView.state} start={finalView.start} end={finalView.end} />;
    }
    if (finalView.state !== "choose") return <InterviewStatus state={finalView.state} />;
  }
  if (unavailable) return <InterviewStatus state="unavailable" />;

  const slots = days?.find((d) => d.date === date)?.slots ?? [];

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-navy/15 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm">Hello {name},</p>
        <p className="text-sm text-navy/70">
          Please choose a time for your 30-minute online interview. All times are shown in Japan Time (JST).
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red/5 px-3 py-2 text-sm text-red">
          {error}
        </p>
      ) : null}

      {days === null ? (
        <p className="text-sm text-navy/60">Loading available times…</p>
      ) : days.length === 0 ? (
        <p className="text-sm text-navy/70">
          There are no available times in the next 14 days. Please contact Connectrip Japan.
        </p>
      ) : step === "choose" ? (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">1. Date</h2>
            <BookingCalendar
              days={days}
              selected={date}
              onSelect={(next) => {
                setDate(next);
                setTime(null);
              }}
            />
          </section>
          {date ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">2. Start time (JST)</h2>
              <TimeSlotPicker slots={slots} selected={time} onSelect={setTime} />
            </section>
          ) : null}
          <button
            type="button"
            disabled={!date || !time}
            onClick={() => {
              setError(null);
              setStep("confirm");
            }}
            className="h-11 rounded-md bg-navy text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-40"
          >
            Continue
          </button>
        </>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">3. Confirm your request</h2>
          <div className="rounded-md bg-navy/[0.04] px-4 py-3">
            <p className="text-sm font-medium">{formatSlot(isoAt(date!, time!), isoAt(date!, time!, 30))}</p>
            {localTimeNote(date!, time!) ? (
              <p className="mt-1 text-xs text-navy/60">{localTimeNote(date!, time!)}</p>
            ) : null}
          </div>
          <p className="text-xs text-navy/60">
            This is a request. Your interview is confirmed once we approve it, and we will then email you the Google Meet link.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("choose")}
              disabled={submitting}
              className="h-11 flex-1 rounded-md border border-navy/20 bg-white text-sm hover:border-navy/50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="h-11 flex-[2] rounded-md bg-navy text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Request this interview"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
