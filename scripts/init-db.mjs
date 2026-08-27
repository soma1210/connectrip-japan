// One-time setup: creates the gallery/vlog/reviews tables in the connected
// Vercel Postgres database. Run with `bun run db:init` after linking
// Postgres to this project (so POSTGRES_URL is available, e.g. via
// `vercel env pull .env.local`).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sql } from "@vercel/postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.POSTGRES_URL) {
  console.error(
    "POSTGRES_URL is not set. Connect Vercel Postgres to this project and run `vercel env pull .env.local` first.",
  );
  process.exit(1);
}

const schema = readFileSync(join(__dirname, "../sql/schema.sql"), "utf8");
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Database initialized (${statements.length} statements executed).`);
