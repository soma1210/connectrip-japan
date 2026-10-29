export const INTERVIEW_STATUSES = [
  "INVITED",
  "PENDING_APPROVAL",
  "APPROVING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
] as const;

export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

/** Statuses that hold a time slot: counted for the daily limit and blocked for everyone else. */
export const HELD_STATUSES = ["PENDING_APPROVAL", "APPROVING", "CONFIRMED"] as const satisfies readonly InterviewStatus[];

/** Statuses that keep an application's single open interview. */
export const OPEN_STATUSES = ["INVITED", ...HELD_STATUSES] as const satisfies readonly InterviewStatus[];

/** A guide_interviews row as the admin screens see it. Timestamps are ISO strings. */
export interface GuideInterview {
  id: string;
  guide_application_id: string;
  interviewer: string;
  status: InterviewStatus;
  status_reason: string | null;
  token_expires_at: string;
  requested_start_at: string | null;
  requested_end_at: string | null;
  requested_at: string | null;
  google_event_id: string | null;
  meet_url: string | null;
  invitation_email_sent_at: string | null;
  confirmation_email_sent_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

/** An interview together with the applicant it belongs to. */
export interface GuideInterviewWithApplicant extends GuideInterview {
  applicant_name: string;
  applicant_email: string;
}

/** Admin-facing labels. */
export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  INVITED: "予約待ち（案内済み）",
  PENDING_APPROVAL: "承認待ち",
  APPROVING: "承認処理中",
  CONFIRMED: "面談確定",
  REJECTED: "却下",
  CANCELLED: "キャンセル",
  COMPLETED: "面談済み",
};
