// Google Calendar access for interview booking (server only).
//
// Uses the interviewer's own Google account through an OAuth 2.0 refresh
// token, with two narrow scopes:
//   calendar.freebusy     busy start/end times only, never event details
//   calendar.events.owned create and delete the interview events we make
// Nothing here reads titles, descriptions, locations or attendees of other
// events, and nothing returned from this module carries them.
//
// Get a refresh token with scripts/google-calendar-auth.mjs.

import { randomUUID } from "node:crypto";
import type { Interval } from "@/features/guide-interviews/availability";
import { INTERVIEW_TIME_ZONE } from "@/features/guide-interviews/rules";

const {
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_CALENDAR_REFRESH_TOKEN,
  GOOGLE_CALENDAR_ID,
} = process.env;

const CALENDAR_ID = GOOGLE_CALENDAR_ID || "primary";
const API = "https://www.googleapis.com/calendar/v3";
const REQUEST_TIMEOUT_MS = 8_000;
/** How long to wait for Google Meet to finish creating the conference. */
const MEET_POLL_ATTEMPTS = 5;
const MEET_POLL_DELAY_MS = 600;

export const isCalendarConfigured = Boolean(
  GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_CALENDAR_REFRESH_TOKEN,
);

/** Not configured, or the refresh token was revoked / expired: someone must reconnect the calendar. */
export class CalendarAuthError extends Error {}
/** Google answered with an error, or did not answer in time. */
export class CalendarApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}
/** The event was created but Google Meet could not be attached. */
export class MeetCreationError extends Error {}

// --- access token ------------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (!isCalendarConfigured) throw new CalendarAuthError("Google Calendar is not configured.");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  let response: Response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET!,
        refresh_token: GOOGLE_CALENDAR_REFRESH_TOKEN!,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new CalendarApiError(`Token request failed: ${(error as Error).message}`);
  }

  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!response.ok || !body.access_token) {
    // invalid_grant: the refresh token was revoked or has expired.
    if (body.error === "invalid_grant" || body.error === "invalid_client" || body.error === "unauthorized_client") {
      throw new CalendarAuthError(`Google rejected the calendar credentials (${body.error}).`);
    }
    throw new CalendarApiError(`Token request failed (${response.status} ${body.error ?? ""}).`, response.status);
  }

  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return body.access_token;
}

async function calendarFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new CalendarApiError(`Calendar request failed: ${(error as Error).message}`);
  }
  if (response.status === 401) {
    cachedToken = null;
    throw new CalendarAuthError("Google Calendar access was denied (401).");
  }
  return response;
}

// --- FreeBusy ----------------------------------------------------------------

/** Busy intervals on the interviewer's calendar. Start and end times only. */
export async function getBusyIntervals(window: Interval): Promise<Interval[]> {
  const response = await calendarFetch("/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: window.start.toISOString(),
      timeMax: window.end.toISOString(),
      timeZone: INTERVIEW_TIME_ZONE,
      items: [{ id: CALENDAR_ID }],
    }),
  });
  if (!response.ok) throw new CalendarApiError(`FreeBusy failed (${response.status}).`, response.status);

  const body = (await response.json()) as {
    calendars?: Record<string, { busy?: { start: string; end: string }[]; errors?: { reason: string }[] }>;
  };
  // The response is keyed by the calendar id as given ("primary" stays "primary").
  const calendar = body.calendars?.[CALENDAR_ID];
  if (!calendar || calendar.errors?.length) {
    throw new CalendarApiError(`FreeBusy returned no data (${calendar?.errors?.[0]?.reason ?? "missing calendar"}).`);
  }
  return (calendar.busy ?? []).map((busy) => ({ start: new Date(busy.start), end: new Date(busy.end) }));
}

// --- interview events --------------------------------------------------------

interface EventResource {
  id: string;
  status?: string;
  hangoutLink?: string;
  conferenceData?: {
    createRequest?: { status?: { statusCode?: "pending" | "success" | "failure" } };
    entryPoints?: { entryPointType?: string; uri?: string }[];
  };
}

function meetUrlOf(event: EventResource): string | null {
  return (
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ??
    null
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A fresh event id. Google accepts base32hex (0-9, a-v), 5–1024 characters;
 * hex digits are a subset. Stored before the event is created so a retry or a
 * crash can always find (and clean up) the event.
 */
export function newInterviewEventId(): string {
  return `ctint${randomUUID().replace(/-/g, "")}`;
}

async function getEvent(eventId: string): Promise<EventResource | null> {
  const response = await calendarFetch(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`,
  );
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) throw new CalendarApiError(`Event lookup failed (${response.status}).`, response.status);
  return (await response.json()) as EventResource;
}

/**
 * Create the interview event with a Google Meet conference on the
 * interviewer's calendar. The applicant is not added as an attendee and
 * Google sends no invitations: the Meet URL reaches the applicant only
 * through Connectrip's confirmation email.
 *
 * Idempotent per eventId: if the event already exists (a retried approval),
 * it is reused. Throws MeetCreationError when the conference cannot be
 * created — the caller then deletes the event.
 */
export async function createInterviewEvent(params: {
  eventId: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
}): Promise<{ eventId: string; meetUrl: string }> {
  const response = await calendarFetch(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events?conferenceDataVersion=1&sendUpdates=none`,
    {
      method: "POST",
      body: JSON.stringify({
        id: params.eventId,
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.start.toISOString(), timeZone: INTERVIEW_TIME_ZONE },
        end: { dateTime: params.end.toISOString(), timeZone: INTERVIEW_TIME_ZONE },
        visibility: "private",
        conferenceData: {
          createRequest: { requestId: params.eventId, conferenceSolutionKey: { type: "hangoutsMeet" } },
        },
      }),
    },
  );

  let event: EventResource | null;
  if (response.status === 409) {
    // Already created by an earlier attempt with the same id.
    event = await getEvent(params.eventId);
  } else if (!response.ok) {
    throw new CalendarApiError(`Event creation failed (${response.status}).`, response.status);
  } else {
    event = (await response.json()) as EventResource;
  }
  if (!event || event.status === "cancelled") {
    throw new CalendarApiError("Event creation failed (event missing or cancelled).");
  }

  for (let attempt = 0; ; attempt++) {
    const meetUrl = meetUrlOf(event);
    if (meetUrl) return { eventId: event.id, meetUrl };

    const statusCode = event.conferenceData?.createRequest?.status?.statusCode;
    if (statusCode === "failure" || attempt >= MEET_POLL_ATTEMPTS) {
      throw new MeetCreationError(`Google Meet was not created (${statusCode ?? "no conference"}).`);
    }
    await sleep(MEET_POLL_DELAY_MS);
    event = await getEvent(params.eventId);
    if (!event) throw new CalendarApiError("Event disappeared while waiting for Google Meet.");
  }
}

/** Delete an interview event. Missing or already-deleted events count as deleted. */
export async function deleteInterviewEvent(eventId: string): Promise<void> {
  const response = await calendarFetch(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    { method: "DELETE" },
  );
  if (response.ok || response.status === 404 || response.status === 410) return;
  throw new CalendarApiError(`Event deletion failed (${response.status}).`, response.status);
}
