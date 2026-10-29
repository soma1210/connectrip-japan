// Applicant-facing error codes and messages (English), shared by the API and
// the booking page. Calendar-related reasons are folded into one code so an
// applicant cannot tell a calendar event from another interview.

import type { SlotRejection } from "./availability";

export type ApplicantErrorCode =
  | "INVALID_TOKEN"
  | "EXPIRED"
  | "ALREADY_REQUESTED"
  | "INVALID_TIME"
  | "SLOT_UNAVAILABLE"
  | "TOO_SOON"
  | "WEEKEND"
  | "OUTSIDE_HOURS"
  | "TOO_FAR"
  | "UNAVAILABLE"
  | "RATE_LIMITED";

export const APPLICANT_MESSAGES: Record<ApplicantErrorCode, string> = {
  INVALID_TOKEN: "This booking link is not valid. Please check the link in your email.",
  EXPIRED: "This booking link has expired. Please contact Connectrip Japan for a new link.",
  ALREADY_REQUESTED: "An interview has already been requested with this link.",
  INVALID_TIME: "Please choose a time from the list.",
  SLOT_UNAVAILABLE: "This time is no longer available. Please choose another time.",
  TOO_SOON: "Interviews must be requested at least 24 hours in advance. Please choose a later time.",
  WEEKEND: "Interviews are available Monday to Friday only.",
  OUTSIDE_HOURS: "Interviews are available between 10:00 and 21:00 (Japan Time).",
  TOO_FAR: "Please choose a time within the next 14 days.",
  UNAVAILABLE: "Booking is temporarily unavailable. Please try again later.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
};

export function applicantCodeFor(code: SlotRejection | ApplicantErrorCode): ApplicantErrorCode {
  switch (code) {
    case "CALENDAR_BUSY":
    case "INTERVIEW_CONFLICT":
    case "DAY_FULL":
      return "SLOT_UNAVAILABLE";
    case "NOT_ALIGNED":
      return "INVALID_TIME";
    default:
      return code;
  }
}
