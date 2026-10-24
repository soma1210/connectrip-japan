import type {
  BusinessInquiryViewModel,
  CancellationPolicyData,
  CancellationPolicyViewModel,
  CompanyProfileData,
  CompanyProfileViewModel,
} from "@/contracts";
import currentSiteEn from "../../../messages/en.json";
import currentSiteJa from "../../../messages/ja.json";
import { routeHref } from "../routes";
import { proposed, tbd } from "./shared";

/**
 * Company Profile and Cancellation Policy, ported as-is from the current
 * site's English version (messages/en.json). Business Inquiries, ported from
 * the Japanese version (messages/ja.json). WORKING_BASELINE
 * (W1-D09): not approved for v1. The Cancellation Policy reflects the current
 * site's service model and has not been reconciled with v1 (TBD).
 */
const SOURCE = "Current site page (messages/en.json or ja.json). WORKING_BASELINE (W1-D09), not approved for v1";

function seo(title: string, path: string) {
  return {
    title: proposed(title, SOURCE),
    description: tbd("Meta description TBD"),
    canonicalPath: path,
    noindex: true,
  };
}

/**
 * v1-only changes on top of the current site's data (the current site itself
 * is not changed). 2026-10-24, Human instruction: add Soma Beppu as a
 * Domestic Travel Services Manager.
 */
function withV1CompanyChanges(row: CompanyProfileData["rows"][number]): CompanyProfileData["rows"][number] {
  if (row.label === "Domestic Travel Services Manager" && typeof row.value === "string") {
    return { ...row, value: [row.value, "Soma Beppu"] };
  }
  return row;
}

export function getCompanyProfileViewModel(): CompanyProfileViewModel {
  const c = currentSiteEn.company;
  return {
    route: "company",
    seo: seo(c.seo.title, routeHref("company")),
    content: proposed<CompanyProfileData>(
      { heading: c.heading, subheading: c.subheading, rows: c.rows.map(withV1CompanyChanges), footerSignature: c.footerSignature },
      SOURCE,
    ),
  };
}

export function getCancellationPolicyViewModel(): CancellationPolicyViewModel {
  const c = currentSiteEn.cancelPolicy;
  return {
    route: "cancelPolicy",
    seo: seo(c.seo.title, routeHref("cancelPolicy")),
    content: proposed<CancellationPolicyData>(
      {
        heading: c.heading,
        subheading: c.subheading,
        intro: c.intro,
        sections: c.sections as CancellationPolicyData["sections"],
        footerSignature: c.footerSignature,
      },
      SOURCE,
    ),
  };
}

export function getBusinessInquiryViewModel(): BusinessInquiryViewModel {
  const b = currentSiteJa.businessInquiry;
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
