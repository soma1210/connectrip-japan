import type { InquiryFormModel, InquirySubmitHandler, InquirySubmitResult } from "../inquiry";
import { proposed, tbd } from "../status";
import { fixtureHrefs, fixtureText } from "./shared";

const REQUIRED_TBD = "Required / optional not decided";

/**
 * Private Guide Inquiry (Website v1 §4 candidates). PROPOSED: required /
 * optional, validation and storage are not decided, so `required` is TBD
 * and no length limits are set.
 */
export const privateGuideInquiryFormFixture: InquiryFormModel = {
  kind: "private_guide",
  fieldsStatus: "PROPOSED",
  fields: [
    { name: "name", kind: "text", label: fixtureText("Name"), required: tbd(REQUIRED_TBD) },
    { name: "email", kind: "email", label: fixtureText("Email"), required: tbd(REQUIRED_TBD) },
    { name: "preferredDate", kind: "date", label: fixtureText("Preferred date"), required: tbd(REQUIRED_TBD) },
    { name: "partySize", kind: "number", label: fixtureText("Adults"), required: tbd(REQUIRED_TBD) },
    {
      name: "children",
      kind: "children",
      label: fixtureText("Children"),
      helpText: tbd("Collecting children's ages depends on consent policy"),
      required: tbd(REQUIRED_TBD),
    },
    {
      name: "destinations",
      kind: "multiselect",
      label: fixtureText("Where would you like to go?"),
      required: tbd(REQUIRED_TBD),
      options: [
        { value: "osaka", label: fixtureText("Osaka") },
        { value: "kyoto", label: fixtureText("Kyoto") },
        { value: "kobe", label: fixtureText("Kobe") },
        { value: "nara", label: fixtureText("Nara") },
        { value: "other", label: fixtureText("Other") },
      ],
    },
    {
      name: "activities",
      kind: "multiselect",
      label: fixtureText("What would you like to do?"),
      required: tbd(REQUIRED_TBD),
      options: [
        { value: "food", label: fixtureText("Food") },
        { value: "culture", label: fixtureText("Culture") },
        { value: "shopping", label: fixtureText("Shopping") },
        { value: "famous_sights", label: fixtureText("Famous Sights") },
        { value: "family_activities", label: fixtureText("Family Activities") },
        { value: "hidden_gems", label: fixtureText("Hidden Gems") },
        { value: "local_neighborhoods", label: fixtureText("Local neighborhoods") },
        { value: "other", label: fixtureText("Other") },
      ],
    },
    {
      name: "placesToVisit",
      kind: "textarea",
      label: fixtureText("Places you already want to visit"),
      required: tbd(REQUIRED_TBD),
    },
    {
      name: "idealDay",
      kind: "textarea",
      label: fixtureText("Tell us about your ideal day in Kansai"),
      required: tbd(REQUIRED_TBD),
    },
    { name: "notes", kind: "textarea", label: fixtureText("Anything we should know?"), required: tbd(REQUIRED_TBD) },
  ],
  consent: { label: tbd("Consent policy TBD"), privacyHref: fixtureHrefs.privacy },
  submitLabel: fixtureText("Submit"),
  expectationNote: fixtureText("Inquiry is not a booking; we review and send a plan and price"),
  successMessage: fixtureText("Thanks — what happens next"),
  honeypotFieldName: "website",
};

const T02_SOURCE = "T-02 candidate (Technical Migration Plan)";

/**
 * General inquiry (T-02 candidate fields). Whether the Inquiry page keeps a
 * general form next to Private Guide is TBD.
 */
export const inquiryFormFixture: InquiryFormModel = {
  kind: "general",
  fieldsStatus: "PROPOSED",
  fields: [
    { name: "name", kind: "text", label: fixtureText("Name"), required: proposed(true, T02_SOURCE), maxLength: 100 },
    { name: "email", kind: "email", label: fixtureText("Email"), required: proposed(true, T02_SOURCE), maxLength: 254 },
    { name: "country", kind: "text", label: fixtureText("Country"), required: proposed(false, T02_SOURCE), maxLength: 100 },
    { name: "travelDate", kind: "dateRange", label: fixtureText("Travel dates"), required: proposed(false, T02_SOURCE) },
    { name: "partySize", kind: "number", label: fixtureText("Adults"), required: proposed(false, T02_SOURCE) },
    {
      name: "children",
      kind: "children",
      label: fixtureText("Children"),
      helpText: tbd("Collecting children's ages depends on L-03"),
      required: proposed(false, T02_SOURCE),
    },
    {
      name: "interests",
      kind: "multiselect",
      label: fixtureText("Interests"),
      required: proposed(false, T02_SOURCE),
      options: [
        { value: "fixture_option_a", label: fixtureText("Option A") },
        { value: "fixture_option_b", label: fixtureText("Option B") },
      ],
    },
    {
      name: "selectedExperience",
      kind: "select",
      label: fixtureText("Experience"),
      required: proposed(false, T02_SOURCE),
      options: [{ value: "GP-OSA-FIXTURE-A", label: fixtureText("Experience title fixture-a") }],
    },
    {
      name: "message",
      kind: "textarea",
      label: fixtureText("Message"),
      required: proposed(false, T02_SOURCE),
      maxLength: 2000,
    },
    { name: "consent", kind: "checkbox", label: fixtureText("Consent"), required: proposed(true, T02_SOURCE) },
  ],
  preselectedExperience: { id: "GP-OSA-FIXTURE-A", title: fixtureText("Experience title fixture-a") },
  consent: { label: fixtureText("Consent label"), privacyHref: fixtureHrefs.privacy },
  submitLabel: fixtureText("Submit"),
  expectationNote: fixtureText("Inquiry is not a booking; what happens next"),
  successMessage: fixtureText("Thanks — what happens next"),
  honeypotFieldName: "website",
};

export type MockInquiryScenario = "success" | "validation_error" | "server_error" | "network_error";

const scenarioResults: Record<MockInquiryScenario, InquirySubmitResult> = {
  success: { ok: true },
  validation_error: {
    ok: false,
    kind: "validation",
    fieldErrors: { email: "invalid_format", destinations: "required" },
  },
  server_error: { ok: false, kind: "server" },
  network_error: { ok: false, kind: "network" },
};

/** Mock submit handler for UI work. Makes no network request. */
export function createMockInquirySubmit(
  scenario: MockInquiryScenario = "success",
  delayMs = 800,
): InquirySubmitHandler {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => resolve(scenarioResults[scenario]), delayMs);
    });
}
