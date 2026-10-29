// Interview booking flows, shared by the API routes and the admin Server
// Actions: what an applicant sees, slot requests, and admin approval with its
// Google Calendar / Meet side effects.
//
// Privacy: nothing returned to applicants comes from Google Calendar except
// which start times are free. The Meet URL never leaves through applicant
// endpoints — it is sent only in the confirmation email.

import {
  availableSlots,
  bookingWindow,
  checkApproval,
  checkSlot,
  fromJst,
  jstDate,
  type DaySlots,
  type Interval,
  type SlotRejection,
} from "@/features/guide-interviews/availability";
import {
  CalendarApiError,
  CalendarAuthError,
  MeetCreationError,
  createInterviewEvent,
  deleteInterviewEvent,
  getBusyIntervals,
  newInterviewEventId,
} from "@/lib/google-calendar";
import {
  InterviewStateError,
  SlotRejectedError,
  cancelInterview,
  claimForApproval,
  confirmInterview,
  createInvitation,
  getInterview,
  getInterviewByToken,
  holdSlot,
  listHeldIntervals,
  markEmailSent,
  rejectInterview,
  releaseApproval,
} from "@/lib/data/guide-interviews";
import {
  sendConfirmationEmail,
  sendInvitationEmail,
  sendRejectionEmail,
  sendRequestNoticeToAdmin,
} from "@/lib/interview-email";
import type { GuideInterview } from "@/features/guide-interviews/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The site origin used in links we email. Prefer the configured public URL over the request's. */
export function publicBaseUrl(requestOrigin: string): string {
  return (process.env.INTERVIEW_PUBLIC_BASE_URL || requestOrigin).replace(/\/+$/, "");
}

export const bookingUrl = (baseUrl: string, token: string) => `${baseUrl}/interview/${token}`;
const adminApplicationUrl = (baseUrl: string, applicationId: string) =>
  `${baseUrl}/admin/guide-applications/${applicationId}`;

function dayInterval(date: string): Interval {
  const start = fromJst(date, "00:00")!;
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

// --- applicant ---------------------------------------------------------------

/** What the booking page shows for a token. Holds only the applicant's own data. */
export type ApplicantView =
  | { state: "invalid" }
  | { state: "expired" }
  | { state: "closed" }
  | { state: "choose"; name: string; expiresAt: string }
  | { state: "requested"; name: string; start: string; end: string }
  | { state: "confirmed"; name: string; start: string; end: string };

function viewOf(interview: GuideInterview & { applicant_name: string }, now = new Date()): ApplicantView {
  const name = interview.applicant_name;
  switch (interview.status) {
    case "INVITED":
      return new Date(interview.token_expires_at) <= now
        ? { state: "expired" }
        : { state: "choose", name, expiresAt: interview.token_expires_at };
    case "PENDING_APPROVAL":
    case "APPROVING":
      return { state: "requested", name, start: interview.requested_start_at!, end: interview.requested_end_at! };
    case "CONFIRMED":
      return { state: "confirmed", name, start: interview.requested_start_at!, end: interview.requested_end_at! };
    default:
      return { state: "closed" };
  }
}

export async function getApplicantView(token: string): Promise<ApplicantView> {
  const interview = await getInterviewByToken(token);
  return interview ? viewOf(interview) : { state: "invalid" };
}

/** Bookable slots for a token in the "choose" state. Dates and start times only. */
export async function getAvailability(
  token: string,
): Promise<{ view: ApplicantView; days: DaySlots[] }> {
  const view = await getApplicantView(token);
  if (view.state !== "choose") return { view, days: [] };

  const now = new Date();
  const window = bookingWindow(now);
  const [calendarBusy, heldInterviews] = await Promise.all([getBusyIntervals(window), listHeldIntervals(window)]);
  return { view, days: availableSlots({ now, calendarBusy, heldInterviews }) };
}

export type RequestResult =
  | { ok: true; view: ApplicantView }
  | { ok: false; code: "INVALID_TOKEN" | "EXPIRED" | "ALREADY_REQUESTED" | "INVALID_TIME" | SlotRejection };

/**
 * Hold the chosen slot: INVITED → PENDING_APPROVAL. Every rule is checked
 * again here; the slot list the applicant saw may be stale.
 */
export async function requestInterview(
  token: string,
  date: string,
  time: string,
  requestOrigin: string,
): Promise<RequestResult> {
  const start = fromJst(date, time);
  if (!start) return { ok: false, code: "INVALID_TIME" };

  const view = await getApplicantView(token);
  if (view.state === "invalid" || view.state === "closed") return { ok: false, code: "INVALID_TOKEN" };
  if (view.state === "expired") return { ok: false, code: "EXPIRED" };
  if (view.state !== "choose") return { ok: false, code: "ALREADY_REQUESTED" };

  // Cheap rules first, so a weekend or too-soon request never reaches Google.
  const now = new Date();
  const basic = checkSlot(start, { now, calendarBusy: [], heldInterviews: [] });
  if (basic) return { ok: false, code: basic };

  const calendarBusy = await getBusyIntervals(dayInterval(jstDate(start)));

  let interview: GuideInterview;
  try {
    interview = await holdSlot(token, start, (heldThatDay) =>
      checkSlot(start, { now: new Date(), calendarBusy, heldInterviews: heldThatDay }),
    );
  } catch (error) {
    if (error instanceof SlotRejectedError) return { ok: false, code: error.reason };
    if (error instanceof InterviewStateError) {
      if (error.code === "EXPIRED") return { ok: false, code: "EXPIRED" };
      if (error.code === "ALREADY_REQUESTED") return { ok: false, code: "ALREADY_REQUESTED" };
      return { ok: false, code: "INVALID_TOKEN" };
    }
    throw error;
  }

  await sendRequestNoticeToAdmin({
    name: view.name,
    start,
    end: new Date(interview.requested_end_at!),
    adminUrl: adminApplicationUrl(publicBaseUrl(requestOrigin), interview.guide_application_id),
  });

  return {
    ok: true,
    view: { state: "requested", name: view.name, start: interview.requested_start_at!, end: interview.requested_end_at! },
  };
}

// --- admin -------------------------------------------------------------------

export type AdminFailureCode =
  | "NOT_FOUND"
  | "WRONG_STATUS"
  | "OPEN_INTERVIEW_EXISTS"
  | "SLOT_UNAVAILABLE"
  | "IN_PAST"
  | "CALENDAR_AUTH"
  | "CALENDAR_ERROR"
  | "MEET_FAILED"
  | "DB_FAILED";

export type AdminResult<T = object> = ({ ok: true } & T) | { ok: false; code: AdminFailureCode };

function adminFailure(error: unknown): { ok: false; code: AdminFailureCode } {
  if (error instanceof InterviewStateError) {
    if (error.code === "NOT_FOUND") return { ok: false, code: "NOT_FOUND" };
    if (error.code === "OPEN_INTERVIEW_EXISTS") return { ok: false, code: "OPEN_INTERVIEW_EXISTS" };
    return { ok: false, code: "WRONG_STATUS" };
  }
  if (error instanceof CalendarAuthError) return { ok: false, code: "CALENDAR_AUTH" };
  if (error instanceof MeetCreationError) return { ok: false, code: "MEET_FAILED" };
  if (error instanceof CalendarApiError) return { ok: false, code: "CALENDAR_ERROR" };
  console.error("[interviews] unexpected error", error);
  return { ok: false, code: "DB_FAILED" };
}

/** Issue (or reissue) a booking link and email it. The link is returned so the admin can copy it. */
export async function issueInvitation(
  applicationId: string,
  requestOrigin: string,
): Promise<AdminResult<{ link: string; emailSent: boolean }>> {
  try {
    const { interview, token } = await createInvitation(applicationId);
    const link = bookingUrl(publicBaseUrl(requestOrigin), token);
    const email = await sendInvitationEmail({
      to: interview.applicant_email,
      name: interview.applicant_name,
      bookingUrl: link,
      expiresAt: new Date(interview.token_expires_at),
    });
    if (email.sent) await markEmailSent(interview.id, "invitation");
    return { ok: true, link, emailSent: email.sent };
  } catch (error) {
    return adminFailure(error);
  }
}

/**
 * Approve a requested interview.
 *
 *  1. Claim it (PENDING_APPROVAL → APPROVING) with the event id we will use.
 *  2. Re-check Google Calendar and the other held interviews.
 *  3. Create the calendar event with Google Meet.
 *  4. Save CONFIRMED + Meet URL (and move the application to 面談予定).
 *  5. Email the applicant. An email failure does not undo the approval.
 *
 * Any failure in 2–4 deletes the event (if created) and puts the interview
 * back to PENDING_APPROVAL, so the calendar and the database never disagree.
 */
export async function approveInterview(id: string): Promise<AdminResult<{ emailSent: boolean }>> {
  const eventId = newInterviewEventId();
  let claimed;
  try {
    claimed = await claimForApproval(id, eventId);
  } catch (error) {
    return adminFailure(error);
  }
  const { interview, previousEventId } = claimed;
  const start = new Date(interview.requested_start_at!);
  const end = new Date(interview.requested_end_at!);

  let eventCreated = false;
  try {
    // An abandoned earlier attempt may have left its event behind; it would show up as busy.
    if (previousEventId) await deleteInterviewEvent(previousEventId);

    const now = new Date();
    const day = dayInterval(jstDate(start));
    const [calendarBusy, heldInterviews] = await Promise.all([
      getBusyIntervals(day),
      listHeldIntervals(day, interview.id),
    ]);
    const conflict = checkApproval(start, { now, calendarBusy, heldInterviews });
    if (conflict) {
      await releaseApproval(interview.id);
      return { ok: false, code: conflict === "IN_PAST" ? "IN_PAST" : "SLOT_UNAVAILABLE" };
    }

    eventCreated = true; // from here on, clean up the event on failure (deleting a missing event is fine)
    const { meetUrl } = await createInterviewEvent({
      eventId,
      start,
      end,
      summary: `Connectrip ガイド面談：${interview.applicant_name}`,
      description: "Connectrip Admin で承認したガイド応募者との面談です。",
    });

    await confirmInterview(interview.id, eventId, meetUrl);

    const email = await sendConfirmationEmail({
      to: interview.applicant_email,
      name: interview.applicant_name,
      start,
      end,
      meetUrl,
    });
    if (email.sent) await markEmailSent(interview.id, "confirmation").catch(() => {});
    return { ok: true, emailSent: email.sent };
  } catch (error) {
    console.error("[interviews] approval failed, rolling back", { id: interview.id }, error);
    if (eventCreated) {
      await deleteInterviewEvent(eventId).catch((cleanupError) =>
        // Left as APPROVING with this event id: the next approval attempt deletes it first.
        console.error("[interviews] could not delete the event after a failed approval", cleanupError),
      );
    }
    await releaseApproval(interview.id).catch((releaseError) =>
      console.error("[interviews] could not release the approval", releaseError),
    );
    const failure = adminFailure(error);
    return failure.code === "WRONG_STATUS" ? { ok: false, code: "DB_FAILED" } : failure;
  }
}

/** Resend the confirmation email for a confirmed interview. */
export async function resendConfirmation(id: string): Promise<AdminResult<{ emailSent: boolean }>> {
  const interview = await getInterview(id);
  if (!interview) return { ok: false, code: "NOT_FOUND" };
  if (interview.status !== "CONFIRMED" || !interview.meet_url) return { ok: false, code: "WRONG_STATUS" };
  const email = await sendConfirmationEmail({
    to: interview.applicant_email,
    name: interview.applicant_name,
    start: new Date(interview.requested_start_at!),
    end: new Date(interview.requested_end_at!),
    meetUrl: interview.meet_url,
  });
  if (email.sent) await markEmailSent(interview.id, "confirmation");
  return { ok: true, emailSent: email.sent };
}

/** PENDING_APPROVAL → REJECTED, optionally telling the applicant. */
export async function rejectInterviewRequest(
  id: string,
  reason: string | null,
  notifyApplicant: boolean,
): Promise<AdminResult<{ emailSent: boolean }>> {
  try {
    const interview = await rejectInterview(id, reason);
    if (!notifyApplicant) return { ok: true, emailSent: false };
    const email = await sendRejectionEmail({
      to: interview.applicant_email,
      name: interview.applicant_name,
      start: new Date(interview.requested_start_at!),
      end: new Date(interview.requested_end_at!),
    });
    return { ok: true, emailSent: email.sent };
  } catch (error) {
    return adminFailure(error);
  }
}

/**
 * Cancel an invitation, a request or a confirmed interview. For a confirmed
 * one the calendar event is deleted too; if that fails the admin is told to
 * delete it by hand (the database is already CANCELLED, which frees the slot).
 */
export async function cancelInterviewByAdmin(
  id: string,
  reason: string | null,
): Promise<AdminResult<{ calendarEventLeft: boolean }>> {
  try {
    const interview = await cancelInterview(id, reason);
    if (!interview.google_event_id || !interview.meet_url) return { ok: true, calendarEventLeft: false };
    try {
      await deleteInterviewEvent(interview.google_event_id);
      return { ok: true, calendarEventLeft: false };
    } catch (error) {
      console.error("[interviews] cancelled, but the calendar event could not be deleted", error);
      return { ok: true, calendarEventLeft: true };
    }
  } catch (error) {
    return adminFailure(error);
  }
}

/** "Ask for another time": cancel the current request and send a fresh booking link. */
export async function requestAnotherTime(
  id: string,
  requestOrigin: string,
): Promise<AdminResult<{ link: string; emailSent: boolean }>> {
  const interview = await getInterview(id);
  if (!interview) return { ok: false, code: "NOT_FOUND" };
  if (interview.status !== "PENDING_APPROVAL") return { ok: false, code: "WRONG_STATUS" };
  const cancelled = await cancelInterviewByAdmin(id, "別の時間を依頼");
  if (!cancelled.ok) return cancelled;
  return issueInvitation(interview.guide_application_id, requestOrigin);
}
