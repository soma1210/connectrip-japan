// Setup: creates the gallery/vlog/reviews and guide-application tables in the
// Neon development branch. Run with `bun run db:init`, which reads
// POSTGRES_URL from .env.development.local.
//
// This script only runs as the connectrip_nonprod role, which exists only on
// the development branch. Production schema changes are applied by a person
// in the Neon SQL Editor (Workspace docs/os/runbooks/db-migration.md).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sql } from "@vercel/postgres";
import { connectionRole, NONPROD_ROLE } from "../src/lib/db-guard.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.POSTGRES_URL) {
  console.error("POSTGRES_URL is not set. Put the development branch URL in .env.development.local first.");
  process.exit(1);
}

if (connectionRole(process.env.POSTGRES_URL) !== NONPROD_ROLE) {
  console.error(
    `Refusing to run: POSTGRES_URL must connect as ${NONPROD_ROLE} (Neon development branch). ` +
      "Production schema changes are applied by a person in the Neon SQL Editor.",
  );
  process.exit(1);
}

// With no argument this runs sql/schema.sql, as before. Pass a path to run
// only that file instead (e.g. an additive table set):
//   node scripts/init-db.mjs sql/partner-applications.sql
const file = process.argv[2]
  ? join(process.cwd(), process.argv[2])
  : join(__dirname, "../sql/schema.sql");
const schema = readFileSync(file, "utf8");
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Database initialized (${statements.length} statements executed).`);
