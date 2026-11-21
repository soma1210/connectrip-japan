import type {
  BusinessInquiryViewModel,
  CompanyProfileData,
  CompanyProfileViewModel,
} from "@/contracts";
import { BUSINESS_INQUIRY_JA } from "./data/businessInquiry";
import { COMPANY_PROFILE } from "./data/company";
import { routeHref } from "../routes";
import { proposed, tbd } from "./shared";
import { officerLine } from "./officers";

/**
 * Company Profile (English) and Business Inquiries (Japanese). The data lives
 * in content/data/ (Website v1 is the single source of truth; moved from the
 * retired legacy site on 2026-11-15). WORKING_BASELINE (W1-D09): not approved
 * for v1. The Cancellation Policy has its own V1 file: content/cancellationPolicy.ts.
 */
const SOURCE = "Website v1 data (content/data/). WORKING_BASELINE (W1-D09), not approved for v1";

function seo(title: string, path: string) {
  return {
    title: proposed(title, SOURCE),
    description: tbd("Meta description TBD"),
    canonicalPath: path,
    noindex: true,
  };
}

/**
 * Display adjustments on top of the company data (content/data/company.ts):
 * - 2026-10-24, Human instruction: add Soma Beppu as a Domestic Travel
 *   Services Manager (the row is hidden for now: HIDDEN_COMPANY_ROWS below);
 * - 2026-11-15, Human instruction: the representative's official title comes
 *   from content/officers.ts ("Representative Director & CEO"), followed by a
 *   "Deputy Representative" row (Soma Beppu, Director & Deputy
 *   Representative | EVP; label and title per Human instruction 2026-11-21).
 */
function withV1CompanyChanges(row: CompanyProfileData["rows"][number]): CompanyProfileData["rows"] {
  if (row.label === "Representative") {
    return [
      { ...row, value: officerLine("representative") },
      { label: "Deputy Representative", value: officerLine("deputy") },
    ];
  }
  if (row.label === "Domestic Travel Services Manager" && typeof row.value === "string") {
    return [{ ...row, value: [row.value, "Soma Beppu"] }];
  }
  if (row.label === "Business Activities" && Array.isArray(row.value)) {
    return [{ ...row, value: row.value.filter((item) => !HIDDEN_BUSINESS_ACTIVITIES.includes(item)) }];
  }
  return [row];
}

/**
 * Business activities hidden until the travel agency registration is complete
 * (management decision 2026-11-18): we do not sell package tours or arrange
 * accommodation or transport before then. The data (content/data/company.ts)
 * is kept; only the display drops them. Private guide services stay.
 */
export const HIDDEN_BUSINESS_ACTIVITIES: readonly string[] = [
  "Planning and sale of package tours",
  "Arrangement of accommodation, transport and experience programs",
];

/**
 * Rows hidden on Website v1 until the travel agency registration (Human
 * instruction 2026-11-15): passing the exam is not the same as being appointed
 * manager under a registration. The data (content/data/company.ts and the v1 change
 * above) is kept; only the display drops the row. Applies to every page built
 * from this view model: Company Profile (`/v1/company`, public `/company`) and
 * About (Company Overview). Remove the label here once the appointment is official.
 */
export const HIDDEN_COMPANY_ROWS: readonly string[] = ["Domestic Travel Services Manager"];

export function getCompanyProfileViewModel(): CompanyProfileViewModel {
  const c = COMPANY_PROFILE;
  return {
    route: "company",
    seo: seo(c.seo.title, routeHref("company")),
    content: proposed<CompanyProfileData>(
      { heading: c.heading, subheading: c.subheading, rows: c.rows.flatMap(withV1CompanyChanges).filter((row) => !HIDDEN_COMPANY_ROWS.includes(row.label)), footerSignature: c.footerSignature },
      SOURCE,
    ),
  };
}

// Cancellation Policy: Website v1 has its own V1 policy (content/cancellationPolicy.ts). The current
// site's policy (USD deposit, arrangement fees) contradicts the v1 booking model and is not shown on v1.

export function getBusinessInquiryViewModel(): BusinessInquiryViewModel {
  const b = BUSINESS_INQUIRY_JA;
  return {
    route: "businessInquiry",
    seo: seo(b.seo.title, routeHref("businessInquiry")),
    content: {
      copy: proposed({ eyebrow: b.eyebrow, heading: b.heading, description: b.description, ...b.form }, SOURCE),
      // The current site links its "reservation form". v1 has no reservation
      // form; Private Guide Inquiry is the closest page (TBD).
      noteLinkHref: routeHref("inquiry"),
      homeHref: routeHref("home"),
    },
  };
}
