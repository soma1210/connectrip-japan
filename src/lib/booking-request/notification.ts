import type { PrivateGuideBookingRequest } from "@/contracts/bookingRequest";
import { buildEmailBody, receivedAtLabel, type NotificationEmail } from "@/lib/notify/email";

/**
 * Staff email for a stored Private Guide booking request (2026-11-16).
 * Only fields the form collects. The request is not a booking: the status
 * line says so in the subject area and the body.
 */
export const BOOKING_STATUS_LINE = "Status: Booking Request Received — Not Confirmed";

const AREAS: Record<string, string> = { osaka: "Osaka", kyoto: "Kyoto", kobe: "Kobe", nara: "Nara", other: "Other" };
const INTERESTS: Record<string, string> = {
  food: "Food",
  local_neighborhoods: "Local neighborhoods",
  culture: "Culture",
  famous_sights: "Famous sights",
  shopping: "Shopping",
  family_activities: "Family activities",
  hidden_gems: "Hidden gems",
  other: "Other",
};
const LOCALES: Record<string, string> = { en: "English", ja: "Japanese", "zh-TW": "Traditional Chinese", ko: "Korean" };

const hours = (minutes: number) => `${minutes / 60} hours`;

export function bookingRequestEmail(booking: PrivateGuideBookingRequest, bookingRef: string, receivedAt: Date): NotificationEmail {
  const { text, html } = buildEmailBody(
    `New Booking Request ${bookingRef}`,
    [BOOKING_STATUS_LINE, "A request was submitted on the website. Nothing is booked or charged until the team confirms it."],
    [
      { label: "Request ID", value: bookingRef },
      { label: "Received at", value: receivedAtLabel(receivedAt) },
      { label: "Tour", value: "Private Guide (custom day)" },
      { label: "Preferred date", value: `${booking.date} ${booking.startTime}` },
      { label: "Duration", value: hours(booking.durationMinutes) },
      { label: "Alternative date", value: booking.alternateDate ? `${booking.alternateDate} ${booking.alternateStartTime ?? ""}`.trim() : "None" },
      { label: "Adults", value: booking.adults },
      { label: "Children", value: booking.children },
      { label: "Name", value: booking.name },
      { label: "Email", value: booking.email },
      { label: "Phone", value: booking.phone },
      { label: "Country", value: booking.country },
      { label: "Areas", value: booking.areas.map((a) => AREAS[a] ?? a).join(", ") },
      { label: "Interests", value: booking.interests.map((i) => INTERESTS[i] ?? i).join(", ") },
      { label: "Notes", value: booking.notes },
      { label: "Website language", value: LOCALES[booking.locale] ?? booking.locale },
    ],
    ["Reply to this email to answer the guest (Reply-To is the guest's address).", "The booking sheet is the record of this request; this email is a notification."],
  );
  return { subject: `[Connectrip Japan] New Booking Request (${bookingRef})`, text, html, replyTo: booking.email };
}
