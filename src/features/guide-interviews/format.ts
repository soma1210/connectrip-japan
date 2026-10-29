// Admin-facing (Japanese) date display for interviews, always in Japan time.

import { INTERVIEW_TIME_ZONE } from "./rules";

const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: INTERVIEW_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});
const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: INTERVIEW_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

/** "2026/11/5(木) 14:00〜14:30" */
export function formatInterviewRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  return `${dateFormat.format(start)} ${timeFormat.format(start)}〜${timeFormat.format(new Date(endIso))}`;
}
