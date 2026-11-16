/**
 * Apply sql/migrations to the database in POSTGRES_URL_NON_POOLING (direct)
 * or POSTGRES_URL (pooled). Dry run by default:
 *
 *   bun run db:migrate              # lists pending migrations, changes nothing
 *   bun run db:migrate -- --apply   # applies them (additive only, see src/lib/migrations.ts)
 *
 * Run against a test / branch database first. The connection string is never printed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@vercel/postgres";
import { runMigrations, type MigrationFile } from "@/lib/migrations";
import { dbFromEnv, type Db, type Queryable } from "@/lib/pg";

const apply = process.argv.includes("--apply");
const dir = fileURLToPath(new URL("../sql/migrations/", import.meta.url));
const files: MigrationFile[] = readdirSync(dir)
  .filter((f) => /^\d{4}_[\w-]+\.sql$/.test(f))
  .map((name) => ({ name, sql: readFileSync(join(dir, name), "utf8") }));

const direct = process.env.POSTGRES_URL_NON_POOLING?.trim();
const pooled = process.env.POSTGRES_URL?.trim();
if (!direct && !pooled) {
  console.error("Set POSTGRES_URL_NON_POOLING or POSTGRES_URL (test / branch database first).");
  process.exit(1);
}

let close: () => Promise<void>;
let db: Db;
if (direct) {
  const client = createClient({ connectionString: direct });
  await client.connect();
  const q: Queryable = {
    async query<T>(text: string, params: unknown[] = []) {
      return { rows: (await client.query(text, params as never[])).rows as T[] };
    },
  };
  db = {
    ...q,
    async transaction(fn) {
      await client.query("BEGIN");
      try {
        const value = await fn(q);
        await client.query("COMMIT");
        return value;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      }
    },
  };
  close = () => client.end();
} else {
  // The app's own pool (same settings as the running site, including the local test proxy in development).
  const appDb = dbFromEnv();
  if (!appDb) {
    console.error("POSTGRES_URL was not accepted (use the pooled connection string).");
    process.exit(1);
  }
  db = appDb;
  close = async () => {};
}

try {
  const report = await runMigrations(db, files, { apply });
  console.log(`already applied: ${report.alreadyApplied.join(", ") || "-"}`);
  if (apply) console.log(`applied now:     ${report.applied.join(", ") || "-"}`);
  else console.log(`pending:         ${report.pending.join(", ") || "-"}\n(dry run: add --apply to apply)`);
} catch (error) {
  console.error(`Migration stopped: ${(error as Error).message}`);
  process.exitCode = 1;
} finally {
  await close();
}
// The app pool keeps idle connections open; the run is over.
process.exit(process.exitCode ?? 0);
