// Checks for the interview booking migration (sql/guide-interviews.sql).
// Prints no secrets: only the Neon endpoint id, database name and schema facts.
//
//   bun scripts/check-interview-db.mjs preflight   which database am I connected to?
//   bun scripts/check-interview-db.mjs verify      did the migration create everything?
//
// Run `preflight` before applying the migration and compare the endpoint id
// with the dev branch's compute endpoint in the Neon Console.

import { sql } from "@vercel/postgres";

const mode = process.argv[2];
if (!process.env.POSTGRES_URL || !["preflight", "verify"].includes(mode)) {
  console.error("Usage: bun scripts/check-interview-db.mjs preflight|verify (POSTGRES_URL must be set)");
  process.exit(1);
}

const host = new URL(process.env.POSTGRES_URL).hostname;
const endpoint = host.split(".")[0].replace(/-pooler$/, "");
const { rows: [info] } = await sql.query("SELECT current_database() AS db");
console.log(`Endpoint: ${endpoint}`);
console.log(`Database: ${info.db}`);

const tableExists = async (name) =>
  (await sql.query("SELECT to_regclass($1) IS NOT NULL AS ok", [`public.${name}`])).rows[0].ok;

if (mode === "preflight") {
  const hasApplications = await tableExists("guide_applications");
  const applications = hasApplications
    ? (await sql.query("SELECT count(*)::int AS n FROM guide_applications")).rows[0].n
    : "table missing";
  console.log(`guide_applications rows: ${applications}`);
  console.log(`guide_pipeline_statuses present: ${await tableExists("guide_pipeline_statuses")}`);
  console.log(`guide_interviews present: ${await tableExists("guide_interviews")}`);
  if (typeof applications === "number" && applications > 0) {
    console.log("\nNote: this database holds applications. If it is a copy of production, they are real people —");
    console.log("test only with your own test applicants and never send invitations to the copied ones.");
  }
  process.exit(0);
}

// verify
const expectedConstraints = {
  guide_interviews_pkey: "p",
  guide_interviews_guide_application_id_fkey: "f",
  guide_interviews_booking_token_hash_key: "u",
  guide_interviews_status_check: "c",
  guide_interviews_requested_time_check: "c",
  guide_interviews_time_required_check: "c",
  guide_interviews_meet_after_approval_check: "c",
  guide_interviews_no_overlap: "x",
};
const expectedIndexes = [
  "guide_interviews_one_open_per_application_idx",
  "guide_interviews_application_idx",
  "guide_interviews_status_idx",
  "guide_interviews_requested_start_idx",
];

let failed = false;
const check = (ok, label) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}`);
  if (!ok) failed = true;
};

check(await tableExists("guide_interviews"), "table guide_interviews");
const ext = await sql.query("SELECT 1 FROM pg_extension WHERE extname = 'btree_gist'");
check(ext.rows.length === 1, "extension btree_gist");

const { rows: constraints } = await sql.query(
  "SELECT conname, contype FROM pg_constraint WHERE conrelid = 'public.guide_interviews'::regclass",
);
const found = Object.fromEntries(constraints.map((c) => [c.conname, c.contype]));
for (const [name, type] of Object.entries(expectedConstraints)) {
  check(found[name] === type, `constraint ${name} (${type})`);
}

const { rows: indexes } = await sql.query(
  "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'guide_interviews'",
);
for (const name of expectedIndexes) {
  check(indexes.some((i) => i.indexname === name), `index ${name}`);
}
const openIdx = indexes.find((i) => i.indexname === "guide_interviews_one_open_per_application_idx");
check(Boolean(openIdx?.indexdef.includes("UNIQUE") && openIdx.indexdef.includes("WHERE")), "open-interview index is UNIQUE and partial");

console.log(failed ? "\nSome checks failed." : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
