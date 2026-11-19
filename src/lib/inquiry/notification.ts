import { buildEmailBody, receivedAtLabel, type NotificationEmail } from "@/lib/notify/email";
import type { InquiryRecord } from "./rules";

// Staff email for a stored contact inquiry. Moved from handler.ts (2026-11-16) so the outbox can rebuild it from the saved row.

const AREAS: Record<string, string> = { osaka: "Osaka", kyoto: "Kyoto", kobe: "Kobe", nara: "Nara", other: "Other" };
const ACTIVITIES: Record<string, string> = {
  food: "Food",
  local_neighborhoods: "Local neighborhoods",
  culture: "Culture",
  famous_sights: "Famous sights",
  shopping: "Shopping",
  family_activities: "Family activities",
  hidden_gems: "Hidden gems",
  other: "Other",
};

/** Staff email for one stored inquiry: the form's own fields, labelled as on the page. */
export function inquiryEmail(i: InquiryRecord, inquiryRef: string, receivedAt: Date): NotificationEmail {
  const { text, html } = buildEmailBody(
    `New Contact Inquiry ${inquiryRef}`,
    ["An inquiry was submitted on the website (Inquiry page, Private Guide). It is a question, not a booking request."],
    [
      { label: "Inquiry ID", value: inquiryRef },
      { label: "Received at", value: receivedAtLabel(receivedAt) },
      { label: "Category", value: "Private Guide inquiry" },
      { label: "Name", value: i.name },
      { label: "Email", value: i.email },
      { label: "Preferred date", value: i.preferredDate },
      { label: "Adults", value: i.adults },
      { label: "Children", value: i.children },
      { label: "Where would you like to go?", value: i.destinations.map((d) => AREAS[d] ?? d).join(", ") },
      { label: "What would you like to do?", value: i.activities.map((a) => ACTIVITIES[a] ?? a).join(", ") },
      { label: "Places you already want to visit", value: i.placesToVisit },
      { label: "Your ideal day in Kansai", value: i.idealDay },
      { label: "Anything we should know?", value: i.notes },
    ],
    ["Reply to this email to answer the visitor (Reply-To is the visitor's address).", "The Inquiries sheet is the record of this inquiry; this email is a notification."],
  );
  return { subject: `[Connectrip Japan] New Contact Inquiry (${inquiryRef})`, text, html, replyTo: i.email };
}
