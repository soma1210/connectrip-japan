"use client";

import type { ReactNode } from "react";
import { trackBookingRequestStart, type BookingForm } from "./trackEvent";

/**
 * Counts `booking_request_start` the first time a visitor uses a booking form
 * that sits on the page (focus or press inside it). No box of its own
 * (`display: contents`), so the layout is unchanged.
 */
export function BookingStartTracker({ form, children }: { form: BookingForm; children: ReactNode }) {
  const start = () => trackBookingRequestStart(form);
  return (
    <div className="contents" onFocusCapture={start} onPointerDownCapture={start}>
      {children}
    </div>
  );
}
