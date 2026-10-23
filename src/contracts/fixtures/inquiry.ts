import type { InquiryFormModel, InquirySubmitHandler, InquirySubmitResult } from "../inquiry";
import { tbd } from "../status";
import { fixtureHrefs, fixtureText } from "./shared";

/** Candidate fields from the Technical Migration Plan. PROPOSED, not approved. */
export const inquiryFormFixture: InquiryFormModel = {
  fieldsStatus: "PROPOSED",
  fields: [
    { name: "name", kind: "text", label: fixtureText("Name"), required: true, maxLength: 100 },
    { name: "email", kind: "email", label: fixtureText("Email"), required: true, maxLength: 254 },
    { name: "country", kind: "text", label: fixtureText("Country"), required: false, maxLength: 100 },
    { name: "travelDate", kind: "dateRange", label: fixtureText("Travel dates"), required: false },
    { name: "partySize", kind: "number", label: fixtureText("Adults"), required: false },
    {
      name: "children",
      kind: "children",
      label: fixtureText("Children"),
      helpText: tbd("Collecting children's ages depends on L-03"),
      required: false,
    },
    {
      name: "interests",
      kind: "multiselect",
      label: fixtureText("Interests"),
      required: false,
      options: [
        { value: "fixture_option_a", label: fixtureText("Option A") },
        { value: "fixture_option_b", label: fixtureText("Option B") },
      ],
    },
    {
      name: "selectedExperience",
      kind: "select",
      label: fixtureText("Experience"),
      required: false,
      options: [{ value: "GP-OSA-FIXTURE-A", label: fixtureText("Experience title fixture-a") }],
    },
    { name: "message", kind: "textarea", label: fixtureText("Message"), required: false, maxLength: 2000 },
    { name: "consent", kind: "checkbox", label: fixtureText("Consent"), required: true },
  ],
  preselectedExperience: { id: "GP-OSA-FIXTURE-A", title: fixtureText("Experience title fixture-a") },
  consent: { label: fixtureText("Consent label"), privacyHref: fixtureHrefs.privacy },
  submitLabel: fixtureText("Submit"),
  expectationNote: fixtureText("Inquiry is not a booking; what happens next"),
  honeypotFieldName: "website",
};

export type MockInquiryScenario = "success" | "validation_error" | "server_error" | "network_error";

const scenarioResults: Record<MockInquiryScenario, InquirySubmitResult> = {
  success: { ok: true },
  validation_error: {
    ok: false,
    kind: "validation",
    fieldErrors: { email: "invalid_format", consent: "required" },
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
