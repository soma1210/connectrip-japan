import assert from "node:assert/strict";
import { bookableTour, OSAKA_LIKE_A_LOCAL_ID } from "@/lib/booking-request/tours";
import { validateBookingRequest } from "@/lib/booking-request/rules";
import { emptyTourRequest, toTourRequestBody, tourDateRange, tourStartTimes, validateTourRequest, type TourRequestValues } from "./tourBookingRequest";

// Run: bun --env-file=<empty file> src/website-v1/booking/tourBookingRequest.test.ts
const tour = bookableTour(OSAKA_LIKE_A_LOCAL_ID)!;
assert.ok(tour && tour.open);
const ID = "8f0c1c3e-6b1a-4e3a-9c2d-1a2b3c4d5e6f";

// 2026-11-10 03:00 JST: 11-12 09:30 is 54.5 h away (ok), 11-11 09:30 is 30.5 h away (too soon).
const NOW = Date.parse("2026-11-10T03:00:00+09:00");
const good: TourRequestValues = {
  ...emptyTourRequest(tour),
  preferredDate: "2026-11-12",
  guests: 4,
  fullName: "Test Customer",
  email: "test.customer@example.com",
  message: "Stroller-friendly route, please",
  consent: true,
};

// Defaults: the only start time and language are preselected, guests start at the minimum.
const empty = emptyTourRequest(tour);
assert.equal(empty.startTime, "09:30");
assert.equal(empty.language, "en");
assert.equal(empty.guests, 1);

// Date range: never a past date, starts at the first date 48 h ahead, ends 90 days out.
const range = tourDateRange(tour, NOW);
assert.equal(range.min, "2026-11-12");
assert.equal(range.max, "2027-02-08");
// Late in the day the next morning is also too soon: 2026-11-10 23:00 JST → 11-12 09:30 is 34.5 h away.
assert.equal(tourDateRange(tour, Date.parse("2026-11-10T23:00:00+09:00")).min, "2026-11-13");
assert.deepEqual(tourStartTimes(tour, "2026-11-11", NOW), []);
assert.deepEqual(tourStartTimes(tour, "2026-11-12", NOW), ["09:30"]);

// Required fields.
assert.deepEqual(validateTourRequest(tour, good, NOW), {});
const missing = validateTourRequest(tour, { ...empty }, NOW);
for (const f of ["preferredDate", "fullName", "email", "consent"] as const) assert.ok(missing[f], f);
assert.equal(validateTourRequest(tour, { ...good, startTime: "" }, NOW).startTime, "Choose a start time.");
assert.equal(validateTourRequest(tour, { ...good, language: "" }, NOW).language, "Choose a language.");

// Date and guests.
assert.ok(validateTourRequest(tour, { ...good, preferredDate: "2026-11-09" }, NOW).preferredDate, "past date");
assert.ok(validateTourRequest(tour, { ...good, preferredDate: "2026-11-11" }, NOW).preferredDate, "< 48 h");
assert.ok(validateTourRequest(tour, { ...good, preferredDate: "2027-02-09" }, NOW).preferredDate, "> 90 days");
assert.ok(validateTourRequest(tour, { ...good, guests: 0 }, NOW).guests);
assert.ok(validateTourRequest(tour, { ...good, guests: 7 }, NOW).guests);
assert.equal(validateTourRequest(tour, { ...good, guests: 6 }, NOW).guests, undefined);
assert.ok(validateTourRequest(tour, { ...good, email: "nope" }, NOW).email);
assert.ok(validateTourRequest(tour, { ...good, startTime: "10:00" }, NOW).startTime);

// The body the form sends passes the API rules unchanged (same tour entry on both sides).
const body = toTourRequestBody(tour, good, ID)!;
assert.equal(body.productType, "ready_made");
assert.equal(body.experienceId, OSAKA_LIKE_A_LOCAL_ID);
assert.equal(body.adults, 4);
assert.equal(body.children, 0);
assert.equal("amount" in body, false);
const server = validateBookingRequest(body, NOW, ID);
assert.equal(server.ok, true, JSON.stringify(server));
assert.equal(toTourRequestBody(tour, { ...good, consent: false }, ID), undefined);
assert.equal(toTourRequestBody(tour, good, "not-a-uuid"), undefined);

console.log("tour booking request ok");
