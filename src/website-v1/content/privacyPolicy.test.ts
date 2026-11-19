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
console.log("Privacy: 14 sections visible; no unresolved tokens; release checks remain unresolved.");
