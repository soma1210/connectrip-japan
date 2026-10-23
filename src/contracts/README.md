# Interface Contract v0

Shared types between presentation (UI) and the technical system. Status:
**v0, PROPOSED**. Routes, URLs, copy and field sets in here follow Working
Baselines and are not approved decisions.

## Rules for presentation components

- Import types from `@/contracts` only. Do not import `@/lib/*`, API routes,
  the database, the mailer or analytics.
- Receive data through props typed by these contracts (`HomeViewModel`,
  `LayoutViewModel`, `ExperienceSummary`, `Experience`, `InquiryFormModel`).
- Render every `Tbd<T>` by its `status`:
  - `TBD` → a visible placeholder (design the empty state). Never invent copy.
  - `PROPOSED` / `APPROVED` → render `value`.
- Links: render the `href` you are given. Never hard-code paths.
- CTAs: spread `ctaDataAttributes(cta)` on the rendered element. Click tracking
  is attached by the integration layer; do not call analytics.
- Inquiry form: render `model.fields` in order, including the hidden honeypot
  input named `model.honeypotFieldName`. Submit only through the
  `InquirySubmitHandler` you receive as a prop; map `FieldErrorCode`s to
  messages in the UI.
- Images: use `alt`, `width` and `height` from `ImageAsset`.

## Fixtures

`@/contracts/fixtures` provides placeholder data for building UI before real
content exists. Every fixture string starts with `[FIXTURE]`.

| Fixture | Use |
|---|---|
| `homeFixture` / `homeFixtureTbd` | Home with drafted placeholders / with only TBD states |
| `layoutFixture` | Header / Footer |
| `experienceSummariesFixture` | Experiences list and Home teaser (one drafted, one mostly TBD) |
| `experienceDetailFixture` | Experience Detail template |
| `inquiryFormFixture` + `createMockInquirySubmit(scenario)` | Inquiry form; scenarios: `success`, `validation_error`, `server_error`, `network_error` (no network) |

Fixtures are for development only. Do not import them from production routes.

## Checks

`__checks__/contracts.typecheck.ts` holds compile-time guarantees (e.g. the Home
primary CTA can only lead to Experiences, Home has no review slot). It runs as
part of `tsc --noEmit` and `next build`.
