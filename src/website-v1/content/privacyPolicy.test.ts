import assert from "node:assert/strict";
import {
  PRIVACY_POLICY, PRIVACY_POLICY_VISIBLE, PRIVACY_TECH_CHECKS,
  privacyPolicyContentReady, privacyPolicyPlaceholders, privacyPolicyPublishable,
  type PolicyBlock,
} from "./privacyPolicy";

assert.equal(privacyPolicyContentReady(), true);
assert.equal(PRIVACY_POLICY_VISIBLE, true, "Public mode must render the body");
assert.equal(PRIVACY_POLICY.sections.length, 14);
assert.deepEqual(PRIVACY_POLICY.sections.map(s => s.number), Array.from({length: 14}, (_, i) => i + 1));
assert.deepEqual(privacyPolicyPlaceholders(), []);
const body = JSON.stringify(PRIVACY_POLICY.sections.map(s => s.blocks));
assert.doesNotMatch(body, /\{\{|TO CONFIRM|TBD|DRAFT/);
assert.match(body, /Article 28/);
assert.match(body, /If you pay an invoice through Stripe/);
const providerTable = PRIVACY_POLICY.sections[6].blocks.find(b => b.kind === "table") as Extract<PolicyBlock, {kind: "table"}>;
assert.equal(providerTable.headers.length, 3);
assert.ok(providerTable.rows.every(row => row.length === 3));
// Display permission must never silently turn incomplete legal/operational checks green.
assert.equal(privacyPolicyPublishable(), false);
assert.equal(PRIVACY_TECH_CHECKS.find(c => c.id === "privacyContactDelivery")?.done, false);
assert.ok(PRIVACY_POLICY.sections[7].pending);
// Google Analytics (2026-11-24): the old "no analytics" statements are gone, the consent rules are stated,
// and the GA4 settings the text depends on stay open release checks until a person confirms them.
assert.doesNotMatch(body, /does not load tools such as Google Analytics|does not currently use cookies for analytics/);
const cookies = JSON.stringify(PRIVACY_POLICY.sections[8].blocks);
for (const s of ["Google LLC", "Accept Analytics", "Reject Analytics", "Cookie Settings", "withdraw", "after 14 months", "not linked to Google Ads", "https://policies.google.com/technologies/partner-sites", "Section 14"]) assert.ok(cookies.includes(s), s);
assert.ok(PRIVACY_POLICY.sections[8].pending);
assert.ok(providerTable.rows.some(row => row[0] === "Google (Google Analytics)"));
// The GA4 settings were confirmed by a person (2026-11-24); the legal items in Sections 8 and 9 stay open.
for (const id of ["ga4Retention", "ga4NoAdvertising", "ga4ProductionOnly"]) assert.ok(PRIVACY_TECH_CHECKS.some(c => c.id === id), id);
console.log("Privacy: 14 sections visible; no unresolved tokens; release checks remain unresolved.");
