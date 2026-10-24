import type { AreaKey, InquiryFormModel, InquiryViewModel, PrivateGuideActivity } from "@/contracts";
import { routeHref } from "../routes";
import { ACTIVITY_LABELS, AREA_LABELS } from "./privateGuide";
import { pageName, pageSeo, proposed, tbd } from "./shared";

const SOURCE = "Private Guide Inquiry WORKING_BASELINE (W1-D01 §4). Copy TBD";
const label = (text: string) => proposed(text, SOURCE);
const REQUIRED_TBD = "Required / optional TBD";

/**
 * Private Guide Inquiry form. Field candidates and wording come from the
 * baseline; required / optional, validation, storage and consent are TBD.
 * The preview submits to a mock handler only (no backend).
 */
export function getPrivateGuideInquiryForm(): InquiryFormModel {
  return {
    kind: "private_guide",
    fieldsStatus: "PROPOSED",
    fields: [
      { name: "name", kind: "text", label: label("Name"), required: tbd(REQUIRED_TBD) },
      { name: "email", kind: "email", label: label("Email"), required: tbd(REQUIRED_TBD) },
      { name: "preferredDate", kind: "date", label: label("Preferred Date"), required: tbd(REQUIRED_TBD) },
      { name: "partySize", kind: "number", label: label("Adults"), required: tbd(REQUIRED_TBD) },
      {
        name: "children",
        kind: "children",
        label: label("Children"),
        helpText: tbd("Whether to ask children's ages depends on the consent policy"),
        required: tbd(REQUIRED_TBD),
      },
      {
        name: "destinations",
        kind: "multiselect",
        label: label("Where would you like to go?"),
        required: tbd(REQUIRED_TBD),
        options: (Object.keys(AREA_LABELS) as AreaKey[]).map((value) => ({ value, label: AREA_LABELS[value] })),
      },
      {
        name: "activities",
        kind: "multiselect",
        label: label("What would you like to do?"),
        required: tbd(REQUIRED_TBD),
        options: (Object.keys(ACTIVITY_LABELS) as PrivateGuideActivity[]).map((value) => ({
          value,
          label: ACTIVITY_LABELS[value],
        })),
      },
      { name: "placesToVisit", kind: "textarea", label: label("Places you already want to visit"), required: tbd(REQUIRED_TBD) },
      { name: "idealDay", kind: "textarea", label: label("Tell us about your ideal day in Kansai"), required: tbd(REQUIRED_TBD) },
      { name: "notes", kind: "textarea", label: label("Anything we should know?"), required: tbd(REQUIRED_TBD) },
    ],
    consent: { label: tbd("Consent wording TBD (consent policy)"), privacyHref: routeHref("privacy") },
    submitLabel: tbd("Submit button copy TBD"),
    expectationNote: tbd("'An inquiry is not a booking' note and what happens next: copy TBD"),
    successMessage: tbd("Success message TBD"),
    honeypotFieldName: "website",
  };
}

export function getInquiryViewModel(): InquiryViewModel {
  return {
    route: "inquiry",
    seo: pageSeo("Inquiry", routeHref("inquiry")),
    content: {
      intro: { headline: pageName("Inquiry"), supporting: tbd("Inquiry intro copy TBD") },
      form: getPrivateGuideInquiryForm(),
    },
  };
}
