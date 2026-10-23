// Development fixtures for building UI against the contracts. Never import
// these from production routes; real data comes from the content layer.
export { layoutFixture } from "./layout";
export { peopleFixture } from "./people";
export { experienceSummariesFixture, experienceDetailFixture } from "./experiences";
export { homeFixture, homeFixtureTbd } from "./home";
export { inquiryFormFixture, createMockInquirySubmit, type MockInquiryScenario } from "./inquiry";
export { FIXTURE_SOURCE } from "./shared";
