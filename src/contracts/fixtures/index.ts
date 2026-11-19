// Development fixtures for building UI against the contracts. Never import
// these from production routes; real data comes from the content layer.
export { layoutFixture } from "./layout";
export { peopleFixture } from "./people";
export {
  bookingConditionsTbd,
  experienceSummariesFixture,
  experienceDetailFixture,
  experienceDetailClosedFixture,
} from "./experiences";
export {
  bookingFlowFixture,
  bookingStateFixtures,
  bookingSummaryFixture,
  createMockBookingHandlers,
  type BookingFixtureState,
  type MockBookingScenario,
} from "./booking";
export { howItWorksFixture, howItWorksFlowsFixture } from "./howItWorks";
export { privateGuideFixture } from "./privateGuide";
export {
  travelGuideArticleSummariesFixture,
  travelGuideListFixture,
  travelGuideArticleFixture,
  travelGuideArticleRecordFixture,
} from "./travelGuide";
export { socialProofFixture } from "./socialProof";
export { homeFixture, homeFixtureTbd } from "./home";
export {
  inquiryFormFixture,
  privateGuideInquiryFormFixture,
  createMockInquirySubmit,
  type MockInquiryScenario,
} from "./inquiry";
export { FIXTURE_SOURCE } from "./shared";
