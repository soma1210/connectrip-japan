// Response helpers shared by the /api/interviews routes.

import { NextResponse } from "next/server";
import { CalendarApiError, CalendarAuthError } from "@/lib/google-calendar";
import { InterviewStorageUnavailableError } from "@/lib/data/guide-interviews";
import { APPLICANT_MESSAGES, type ApplicantErrorCode } from "@/features/guide-interviews/messages";
import type { AdminFailureCode } from "@/lib/interviews";

const APPLICANT_STATUS: Record<ApplicantErrorCode, number> = {
  INVALID_TOKEN: 404,
  EXPIRED: 410,
  ALREADY_REQUESTED: 409,
  INVALID_TIME: 422,
  SLOT_UNAVAILABLE: 409,
  TOO_SOON: 422,
  WEEKEND: 422,
  OUTSIDE_HOURS: 422,
  TOO_FAR: 422,
  UNAVAILABLE: 503,
  RATE_LIMITED: 429,
};

export function applicantError(code: ApplicantErrorCode) {
  return NextResponse.json(
    { success: false, code, message: APPLICANT_MESSAGES[code] },
    { status: APPLICANT_STATUS[code] },
  );
}

/**
 * Calendar or storage trouble on an applicant endpoint: log the detail, tell
 * the applicant only that booking is unavailable for now.
 */
export function applicantFailure(scope: string, error: unknown) {
  if (error instanceof CalendarAuthError) {
    console.error(`[interviews] ${scope}: Google Calendar needs reconnecting`, error.message);
  } else if (error instanceof CalendarApiError || error instanceof InterviewStorageUnavailableError) {
    console.error(`[interviews] ${scope}: unavailable`, error.message);
  } else {
    console.error(`[interviews] ${scope}: failed`, error);
  }
  return applicantError("UNAVAILABLE");
}

const ADMIN_STATUS: Record<AdminFailureCode, number> = {
  NOT_FOUND: 404,
  WRONG_STATUS: 409,
  OPEN_INTERVIEW_EXISTS: 409,
  SLOT_UNAVAILABLE: 409,
  IN_PAST: 409,
  CALENDAR_AUTH: 503,
  CALENDAR_ERROR: 502,
  MEET_FAILED: 502,
  DB_FAILED: 500,
};

export function adminError(code: AdminFailureCode, message: string) {
  return NextResponse.json({ success: false, code, message }, { status: ADMIN_STATUS[code] });
}
