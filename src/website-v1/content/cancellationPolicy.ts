import type { CancellationPolicyData, CancellationPolicyViewModel } from "@/contracts";
import { businessInfo } from "@/data/business-info";
import { V1_PREVIEW } from "../config";
import { routeHref } from "../routes";
import { proposed, tbd } from "./shared";

/**
 * Cancellation & Refund Policy V1 (Human instruction 2026-11-14). Replaces, on
 * Website v1 only, the current site's policy (USD 300 consultation deposit,
 * arrangement fees, old fee table), which contradicted the v1 booking model.
 * The current site's own data (messages/*.json) is unchanged.
 *
 * DRAFT, NOT legally approved. The fee rates (30% / 50% / 100%) still need a
 * legal check (Consumer Contract Act art. 9 "average damage", the contract
 * type under the Travel Agency Act, any applicable travel terms), as do the
 * contract-formation wording and the cancellation receipt channel.
 * Until a human records that approval (then: `approved(...)`):
 * - preview: the draft is shown, with a preview-only "draft" label;
 * - public mode: the page shows no policy text (TBD), and the booking form and
 *   tour page do not link to it. The public-mode routing is unchanged.
 *
 * Fee schedule: calendar days before the tour date, Japan time (JST, UTC+9).
 * "7 or more days" ends at 23:59 JST on the date 7 days before the tour.
 */
export const CANCELLATION_POLICY_SOURCE =
  "Cancellation & Refund Policy V1, owner's draft of 2026-11-14 (3–6 days: 30%). Pending legal review: not approved for publication";

/** The fee table, also summarised next to the booking form. Percentages of the total booking price incl. tax. */
export const CANCELLATION_FEES: [timing: string, fee: string, refund: string][] = [
  ["7 or more calendar days before the tour", "0%", "100%"],
  ["3–6 calendar days before the tour", "30%", "70%"],
  ["1–2 calendar days before the tour", "50%", "50%"],
  ["On the tour date", "100%", "0%"],
  ["No-show", "100%", "0%"],
];

const POLICY: CancellationPolicyData = {
  heading: "Cancellation & Refund Policy",
  subheading: "CANCELLATION & REFUND POLICY",
  intro: "",
  sections: [
    {
      number: 1,
      title: "Scope",
      body: [
        "This policy is intended to apply to Private Guide services and Fixed Guided Tours provided by Connectrip Japan.",
        "If a service is subject to applicable travel laws or travel contract terms, those requirements will take precedence.",
      ].join("\n\n"),
    },
    {
      number: 2,
      title: "Booking Requests and Confirmation",
      body: [
        "Submitting a booking request does not automatically confirm a reservation.",
        "For Fixed Guided Tours, published group prices generally apply.",
        "For Private Guide services, we provide an individual quotation based on the requested date, duration, location, group size, and service requirements.",
        "Our standard quotation validity period for Private Guide services is 48 hours.",
        "After reviewing availability and service conditions, we will provide the applicable price and booking details.",
        "Full advance payment is required through Stripe in Japanese yen (JPY).",
        "The standard payment deadline is 48 hours after the payment request is issued, unless a different deadline is specified.",
        "Following payment verification and our final internal review, we will send a booking confirmation.",
        "The legal formation of the contract is governed by our applicable Terms & Conditions and Japanese law.",
      ].join("\n\n"),
    },
    {
      number: 3,
      title: "Guest Cancellations",
      body: "For confirmed bookings, the following cancellation fee schedule is proposed, subject to applicable law and contractual terms.",
      table: { headers: ["Cancellation Timing", "Cancellation Fee", "Refund"], rows: CANCELLATION_FEES },
      afterTable: [
        "Cancellation fees are calculated based on the total price of the affected booking, including applicable taxes.",
        "No cancellation fee will exceed the amount permitted by applicable law.",
      ].join("\n\n"),
    },
    {
      number: 4,
      title: "Cancellation Deadlines",
      body: [
        "All cancellation deadlines are calculated using Japan Standard Time (JST, UTC+9).",
        "A cancellation made seven or more calendar days before the tour must be received by 11:59 PM JST on the date seven days before the scheduled tour date.",
        "Cancellation requests must be submitted through our designated official contact channel.",
        "The effective cancellation time is when our designated system receives the request.",
      ].join("\n\n"),
    },
    {
      number: 5,
      title: "Rescheduling",
      body: [
        "One date change may be requested without a rescheduling fee if the request is received at least seven calendar days before the tour.",
        "All date changes are subject to guide availability and operational conditions.",
        "Requests made six or fewer days before the tour will be reviewed individually.",
        "Any applicable additional charges will be disclosed before the guest agrees to the change.",
      ].join("\n\n"),
    },
    {
      number: 6,
      title: "Group Size Changes",
      body: [
        "Before booking confirmation, the applicable price will be reviewed if the number of guests changes.",
        "After confirmation, group size changes are subject to availability, service capacity, timing, and applicable booking conditions.",
        "Any additional charges will be communicated in advance.",
      ].join("\n\n"),
    },
    {
      number: 7,
      title: "Late Arrivals and No-Shows",
      body: [
        "Guests are requested to contact Connectrip Japan or their assigned guide as soon as possible if they expect to arrive late.",
        "Our standard guide waiting period is 30 minutes from the scheduled meeting time.",
        "Late arrival does not normally extend the scheduled tour end time.",
        "If a guest has not arrived within 30 minutes and cannot be contacted, the booking may be treated as a no-show after reviewing the circumstances.",
      ].join("\n\n"),
    },
    {
      number: 8,
      title: "Weather and Cancellations by Connectrip Japan",
      body: [
        "Tours generally operate in ordinary rainy weather when conditions are safe.",
        "Connectrip Japan may cancel a tour if severe weather, natural disasters, or other safety conditions make the service unsafe to provide.",
        "If Connectrip Japan cancels a tour before it begins, guests will generally receive a full refund of the amount paid for the affected service.",
        "Where possible, an alternative date may be offered with the guest's agreement.",
      ].join("\n\n"),
    },
    {
      number: 9,
      title: "Refund Method",
      body: [
        "Approved refunds will generally be issued through Stripe to the original payment method.",
        "Refunds are calculated in Japanese yen (JPY).",
        "Amounts shown in a guest's home currency may differ due to exchange-rate fluctuations or card issuer conversion practices.",
        "The timing of the refund appearing on the guest's statement depends on the payment provider and card issuer.",
      ].join("\n\n"),
    },
    {
      number: 10,
      title: "Contact",
      // The business email of record (src/data/business-info.ts, also on the current site's Contact page).
      body: `For cancellation, rescheduling, or refund requests, please contact Connectrip Japan through our official support channel: ${businessInfo.email}`,
    },
  ],
  footerSignature: businessInfo.legalNameEn,
};

/** True while the draft may be shown (preview only, until a human approves it). */
export const CANCELLATION_POLICY_VISIBLE = V1_PREVIEW;

export function getCancellationPolicyViewModel(): CancellationPolicyViewModel {
  return {
    route: "cancelPolicy",
    seo: {
      title: proposed("Cancellation & Refund Policy", CANCELLATION_POLICY_SOURCE),
      description: tbd("Meta description TBD"),
      canonicalPath: routeHref("cancelPolicy"),
      noindex: true,
    },
    content: CANCELLATION_POLICY_VISIBLE
      ? proposed(POLICY, CANCELLATION_POLICY_SOURCE)
      : tbd("Cancellation & Refund Policy V1 is pending legal review (fee rates, contract formation, cancellation channel)"),
  };
}
