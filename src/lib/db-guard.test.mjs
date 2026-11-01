// Run with `bun run test` (node --test). URLs here are fake and point nowhere.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDbTarget, connectionRole, NONPROD_ROLE } from "./db-guard.mjs";

const PROD_URL = "postgres://neondb_owner:x@ep-prod-pooler.example.test/neondb";
const NONPROD_URL = `postgres://${NONPROD_ROLE}:x@ep-dev-pooler.example.test/neondb`;

test("no POSTGRES_URL: not configured, no error", () => {
  assert.deepEqual(checkDbTarget({ NODE_ENV: "production" }), { ok: false, reason: null });
});

test("Netlify production with the production role: allowed", () => {
  assert.equal(checkDbTarget({ NODE_ENV: "production", POSTGRES_URL: PROD_URL }).ok, true);
});

test("Vercel production with the production role: allowed", () => {
  const env = { NODE_ENV: "production", VERCEL_ENV: "production", POSTGRES_URL: PROD_URL };
  assert.equal(checkDbTarget(env).ok, true);
});

test("production with the test role: refused", () => {
  const result = checkDbTarget({ NODE_ENV: "production", POSTGRES_URL: NONPROD_URL });
  assert.equal(result.ok, false);
  assert.match(result.reason, /must not connect/);
});

test("Vercel preview with the production role: refused", () => {
  const env = { NODE_ENV: "production", VERCEL_ENV: "preview", POSTGRES_URL: PROD_URL };
  assert.equal(checkDbTarget(env).ok, false);
});

test("Vercel preview with the test role: allowed", () => {
  const env = { NODE_ENV: "production", VERCEL_ENV: "preview", POSTGRES_URL: NONPROD_URL };
  assert.equal(checkDbTarget(env).ok, true);
});

test("Vercel development with the production role: refused", () => {
  const env = { NODE_ENV: "development", VERCEL_ENV: "development", POSTGRES_URL: PROD_URL };
  assert.equal(checkDbTarget(env).ok, false);
});

test("Netlify deploy preview / branch deploy with the production role: refused", () => {
  for (const CONTEXT of ["deploy-preview", "branch-deploy"]) {
    assert.equal(checkDbTarget({ NODE_ENV: "production", CONTEXT, POSTGRES_URL: PROD_URL }).ok, false);
  }
});

test("local next dev: production role refused, test role allowed", () => {
  assert.equal(checkDbTarget({ NODE_ENV: "development", POSTGRES_URL: PROD_URL }).ok, false);
  assert.equal(checkDbTarget({ NODE_ENV: "development", POSTGRES_URL: NONPROD_URL }).ok, true);
});

test("plain node script (NODE_ENV unset) with the production role: refused", () => {
  assert.equal(checkDbTarget({ POSTGRES_URL: PROD_URL }).ok, false);
});

test("unreadable URL: refused outside production, unchanged in production", () => {
  assert.equal(checkDbTarget({ NODE_ENV: "development", POSTGRES_URL: "not a url" }).ok, false);
  assert.equal(checkDbTarget({ NODE_ENV: "production", POSTGRES_URL: "not a url" }).ok, true);
});

test("reasons never contain the URL", () => {
  const env = { NODE_ENV: "development", POSTGRES_URL: PROD_URL };
  assert.ok(!checkDbTarget(env).reason.includes("ep-prod"));
});

test("connectionRole reads percent-encoded roles", () => {
  assert.equal(connectionRole("postgres://a%2Bb:x@h/db"), "a+b");
  assert.equal(connectionRole("nope"), null);
});
