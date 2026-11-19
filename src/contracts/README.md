# Interface Contract v1

Shared types between presentation (UI) and the technical system. Status:
**v1, PROPOSED**. Routes, URLs, copy, field sets and section order follow
Working Baselines and are not approved decisions. Business values that are
not decided are `Tbd` — never fill them in UI.

## Working Decisions reflected (T-03)

| Decision | Contract |
|---|---|
| Two product paths: Ready-made (self booking + payment) / Private Guide (inquiry → consultation → individual payment) | `ExperienceSummary.productType`, `booking.ts`, `privateGuide.ts` |
| Experience Detail → Booking Flow, one page with steps | `RouteKey "booking"`, `Experience.cta: CtaSpec<"booking">`, `BookingStepKey` |
| Header primary CTA → Experiences; Private Guide in header navigation | `SiteNav.headerCta: CtaSpec<"experiences">`, `layoutFixture` |
| Ready-made is Osaka-first, not Osaka-only | `ExperienceId = GP-${string}`, `ExperienceSummary.market: AreaKey` |
| JPY is the v1 base / payment currency | `Money<C>`, `PaymentCurrency = "JPY"` |
| How It Works has two flows | `HowItWorksFlows` (`ready_made`, `private_guide`) |
| Social Proof: real content only | `VerifiedReview`, `SocialMetric` require source + `HumanVerification` |

Everything else (product content, 4h / 8h, price, max guests, children
policy, operating hours, included / excluded, cancellation, availability
rules, payment implementation, instant vs human confirmation, URLs, CTA copy,
guide profiles, SEO / AIO, consent, language scope) is TBD.

## Rules for presentation components

- Import types from `@/contracts` only. Do not import `@/lib/*`, API routes,
  the database, the mailer, payment providers or analytics.
- Receive data through props typed by these contracts. Page-level models:

  | Page | Model |
  |---|---|
  | Header / Footer | `LayoutViewModel` |
  | Home | `HomeViewModel` |
  | Experiences | `ExperiencesListViewModel` |
  | Experience Detail | `ExperienceDetailViewModel` |
  | Booking Flow | `BookingFlowViewModel` + `BookingFlowHandlers` |
  | Private Guide | `PrivateGuideViewModel` |
  | Inquiry | `InquiryViewModel` + `InquirySubmitHandler` |
  | How It Works | `HowItWorksViewModel` |
  | Osaka Travel Guide | `TravelGuideListViewModel` |
  | Guide Article | `TravelGuideArticleViewModel` |
  | About | `AboutViewModel` (added in T-04) |
  | Privacy Policy / Terms | `LegalPageViewModel` (added in T-04; legal text TBD) |

- Render every `Tbd<T>` by its `status`:
  - `TBD` → a visible placeholder (design the empty state). Never invent copy.
  - `PROPOSED` / `APPROVED` → render `value`.
- Links: render the `href` you are given. Never hard-code paths.
- CTAs: spread `ctaDataAttributes(cta)` on the rendered element. Click tracking
  is attached by the integration layer; do not call analytics. Render
  `cta.disabled` as a disabled state.
- Forms (Inquiry, Booking): render `fields` in order, including the hidden
  honeypot input named `honeypotFieldName`. `required` is `Tbd<boolean>`:
  while TBD, render the field as optional. Map `FieldErrorCode`s to messages
  in the UI.
- Images: use `alt`, `width` and `height` from `ImageAsset`. Only assets with
  rights / consent `CONFIRMED_BY_HUMAN` may ship (enforced by the content
  layer).
- Money: format `Money` with `Intl.NumberFormat`. JPY has no minor unit.

## Home

`HomeContent` has one slot per section (`HomeSectionKey`). Render sections in
`sectionOrder` order; while it is TBD, use the Working Baseline order:
hero → featuredExperiences → privateGuide → whyConnectrip → guides →
howItWorks → travelGuide → socialProof → finalCta. Header / Footer come from
`LayoutViewModel`.

## Booking Flow

One page, steps `selection → customer → payment → result`. The UI:

1. Loads availability through `handlers.getAvailability` (rules live on the
   server).
2. Submits through `handlers.submit`. On success it navigates to
   `payment.url` (hosted checkout). It never builds payment URLs.
3. After returning from checkout, the route sets `initialState`; the UI may
   poll `handlers.getStatus` while `payment_completed_pending_confirmation`.

Every `BookingFlowState` phase needs a designed state:

| Phase | Meaning |
|---|---|
| `initial` | Editing `selection` or `customer` |
| `submitting` | Creating the booking |
| `validation_error` | Field errors; return to `step` |
| `unavailable` | Slot taken, party does not fit, or booking closed |
| `error` | Rate limited / server / network / not found |
| `payment_pending` | Sent to (or at) checkout |
| `payment_cancelled` | Came back without paying |
| `payment_completed_pending_confirmation` | Paid; confirmation pending (instant vs human review is TBD) |
| `confirmed` | Booking confirmed |

## Private Guide

Not instantly bookable. The page (`PrivateGuideViewModel`) leads to the
Inquiry form with `kind: "private_guide"`. Proposal, price and payment happen
outside the website in v1, so there is no UI contract for them yet.

## Fixtures

`@/contracts/fixtures` provides placeholder data for building UI before real
content exists. Every fixture string starts with `[FIXTURE]`. Fixture URLs,
dates and start times are placeholders, not decisions.

| Fixture | Use |
|---|---|
| `homeFixture` / `homeFixtureTbd` | Home drafted / only TBD and empty states |
| `layoutFixture` | Header / Footer |
| `experienceSummariesFixture` | Experience cards (one drafted, one mostly TBD) |
| `experienceDetailFixture` / `experienceDetailClosedFixture` | Detail with booking open / closed |
| `bookingFlowFixture` | Booking Flow page |
| `bookingStateFixtures` | One `BookingFlowState` per phase |
| `createMockBookingHandlers(scenario, status)` | Mock availability / submit / status; scenarios: `success`, `validation_error`, `unavailable`, `server_error`, `network_error` (no network) |
| `privateGuideFixture` | Private Guide page |
| `privateGuideInquiryFormFixture` | Private Guide Inquiry form |
| `inquiryFormFixture` | General inquiry (T-02 candidates; keeping it is TBD) |
| `createMockInquirySubmit(scenario)` | Mock inquiry submit; scenarios: `success`, `validation_error`, `server_error`, `network_error` |
| `howItWorksFixture` / `howItWorksFlowsFixture` | How It Works page / two flows |
| `travelGuideListFixture` / `travelGuideArticleFixture` / `travelGuideArticleSummariesFixture` | Article list, detail (every block type), cards |
| `socialProofFixture` | Social Proof — intentionally no reviews or metrics |

There are no review fixtures: fixtures must not contain reviews that were not
verified against a real source. Design the review card from `VerifiedReview`.

Fixtures are for development only. Do not import them from production routes.

## Checks

`__checks__/contracts.typecheck.ts` holds compile-time guarantees, e.g.:

- Home hero primary CTA and Header CTA lead to Experiences only.
- Experience Detail CTA leads to Booking; Private Guide CTAs cannot.
- Experience ids are not Osaka-only; prices and booking totals are JPY.
- Booking contract and fixtures cover every required booking phase.
- Reviews and SNS metrics require a source and a human verification; the
  Social Proof fixture contains none.
- Every Home section has a content slot.

It runs as part of `tsc --noEmit` and `next build`.

## v0 → v1 changes

- `RouteKey`: + `booking`, `privateGuide`, `travelGuide`, `guideArticle`.
- `CtaSpec`: + `disabled`; `CtaPosition` + `card`.
- `SiteNav.headerCta`: `inquiry` → `experiences`.
- `ExperienceId`: `GP-OSA-${string}` → `GP-${string}`.
- `ExperienceSummary`: + `productType`, `market`, `price`, `bookCta`;
  `format` → `participation` (`private_party` / `shared`).
- `Experience`: + `bookingConditions`, `bookingState`, `privateGuideCta`;
  `cta` `inquiry` → `booking`; `price.maxPartySize` moved to
  `bookingConditions.maxGuests`; `price.unit` is now `Tbd`.
- `Money` moved to `money.ts` and became generic over currency.
- Form primitives moved to `form.ts`; `FieldSpec.required` is `Tbd<boolean>`.
- `InquiryFormModel`: + `kind`, `successMessage`; Private Guide fields added.
- `HomeContent` rebuilt around the v1 sections; `reviews?: never` replaced by
  `socialProof` (verified content only).
- `HowItWorksStep` moved to `howItWorks.ts` with step keys.
- New: `booking.ts`, `privateGuide.ts`, `howItWorks.ts`, `travelGuide.ts`,
  `socialProof.ts`.

## T-05 changes (Home Working Baseline, W1-D05 / W1-D06)

- `HomeContent.guides` and `HomeContent.socialProof` are optional (on hold,
  kept for re-adding later). `HomeSectionKey` still includes them.
- `HomeContent.hero.positioning` is optional.
- `HomeContent.privateGuide` gained optional `areas` and `interests`.
- How It Works step keys are four per flow:
  `find / choose_date / book / explore` and
  `tell_us / plan_together / confirm / explore`.
- Private Guide interests (Home, Private Guide page, Inquiry form) share one
  list, including `local_neighborhoods`.
