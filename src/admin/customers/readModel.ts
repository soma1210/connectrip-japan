import type { BookingInterest, PaymentRecord, PrivateGuideBookingRecord, SelfReportedSource } from "@/contracts";

/**
 * Admin presentation read model for Phase A.
 *
 * Mock-backed. Screens call the `getAdmin*` functions only. A later Core/API
 * adapter can replace the fixture projector without changing the screens.
 *
 * This is not a domain model and not a database schema. Shared contracts are
 * referenced, not redefined: booking and payment codes come from those types.
 * Inquiry codes exist only here because they are not in the shared contracts yet.
 */

export type AdminBookingStatus = PrivateGuideBookingRecord["bookingStatus"];
export type AdminPaymentStatus = PaymentRecord["paymentStatus"];

/**
 * PROVISIONAL ADMIN READ MODEL.
 * Shown in Admin only. Not a shared contract, database status, or business rule.
 */
export type AdminInquiryStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "PROPOSAL_SENT"
  | "ACCEPTED"
  | "CONVERTED"
  | "CLOSED";

export type AdminTimelineLabel =
  | "Inquiry Created"
  | "Booking Created"
  | "Payment Received"
  | "Planner Submitted"
  | "Guide Assigned"
  | "Booking Confirmed"
  | "Tour Completed";

export type AdminListStatus =
  | { kind: "booking"; status: AdminBookingStatus }
  | { kind: "inquiry"; status: AdminInquiryStatus };

export type AdminCustomerListItem = {
  customerId: string;
  fullName: string;
  email: string;
  countryCode: string;
  countryName: string;
  lastActivityAt: string | null;
  bookingCount: number;
  inquiryCount: number;
  /** Sum of payment rows with status `paid`. Refunded rows are not subtracted. Display rule only. */
  totalRevenueJpy: number;
  currentStatus: AdminListStatus | null;
  /** Earliest booking's sources. Later bookings stay on the detail. */
  acquisition: {
    selfReported: SelfReportedSource | null;
    measured: string | null;
    additionalBookingCount: number;
  } | null;
};

export type AdminCustomerDetail = {
  profile: {
    customerId: string;
    fullName: string;
    email: string;
    countryCode: string;
    countryName: string;
  };
  bookings: AdminBookingRow[];
  inquiries: AdminInquiryRow[];
  trips: AdminTripRow[];
  payments: AdminPaymentRow[];
  timeline: AdminTimelineEvent[];
  plans: AdminCustomerPlanRow[];
};

export type AdminCustomerPlanRow = {
  planId: string;
  bookingId: string;
  plannerStatus: AdminPlannerStatus;
  planningStatus: AdminPlanningStatus;
};

export type AdminBookingRow = {
  bookingId: string;
  service: PrivateGuideBookingRecord["service"];
  planName: string;
  bookingDate: string;
  startTime: string;
  adults: number;
  children: number;
  bookingStatus: AdminBookingStatus;
  paymentStatuses: AdminPaymentStatus[];
  totalJpy: number;
  selfReported: SelfReportedSource | null;
  measured: string | null;
};

export type AdminInquiryRow = {
  inquiryId: string;
  summary: string;
  status: AdminInquiryStatus;
  createdAt: string;
};

export type AdminTripRow = {
  bookingId: string;
  arriving: string;
  leaving: string;
  interests: BookingInterest[];
  tripDescription: string | null;
};

export type AdminPaymentRow = {
  paymentId: string;
  bookingId: string;
  paymentStatus: AdminPaymentStatus;
  amountJpy: number;
  occurredAt: string | null;
};

export type AdminTimelineEvent = {
  id: string;
  at: string;
  label: AdminTimelineLabel;
  detail: string;
};

const SELF_REPORTED_LABEL: Record<SelfReportedSource, string> = {
  google: "Google",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  ai_chatgpt: "AI / ChatGPT",
  friend_family: "Friend or Family",
  travel_agent: "Travel Agent",
  hotel: "Hotel",
  other: "Other",
};

const INTEREST_LABEL: Record<BookingInterest, string> = {
  food_dining: "Food & Dining",
  culture_heritage: "Culture & Heritage",
  shopping: "Shopping",
  famous_sights: "Famous Sights",
  hidden_gems: "Hidden Gems",
  local_neighborhoods: "Local Neighborhoods",
  family_activities: "Family Activities",
  active_experiences: "Active Experiences",
  other: "Other",
};

export function selfReportedLabel(source: SelfReportedSource) {
  return SELF_REPORTED_LABEL[source];
}

export function interestLabel(interest: BookingInterest) {
  return INTEREST_LABEL[interest];
}

type FixtureCustomer = AdminCustomerDetail["profile"];

type FixtureBooking = {
  bookingId: string;
  customerId: string;
  service: "private_guide";
  planName: string;
  bookingDate: string;
  startTime: string;
  adults: number;
  children: number;
  bookingStatus: AdminBookingStatus;
  totalJpy: number;
  createdAt: string;
  selfReported: SelfReportedSource | null;
  measured: string | null;
};

type FixtureInquiry = AdminInquiryRow & {
  customerId: string;
  /** Mock list label. Not an approved inquiry taxonomy. */
  typeLabel: string;
  helpWith: string;
  tripNote: string;
  /** Converted inquiries read trip, guests, and acquisition from this booking. */
  relatedBookingId?: string;
  arriving?: string;
  leaving?: string;
  adults?: number;
  children?: number;
  selfReported?: SelfReportedSource | null;
  measured?: string | null;
};
type FixtureTrip = AdminTripRow;
type FixturePayment = AdminPaymentRow;
type FixtureTimeline = AdminTimelineEvent & { customerId: string };

/**
 * Prototype names and amounts for the screen only.
 * Not a product, price, or availability decision.
 */
const PLAN_4H = "4-Hour Private Guide";
const PLAN_8H = "8-Hour Private Guide";

const customers: FixtureCustomer[] = [
  { customerId: "cus_sarah_miller", fullName: "Sarah Miller", email: "sarah.miller@example.com", countryCode: "US", countryName: "United States" },
  { customerId: "cus_hana_sato", fullName: "Hana Sato", email: "hana.sato@example.com", countryCode: "JP", countryName: "Japan" },
  { customerId: "cus_oliver_berg", fullName: "Oliver Berg", email: "oliver.berg@example.com", countryCode: "DE", countryName: "Germany" },
  { customerId: "cus_mia_chen", fullName: "Mia Chen", email: "mia.chen@example.com", countryCode: "SG", countryName: "Singapore" },
  { customerId: "cus_lucas_bernard", fullName: "Lucas Bernard", email: "lucas.bernard@example.com", countryCode: "FR", countryName: "France" },
  { customerId: "cus_amelia_wright", fullName: "Amelia Wright", email: "amelia.wright@example.com", countryCode: "GB", countryName: "United Kingdom" },
  { customerId: "cus_noah_kelly", fullName: "Noah Kelly", email: "noah.kelly@example.com", countryCode: "AU", countryName: "Australia" },
  { customerId: "cus_elena_rossi", fullName: "Elena Rossi", email: "elena.rossi@example.com", countryCode: "IT", countryName: "Italy" },
];

const bookings: FixtureBooking[] = [
  {
    bookingId: "bk_087",
    customerId: "cus_sarah_miller",
    service: "private_guide",
    planName: PLAN_8H,
    bookingDate: "2026-04-02",
    startTime: "09:00",
    adults: 2,
    children: 0,
    bookingStatus: "COMPLETED",
    totalJpy: 55000,
    createdAt: "2026-03-02T01:10:00.000Z",
    selfReported: "instagram",
    measured: "Google Organic",
  },
  {
    bookingId: "bk_001",
    customerId: "cus_sarah_miller",
    service: "private_guide",
    planName: PLAN_4H,
    bookingDate: "2026-11-12",
    startTime: "09:30",
    adults: 2,
    children: 1,
    bookingStatus: "PENDING_CONFIRMATION",
    totalJpy: 30000,
    createdAt: "2026-10-18T04:20:00.000Z",
    selfReported: "friend_family",
    measured: "Direct",
  },
  {
    bookingId: "bk_210",
    customerId: "cus_oliver_berg",
    service: "private_guide",
    planName: PLAN_4H,
    bookingDate: "2026-12-01",
    startTime: "10:00",
    adults: 1,
    children: 0,
    bookingStatus: "PENDING_PAYMENT",
    totalJpy: 30000,
    createdAt: "2026-10-21T08:00:00.000Z",
    selfReported: "google",
    measured: "Google Organic",
  },
  {
    bookingId: "bk_155",
    customerId: "cus_mia_chen",
    service: "private_guide",
    planName: PLAN_4H,
    bookingDate: "2026-11-20",
    startTime: "13:00",
    adults: 3,
    children: 1,
    bookingStatus: "CONFIRMED",
    totalJpy: 30000,
    createdAt: "2026-10-02T06:00:00.000Z",
    selfReported: "tiktok",
    measured: "TikTok / paid",
  },
  {
    bookingId: "bk_102",
    customerId: "cus_mia_chen",
    service: "private_guide",
    planName: PLAN_8H,
    bookingDate: "2026-08-01",
    startTime: "09:00",
    adults: 2,
    children: 0,
    bookingStatus: "CANCELLED",
    totalJpy: 55000,
    createdAt: "2026-07-10T02:00:00.000Z",
    selfReported: "hotel",
    measured: "Partner referral",
  },
  {
    bookingId: "bk_077",
    customerId: "cus_lucas_bernard",
    service: "private_guide",
    planName: PLAN_4H,
    bookingDate: "2026-09-14",
    startTime: "11:00",
    adults: 2,
    children: 0,
    bookingStatus: "EXPIRED",
    totalJpy: 30000,
    createdAt: "2026-09-01T03:30:00.000Z",
    selfReported: "ai_chatgpt",
    measured: "Organic / AI",
  },
  {
    bookingId: "bk_188",
    customerId: "cus_noah_kelly",
    service: "private_guide",
    planName: PLAN_8H,
    bookingDate: "2026-06-18",
    startTime: "08:30",
    adults: 4,
    children: 2,
    bookingStatus: "COMPLETED",
    totalJpy: 55000,
    createdAt: "2026-05-20T01:00:00.000Z",
    selfReported: "youtube",
    measured: "YouTube Organic",
  },
];

const inquiries: FixtureInquiry[] = [
  {
    inquiryId: "inq_012",
    customerId: "cus_sarah_miller",
    summary: "April Kansai day",
    status: "CONVERTED",
    createdAt: "2026-03-01T02:00:00.000Z",
    typeLabel: "Private guide",
    helpWith: "A private guide for one day in Kansai",
    tripNote: "April Kansai day",
    relatedBookingId: "bk_087",
  },
  {
    inquiryId: "inq_044",
    customerId: "cus_hana_sato",
    summary: "Kyoto with parents",
    status: "NEW",
    createdAt: "2026-10-24T07:40:00.000Z",
    typeLabel: "Private guide",
    helpWith: "A day in Kyoto with my parents",
    tripNote: "Kyoto with parents. We want a calm day.",
    arriving: "2026-11-08",
    leaving: "2026-11-12",
    adults: 3,
    children: 0,
    selfReported: "instagram",
    measured: "Instagram",
  },
  {
    inquiryId: "inq_031",
    customerId: "cus_mia_chen",
    summary: "Autumn dates",
    status: "PROPOSAL_SENT",
    createdAt: "2026-09-20T02:00:00.000Z",
    typeLabel: "Dates and availability",
    helpWith: "Which autumn dates still have a guide",
    tripNote: "Looking at a few days in early October.",
    arriving: "2026-10-03",
    leaving: "2026-10-06",
    adults: 2,
    children: 0,
    selfReported: "google",
    measured: "Google Organic",
  },
  {
    inquiryId: "inq_030",
    customerId: "cus_mia_chen",
    summary: "Food-focused afternoon",
    status: "IN_PROGRESS",
    createdAt: "2026-10-11T05:15:00.000Z",
    typeLabel: "Before booking",
    helpWith: "Is a food-focused afternoon possible",
    tripNote: "We are already in Osaka and want one afternoon for food.",
    arriving: "2026-11-19",
    leaving: "2026-11-19",
    adults: 2,
    children: 0,
    selfReported: "friend_family",
    measured: null,
  },
  {
    inquiryId: "inq_019",
    customerId: "cus_lucas_bernard",
    summary: "September dates",
    status: "CLOSED",
    createdAt: "2026-08-28T09:00:00.000Z",
    typeLabel: "Dates and availability",
    helpWith: "Can we still book mid-September",
    tripNote: "September dates. We need to know before we buy flights.",
    arriving: "2026-09-12",
    leaving: "2026-09-16",
    adults: 2,
    children: 0,
    selfReported: "ai_chatgpt",
    measured: "Organic / AI",
  },
  {
    inquiryId: "inq_051",
    customerId: "cus_amelia_wright",
    summary: "Family food day",
    status: "ACCEPTED",
    createdAt: "2026-10-12T11:20:00.000Z",
    typeLabel: "Private guide",
    helpWith: "A family day that includes food",
    tripNote: "Family food day. Two adults and one child.",
    arriving: "2026-11-02",
    leaving: "2026-11-06",
    adults: 2,
    children: 1,
    selfReported: "friend_family",
    measured: null,
  },
  {
    inquiryId: "inq_008",
    customerId: "cus_noah_kelly",
    summary: "June full day",
    status: "CONVERTED",
    createdAt: "2026-05-18T04:00:00.000Z",
    typeLabel: "Private guide",
    helpWith: "A full day with a local guide",
    tripNote: "June full day",
    relatedBookingId: "bk_188",
  },
];

const trips: FixtureTrip[] = [
  {
    bookingId: "bk_087",
    arriving: "2026-03-30",
    leaving: "2026-04-06",
    interests: ["food_dining", "famous_sights"],
    tripDescription: "First time in Osaka. We want a full day of food and a few well-known sights.",
  },
  {
    bookingId: "bk_001",
    arriving: "2026-11-10",
    leaving: "2026-11-16",
    interests: ["family_activities", "local_neighborhoods", "food_dining"],
    tripDescription: "Returning with our child. A slower half day in local neighborhoods.",
  },
  {
    bookingId: "bk_210",
    arriving: "2026-11-28",
    leaving: "2026-12-04",
    interests: ["culture_heritage"],
    tripDescription: "Solo trip. Temples and museums, not a packed schedule.",
  },
  {
    bookingId: "bk_155",
    arriving: "2026-11-18",
    leaving: "2026-11-24",
    interests: ["shopping", "food_dining"],
    tripDescription: "Afternoon slot between shopping and a long lunch.",
  },
  {
    bookingId: "bk_188",
    arriving: "2026-06-15",
    leaving: "2026-06-22",
    interests: ["active_experiences", "hidden_gems"],
    tripDescription: "Group of friends. Happy to walk, and interested in quieter streets.",
  },
];

const payments: FixturePayment[] = [
  { paymentId: "pay_087", bookingId: "bk_087", paymentStatus: "paid", amountJpy: 55000, occurredAt: "2026-03-02T01:16:00.000Z" },
  { paymentId: "pay_001", bookingId: "bk_001", paymentStatus: "paid", amountJpy: 30000, occurredAt: "2026-10-18T04:24:00.000Z" },
  { paymentId: "pay_210", bookingId: "bk_210", paymentStatus: "pending", amountJpy: 30000, occurredAt: null },
  { paymentId: "pay_155", bookingId: "bk_155", paymentStatus: "paid", amountJpy: 30000, occurredAt: "2026-10-02T06:05:00.000Z" },
  { paymentId: "pay_102", bookingId: "bk_102", paymentStatus: "refunded", amountJpy: 55000, occurredAt: "2026-07-18T08:00:00.000Z" },
  { paymentId: "pay_077", bookingId: "bk_077", paymentStatus: "failed", amountJpy: 30000, occurredAt: "2026-09-01T03:40:00.000Z" },
  { paymentId: "pay_188", bookingId: "bk_188", paymentStatus: "paid", amountJpy: 55000, occurredAt: "2026-05-20T01:08:00.000Z" },
];

const timeline: FixtureTimeline[] = [
  { id: "tl_01", customerId: "cus_sarah_miller", at: "2026-03-01T02:00:00.000Z", label: "Inquiry Created", detail: "inq_012" },
  { id: "tl_02", customerId: "cus_sarah_miller", at: "2026-03-02T01:10:00.000Z", label: "Booking Created", detail: "bk_087" },
  { id: "tl_03", customerId: "cus_sarah_miller", at: "2026-03-02T01:16:00.000Z", label: "Payment Received", detail: "pay_087 · paid" },
  { id: "tl_04", customerId: "cus_sarah_miller", at: "2026-03-04T06:00:00.000Z", label: "Guide Assigned", detail: "bk_087" },
  { id: "tl_05", customerId: "cus_sarah_miller", at: "2026-03-05T02:30:00.000Z", label: "Booking Confirmed", detail: "bk_087" },
  { id: "tl_06", customerId: "cus_sarah_miller", at: "2026-04-02T09:00:00.000Z", label: "Tour Completed", detail: "bk_087" },
  { id: "tl_07", customerId: "cus_sarah_miller", at: "2026-10-18T04:20:00.000Z", label: "Booking Created", detail: "bk_001" },
  { id: "tl_08", customerId: "cus_sarah_miller", at: "2026-10-18T04:24:00.000Z", label: "Payment Received", detail: "pay_001 · paid" },
  { id: "tl_09", customerId: "cus_sarah_miller", at: "2026-10-22T10:05:00.000Z", label: "Planner Submitted", detail: "bk_001" },
  { id: "tl_10", customerId: "cus_hana_sato", at: "2026-10-24T07:40:00.000Z", label: "Inquiry Created", detail: "inq_044" },
  { id: "tl_11", customerId: "cus_oliver_berg", at: "2026-10-21T08:00:00.000Z", label: "Booking Created", detail: "bk_210" },
  { id: "tl_12", customerId: "cus_mia_chen", at: "2026-07-10T02:00:00.000Z", label: "Booking Created", detail: "bk_102" },
  { id: "tl_13", customerId: "cus_mia_chen", at: "2026-07-10T02:10:00.000Z", label: "Payment Received", detail: "pay_102 · later refunded" },
  { id: "tl_14", customerId: "cus_mia_chen", at: "2026-10-02T06:00:00.000Z", label: "Booking Created", detail: "bk_155" },
  { id: "tl_15", customerId: "cus_mia_chen", at: "2026-10-02T06:05:00.000Z", label: "Payment Received", detail: "pay_155 · paid" },
  { id: "tl_16", customerId: "cus_mia_chen", at: "2026-10-08T01:00:00.000Z", label: "Guide Assigned", detail: "bk_155" },
  { id: "tl_17", customerId: "cus_mia_chen", at: "2026-10-08T04:00:00.000Z", label: "Booking Confirmed", detail: "bk_155" },
  { id: "tl_18a", customerId: "cus_mia_chen", at: "2026-09-20T02:00:00.000Z", label: "Inquiry Created", detail: "inq_031" },
  { id: "tl_18", customerId: "cus_mia_chen", at: "2026-10-11T05:15:00.000Z", label: "Inquiry Created", detail: "inq_030" },
  { id: "tl_19", customerId: "cus_lucas_bernard", at: "2026-08-28T09:00:00.000Z", label: "Inquiry Created", detail: "inq_019" },
  { id: "tl_20", customerId: "cus_lucas_bernard", at: "2026-09-01T03:30:00.000Z", label: "Booking Created", detail: "bk_077" },
  { id: "tl_21", customerId: "cus_amelia_wright", at: "2026-10-12T11:20:00.000Z", label: "Inquiry Created", detail: "inq_051" },
  { id: "tl_23", customerId: "cus_noah_kelly", at: "2026-05-18T04:00:00.000Z", label: "Inquiry Created", detail: "inq_008" },
  { id: "tl_24", customerId: "cus_noah_kelly", at: "2026-05-20T01:00:00.000Z", label: "Booking Created", detail: "bk_188" },
  { id: "tl_25", customerId: "cus_noah_kelly", at: "2026-05-20T01:08:00.000Z", label: "Payment Received", detail: "pay_188 · paid" },
  { id: "tl_26", customerId: "cus_noah_kelly", at: "2026-05-22T03:00:00.000Z", label: "Guide Assigned", detail: "bk_188" },
  { id: "tl_27", customerId: "cus_noah_kelly", at: "2026-05-22T06:00:00.000Z", label: "Booking Confirmed", detail: "bk_188" },
  { id: "tl_28", customerId: "cus_noah_kelly", at: "2026-05-28T08:00:00.000Z", label: "Planner Submitted", detail: "bk_188" },
  { id: "tl_29", customerId: "cus_noah_kelly", at: "2026-06-18T08:30:00.000Z", label: "Tour Completed", detail: "bk_188" },
];

/**
 * Office read model for post-booking planning.
 * Planner submitted still comes from the timeline above.
 * Planning status is provisional and is not a shared contract.
 * Answers are places, pace, and other requests. Interests stay on the booking trip.
 */
const dayPlans: FixtureDayPlan[] = [
  { planId: "pln_155", bookingId: "bk_155", updatedAt: null },
  {
    planId: "pln_001",
    bookingId: "bk_001",
    planningStatus: "PLANNING",
    places: "A neighborhood walk and one long lunch.",
    idealDay: "A slower half day, with time to linger.",
    anythingElse: "Traveling with a child. Please do not pack the afternoon.",
    updatedAt: "2026-10-23T01:30:00.000Z",
  },
  {
    planId: "pln_188",
    bookingId: "bk_188",
    planningStatus: "FINALIZED",
    places: "Quieter streets the group can walk.",
    idealDay: "A full day with room to wander.",
    anythingElse: "Keep one break in the afternoon.",
    updatedAt: "2026-06-10T02:00:00.000Z",
  },
];

type FixtureDayPlan = {
  planId: string;
  bookingId: string;
  planningStatus?: Exclude<AdminPlanningStatus, "NOT_STARTED">;
  places?: string;
  idealDay?: string;
  anythingElse?: string;
  updatedAt: string | null;
};

const OPEN_BOOKING: AdminBookingStatus[] = ["PENDING_CONFIRMATION", "PENDING_PAYMENT", "CONFIRMED"];
const TERMINAL_BOOKING: AdminBookingStatus[] = ["COMPLETED", "CANCELLED", "EXPIRED"];
const OPEN_INQUIRY: AdminInquiryStatus[] = ["NEW", "IN_PROGRESS", "PROPOSAL_SENT", "ACCEPTED"];
const TERMINAL_INQUIRY: AdminInquiryStatus[] = ["CONVERTED", "CLOSED"];

function firstMatch<T extends string>(priority: readonly T[], values: readonly T[]): T | undefined {
  return priority.find((status) => values.includes(status));
}

/**
 * List badge only. One label so the table scans.
 * Open booking, then open inquiry, then a terminal booking, then a terminal inquiry.
 */
function projectStatus(customerId: string): AdminListStatus | null {
  const bookingStatuses = bookings.filter((row) => row.customerId === customerId).map((row) => row.bookingStatus);
  const inquiryStatuses = inquiries.filter((row) => row.customerId === customerId).map((row) => row.status);
  const openBooking = firstMatch(OPEN_BOOKING, bookingStatuses);
  if (openBooking) return { kind: "booking", status: openBooking };
  const openInquiry = firstMatch(OPEN_INQUIRY, inquiryStatuses);
  if (openInquiry) return { kind: "inquiry", status: openInquiry };
  const terminalBooking = firstMatch(TERMINAL_BOOKING, bookingStatuses);
  if (terminalBooking) return { kind: "booking", status: terminalBooking };
  const terminalInquiry = firstMatch(TERMINAL_INQUIRY, inquiryStatuses);
  if (terminalInquiry) return { kind: "inquiry", status: terminalInquiry };
  return null;
}

function projectListItem(customer: FixtureCustomer): AdminCustomerListItem {
  const ownBookings = bookings.filter((row) => row.customerId === customer.customerId);
  const ownInquiries = inquiries.filter((row) => row.customerId === customer.customerId);
  const bookingIds = new Set(ownBookings.map((row) => row.bookingId));
  const ownPayments = payments.filter((row) => bookingIds.has(row.bookingId));
  const events = timeline.filter((row) => row.customerId === customer.customerId);
  const earliest = [...ownBookings].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const lastActivityAt = events.reduce<string | null>((latest, event) => {
    if (!latest || event.at > latest) return event.at;
    return latest;
  }, null);

  return {
    customerId: customer.customerId,
    fullName: customer.fullName,
    email: customer.email,
    countryCode: customer.countryCode,
    countryName: customer.countryName,
    lastActivityAt,
    bookingCount: ownBookings.length,
    inquiryCount: ownInquiries.length,
    totalRevenueJpy: ownPayments.filter((row) => row.paymentStatus === "paid").reduce((sum, row) => sum + row.amountJpy, 0),
    currentStatus: projectStatus(customer.customerId),
    acquisition: earliest
      ? {
          selfReported: earliest.selfReported,
          measured: earliest.measured,
          additionalBookingCount: Math.max(0, ownBookings.length - 1),
        }
      : null,
  };
}

function projectDetail(customer: FixtureCustomer): AdminCustomerDetail {
  const ownBookings = bookings
    .filter((row) => row.customerId === customer.customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const bookingIds = new Set(ownBookings.map((row) => row.bookingId));

  return {
    profile: customer,
    bookings: ownBookings.map((row) => ({
      bookingId: row.bookingId,
      service: row.service,
      planName: row.planName,
      bookingDate: row.bookingDate,
      startTime: row.startTime,
      adults: row.adults,
      children: row.children,
      bookingStatus: row.bookingStatus,
      paymentStatuses: payments.filter((payment) => payment.bookingId === row.bookingId).map((payment) => payment.paymentStatus),
      totalJpy: row.totalJpy,
      selfReported: row.selfReported,
      measured: row.measured,
    })),
    inquiries: inquiries
      .filter((row) => row.customerId === customer.customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((row) => ({
        inquiryId: row.inquiryId,
        summary: row.summary,
        status: row.status,
        createdAt: row.createdAt,
      })),
    trips: trips.filter((row) => bookingIds.has(row.bookingId)),
    payments: payments
      .filter((row) => bookingIds.has(row.bookingId))
      .sort((a, b) => (b.occurredAt ?? "").localeCompare(a.occurredAt ?? "")),
    timeline: timeline
      .filter((row) => row.customerId === customer.customerId)
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((event) => ({
        id: event.id,
        at: event.at,
        label: event.label,
        detail: event.detail,
      })),
    plans: dayPlans
      .filter((row) => bookingIds.has(row.bookingId))
      .map((row) => officePlanForBooking(row.bookingId))
      .filter((row): row is AdminCustomerPlanRow => row !== null),
  };
}

export async function getAdminCustomerList(): Promise<AdminCustomerListItem[]> {
  return customers
    .map(projectListItem)
    .sort((a, b) => {
      if (a.lastActivityAt && b.lastActivityAt && a.lastActivityAt !== b.lastActivityAt) {
        return b.lastActivityAt.localeCompare(a.lastActivityAt);
      }
      if (a.lastActivityAt && !b.lastActivityAt) return -1;
      if (!a.lastActivityAt && b.lastActivityAt) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
}

export async function getAdminCustomerDetail(customerId: string): Promise<AdminCustomerDetail | null> {
  const customer = customers.find((row) => row.customerId === customerId);
  return customer ? projectDetail(customer) : null;
}

export const ADMIN_BOOKING_STATUSES = [
  "PENDING_PAYMENT",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const satisfies readonly AdminBookingStatus[];

export const ADMIN_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const satisfies readonly AdminPaymentStatus[];

/**
 * PROVISIONAL ADMIN READ MODEL.
 * Office progress after a planner submission. Not a shared contract or a business rule.
 */
export type AdminPlanningStatus = "NOT_STARTED" | "PLANNING" | "PROPOSED" | "FINALIZED";

export type AdminPlannerStatus = "NOT_SUBMITTED" | "SUBMITTED";

/** PROVISIONAL ADMIN READ MODEL. Not a shared contract or a business rule. */
export const ADMIN_PLANNING_STATUSES = ["NOT_STARTED", "PLANNING", "PROPOSED", "FINALIZED"] as const satisfies readonly AdminPlanningStatus[];

export const ADMIN_PLANNER_STATUSES = ["NOT_SUBMITTED", "SUBMITTED"] as const satisfies readonly AdminPlannerStatus[];

/** PROVISIONAL ADMIN READ MODEL. Not a shared contract or a business rule. */
export const ADMIN_INQUIRY_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "PROPOSAL_SENT",
  "ACCEPTED",
  "CONVERTED",
  "CLOSED",
] as const satisfies readonly AdminInquiryStatus[];

/** Scan flags for the bookings list. Derived for the screen. Not stored statuses. */
export type AdminBookingAttention = {
  awaitingPayment: boolean;
  awaitingConfirmation: boolean;
  upcoming: boolean;
  plannerNotSubmitted: boolean;
  guideUnassigned: boolean;
};

export type AdminBookingListItem = {
  bookingId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  service: PrivateGuideBookingRecord["service"];
  planName: string;
  bookingDate: string;
  startTime: string;
  adults: number;
  children: number;
  totalJpy: number;
  bookingStatus: AdminBookingStatus;
  paymentStatuses: AdminPaymentStatus[];
  plannerSubmitted: boolean;
  /** True when the existing timeline fixture already records Guide Assigned. Not an assignment status. */
  guideNoted: boolean;
  /** Present when this booking has an office plan row. */
  planId: string | null;
  attention: AdminBookingAttention;
};

export type AdminBookingDetail = {
  overview: {
    bookingId: string;
    service: PrivateGuideBookingRecord["service"];
    planName: string;
    bookingDate: string;
    startTime: string;
    durationMinutes: number;
    adults: number;
    children: number;
    totalJpy: number;
    currency: "JPY";
    bookingStatus: AdminBookingStatus;
  };
  customer: {
    customerId: string;
    fullName: string;
    email: string;
    countryCode: string;
    countryName: string;
  };
  trip: AdminTripRow | null;
  planner: { submitted: boolean; submittedAt: string | null };
  planId: string | null;
  payments: AdminPaymentRow[];
  guideNoted: boolean;
  acquisition: {
    selfReported: SelfReportedSource | null;
    measured: string | null;
  };
};

function jstToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function durationMinutes(planName: string) {
  if (planName === PLAN_8H) return 480;
  if (planName === PLAN_4H) return 240;
  return 0;
}

function timelineForBooking(bookingId: string, label: AdminTimelineLabel) {
  return timeline.find((event) => event.label === label && event.detail === bookingId);
}

function officePlanForBooking(bookingId: string): AdminCustomerPlanRow | null {
  const plan = dayPlans.find((row) => row.bookingId === bookingId);
  if (!plan) return null;
  const submitted = Boolean(timelineForBooking(bookingId, "Planner Submitted"));
  return {
    planId: plan.planId,
    bookingId,
    plannerStatus: submitted ? "SUBMITTED" : "NOT_SUBMITTED",
    planningStatus: submitted ? (plan.planningStatus ?? "PLANNING") : "NOT_STARTED",
  };
}

const ACTIVE_PREP: readonly AdminBookingStatus[] = ["PENDING_CONFIRMATION", "CONFIRMED"];

function projectBooking(booking: FixtureBooking, today: string): AdminBookingListItem | null {
  const customer = customers.find((row) => row.customerId === booking.customerId);
  if (!customer) return null;
  const planner = timelineForBooking(booking.bookingId, "Planner Submitted");
  const guide = timelineForBooking(booking.bookingId, "Guide Assigned");
  const plannerSubmitted = Boolean(planner);
  const guideNoted = Boolean(guide);
  const preparing = ACTIVE_PREP.includes(booking.bookingStatus);
  return {
    bookingId: booking.bookingId,
    customerId: customer.customerId,
    customerName: customer.fullName,
    customerEmail: customer.email,
    service: booking.service,
    planName: booking.planName,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    adults: booking.adults,
    children: booking.children,
    totalJpy: booking.totalJpy,
    bookingStatus: booking.bookingStatus,
    paymentStatuses: payments.filter((row) => row.bookingId === booking.bookingId).map((row) => row.paymentStatus),
    plannerSubmitted,
    guideNoted,
    planId: dayPlans.find((row) => row.bookingId === booking.bookingId)?.planId ?? null,
    attention: {
      awaitingPayment: booking.bookingStatus === "PENDING_PAYMENT",
      awaitingConfirmation: booking.bookingStatus === "PENDING_CONFIRMATION",
      upcoming: booking.bookingStatus === "CONFIRMED" && booking.bookingDate >= today,
      plannerNotSubmitted: preparing && !plannerSubmitted,
      guideUnassigned: preparing && !guideNoted,
    },
  };
}

const STATUS_RANK: Record<AdminBookingStatus, number> = {
  PENDING_CONFIRMATION: 0,
  PENDING_PAYMENT: 1,
  CONFIRMED: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  EXPIRED: 5,
};

export async function getAdminBookingList(): Promise<AdminBookingListItem[]> {
  const today = jstToday();
  return bookings
    .map((booking) => projectBooking(booking, today))
    .filter((row): row is AdminBookingListItem => row !== null)
    .sort((a, b) => {
      const rank = STATUS_RANK[a.bookingStatus] - STATUS_RANK[b.bookingStatus];
      if (rank !== 0) return rank;
      return a.bookingDate.localeCompare(b.bookingDate);
    });
}

export async function getAdminBookingDetail(bookingId: string): Promise<AdminBookingDetail | null> {
  const booking = bookings.find((row) => row.bookingId === bookingId);
  if (!booking) return null;
  const customer = customers.find((row) => row.customerId === booking.customerId);
  if (!customer) return null;
  const planner = timelineForBooking(booking.bookingId, "Planner Submitted");
  const guide = timelineForBooking(booking.bookingId, "Guide Assigned");
  return {
    overview: {
      bookingId: booking.bookingId,
      service: booking.service,
      planName: booking.planName,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      durationMinutes: durationMinutes(booking.planName),
      adults: booking.adults,
      children: booking.children,
      totalJpy: booking.totalJpy,
      currency: "JPY",
      bookingStatus: booking.bookingStatus,
    },
    customer: {
      customerId: customer.customerId,
      fullName: customer.fullName,
      email: customer.email,
      countryCode: customer.countryCode,
      countryName: customer.countryName,
    },
    trip: trips.find((row) => row.bookingId === booking.bookingId) ?? null,
    planner: { submitted: Boolean(planner), submittedAt: planner?.at ?? null },
    planId: dayPlans.find((row) => row.bookingId === booking.bookingId)?.planId ?? null,
    payments: payments.filter((row) => row.bookingId === booking.bookingId),
    guideNoted: Boolean(guide),
    acquisition: { selfReported: booking.selfReported, measured: booking.measured },
  };
}

export type AdminDashboardInquiry = {
  inquiryId: string;
  customerId: string;
  customerName: string;
  summary: string;
  status: AdminInquiryStatus;
  createdAt: string;
};

export type AdminDashboardActivity = {
  id: string;
  at: string;
  label: AdminTimelineLabel;
  detail: string;
  customerId: string;
  customerName: string;
  bookingId: string | null;
};

/**
 * Screen model only. Counts come from the same fixtures as Customers and Bookings.
 * Revenue uses the provisional paid-sum display rule and is not a business rule.
 */
export type AdminDashboard = {
  monthLabel: string;
  needsAttention: {
    awaitingPayment: AdminBookingListItem[];
    awaitingConfirmation: AdminBookingListItem[];
    plannerNotSubmitted: AdminBookingListItem[];
    guideUnassigned: AdminBookingListItem[];
    openInquiries: AdminDashboardInquiry[];
  };
  upcoming: AdminBookingListItem[];
  month: {
    bookingsCreated: number;
    revenuePaidJpy: number;
    customersWithActivity: number;
    inquiriesCreated: number;
  };
  recentActivity: AdminDashboardActivity[];
};

function jstMonthKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).format(new Date(iso));
}

function jstMonthLabel(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    month: "long",
    year: "numeric",
  }).format(now);
}

function bookingIdFromActivity(detail: string) {
  const token = detail.split(" ")[0] ?? "";
  if (token.startsWith("bk_")) return token;
  if (token.startsWith("pay_")) return payments.find((row) => row.paymentId === token)?.bookingId ?? null;
  return null;
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const today = jstToday();
  const monthKey = today.slice(0, 7);
  const inMonth = (iso: string | null) => Boolean(iso) && jstMonthKey(iso as string) === monthKey;
  const projected = bookings
    .map((booking) => projectBooking(booking, today))
    .filter((row): row is AdminBookingListItem => row !== null);
  const byDate = (a: AdminBookingListItem, b: AdminBookingListItem) => a.bookingDate.localeCompare(b.bookingDate);
  const activeCustomers = new Set<string>();
  for (const event of timeline) if (inMonth(event.at)) activeCustomers.add(event.customerId);
  for (const booking of bookings) if (inMonth(booking.createdAt)) activeCustomers.add(booking.customerId);
  for (const inquiry of inquiries) if (inMonth(inquiry.createdAt)) activeCustomers.add(inquiry.customerId);

  return {
    monthLabel: jstMonthLabel(),
    needsAttention: {
      awaitingPayment: projected.filter((row) => row.attention.awaitingPayment).sort(byDate),
      awaitingConfirmation: projected.filter((row) => row.attention.awaitingConfirmation).sort(byDate),
      plannerNotSubmitted: projected.filter((row) => row.attention.plannerNotSubmitted).sort(byDate),
      guideUnassigned: projected.filter((row) => row.attention.guideUnassigned).sort(byDate),
      openInquiries: inquiries
        .filter((row) => OPEN_INQUIRY.includes(row.status))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((row) => ({
          inquiryId: row.inquiryId,
          customerId: row.customerId,
          customerName: customers.find((customer) => customer.customerId === row.customerId)?.fullName ?? row.customerId,
          summary: row.summary,
          status: row.status,
          createdAt: row.createdAt,
        })),
    },
    upcoming: projected
      .filter((row) => row.bookingDate >= today && row.bookingStatus !== "CANCELLED" && row.bookingStatus !== "EXPIRED")
      .sort(byDate)
      .slice(0, 6),
    month: {
      bookingsCreated: bookings.filter((row) => inMonth(row.createdAt)).length,
      revenuePaidJpy: payments
        .filter((row) => row.paymentStatus === "paid" && inMonth(row.occurredAt))
        .reduce((sum, row) => sum + row.amountJpy, 0),
      customersWithActivity: activeCustomers.size,
      inquiriesCreated: inquiries.filter((row) => inMonth(row.createdAt)).length,
    },
    recentActivity: [...timeline]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8)
      .map((event) => ({
        id: event.id,
        at: event.at,
        label: event.label,
        detail: event.detail,
        customerId: event.customerId,
        customerName: customers.find((customer) => customer.customerId === event.customerId)?.fullName ?? event.customerId,
        bookingId: bookingIdFromActivity(event.detail),
      })),
  };
}

export type AdminInquiryListItem = {
  inquiryId: string;
  customerId: string;
  customerName: string;
  email: string;
  countryCode: string;
  countryName: string;
  arriving: string | null;
  leaving: string | null;
  adults: number | null;
  children: number | null;
  typeLabel: string;
  status: AdminInquiryStatus;
  createdAt: string;
  selfReported: SelfReportedSource | null;
  measured: string | null;
};

export type AdminInquiryDetail = AdminInquiryListItem & {
  summary: string;
  helpWith: string;
  tripNote: string;
};

function projectInquiry(inquiry: FixtureInquiry): AdminInquiryListItem | null {
  const customer = customers.find((row) => row.customerId === inquiry.customerId);
  if (!customer) return null;
  const booking = inquiry.relatedBookingId ? bookings.find((row) => row.bookingId === inquiry.relatedBookingId) : undefined;
  const trip = booking ? trips.find((row) => row.bookingId === booking.bookingId) : undefined;
  return {
    inquiryId: inquiry.inquiryId,
    customerId: customer.customerId,
    customerName: customer.fullName,
    email: customer.email,
    countryCode: customer.countryCode,
    countryName: customer.countryName,
    arriving: trip?.arriving ?? inquiry.arriving ?? null,
    leaving: trip?.leaving ?? inquiry.leaving ?? null,
    adults: booking?.adults ?? inquiry.adults ?? null,
    children: booking?.children ?? inquiry.children ?? null,
    typeLabel: inquiry.typeLabel,
    status: inquiry.status,
    createdAt: inquiry.createdAt,
    selfReported: booking?.selfReported ?? inquiry.selfReported ?? null,
    measured: booking?.measured ?? inquiry.measured ?? null,
  };
}

export async function getAdminInquiryList(): Promise<AdminInquiryListItem[]> {
  return inquiries
    .map(projectInquiry)
    .filter((row): row is AdminInquiryListItem => row !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAdminInquiryDetail(inquiryId: string): Promise<AdminInquiryDetail | null> {
  const inquiry = inquiries.find((row) => row.inquiryId === inquiryId);
  if (!inquiry) return null;
  const projected = projectInquiry(inquiry);
  if (!projected) return null;
  return { ...projected, summary: inquiry.summary, helpWith: inquiry.helpWith, tripNote: inquiry.tripNote };
}

export type AdminPlanListItem = {
  planId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  email: string;
  countryCode: string;
  countryName: string;
  bookingDate: string;
  startTime: string;
  durationMinutes: number;
  plannerStatus: AdminPlannerStatus;
  planningStatus: AdminPlanningStatus;
  guideAssigned: boolean;
  updatedAt: string | null;
};

export type AdminPlanDetail = AdminPlanListItem & {
  adults: number;
  children: number;
  planName: string;
  totalJpy: number;
  bookingStatus: AdminBookingStatus;
  paymentStatuses: AdminPaymentStatus[];
  arriving: string | null;
  leaving: string | null;
  interests: BookingInterest[];
  tripDescription: string | null;
  places: string | null;
  idealDay: string | null;
  anythingElse: string | null;
  relatedInquiryId: string | null;
};

const PLANNING_RANK: Record<AdminPlanningStatus, number> = {
  NOT_STARTED: 0,
  PLANNING: 1,
  PROPOSED: 2,
  FINALIZED: 3,
};

function projectPlan(plan: FixtureDayPlan): AdminPlanDetail | null {
  const booking = bookings.find((row) => row.bookingId === plan.bookingId);
  const customer = booking ? customers.find((row) => row.customerId === booking.customerId) : undefined;
  if (!booking || !customer) return null;
  const progress = officePlanForBooking(plan.bookingId);
  if (!progress) return null;
  const submitted = progress.plannerStatus === "SUBMITTED";
  const trip = trips.find((row) => row.bookingId === booking.bookingId);
  const plannerEvent = timelineForBooking(booking.bookingId, "Planner Submitted");
  const relatedInquiry = inquiries.find((row) => row.relatedBookingId === booking.bookingId);
  return {
    planId: plan.planId,
    bookingId: booking.bookingId,
    customerId: customer.customerId,
    customerName: customer.fullName,
    email: customer.email,
    countryCode: customer.countryCode,
    countryName: customer.countryName,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    durationMinutes: durationMinutes(booking.planName),
    plannerStatus: progress.plannerStatus,
    planningStatus: progress.planningStatus,
    guideAssigned: Boolean(timelineForBooking(booking.bookingId, "Guide Assigned")),
    updatedAt: submitted ? (plan.updatedAt ?? plannerEvent?.at ?? null) : null,
    adults: booking.adults,
    children: booking.children,
    planName: booking.planName,
    totalJpy: booking.totalJpy,
    bookingStatus: booking.bookingStatus,
    paymentStatuses: payments.filter((row) => row.bookingId === booking.bookingId).map((row) => row.paymentStatus),
    arriving: trip?.arriving ?? null,
    leaving: trip?.leaving ?? null,
    interests: trip?.interests ?? [],
    tripDescription: trip?.tripDescription ?? null,
    places: submitted ? (plan.places ?? null) : null,
    idealDay: submitted ? (plan.idealDay ?? null) : null,
    anythingElse: submitted ? (plan.anythingElse ?? null) : null,
    relatedInquiryId: relatedInquiry?.inquiryId ?? null,
  };
}

export async function getAdminPlanList(): Promise<AdminPlanListItem[]> {
  return dayPlans
    .map(projectPlan)
    .filter((row): row is AdminPlanDetail => row !== null)
    .sort((a, b) => {
      const rank = PLANNING_RANK[a.planningStatus] - PLANNING_RANK[b.planningStatus];
      if (rank !== 0) return rank;
      return a.bookingDate.localeCompare(b.bookingDate);
    })
    .map(({ planId, bookingId, customerId, customerName, email, countryCode, countryName, bookingDate, startTime, durationMinutes: duration, plannerStatus, planningStatus, guideAssigned, updatedAt }) => ({
      planId,
      bookingId,
      customerId,
      customerName,
      email,
      countryCode,
      countryName,
      bookingDate,
      startTime,
      durationMinutes: duration,
      plannerStatus,
      planningStatus,
      guideAssigned,
      updatedAt,
    }));
}

export async function getAdminPlanDetail(planId: string): Promise<AdminPlanDetail | null> {
  const plan = dayPlans.find((row) => row.planId === planId);
  if (!plan) return null;
  return projectPlan(plan);
}
