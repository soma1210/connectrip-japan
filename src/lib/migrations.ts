import { createHash } from "node:crypto";
import type { Db } from "@/lib/pg";

/**
 * Forward-only, additive SQL migrations (Phase 1, 2026-11-16).
 * Run with `bun run db:migrate` (dry run) / `bun run db:migrate -- --apply`.
 *
 * - Files in sql/migrations, applied in name order, each in its own
 *   transaction under an advisory lock (two runners never interleave).
 * - schema_migrations records name + SHA-256; an applied file that was
 *   edited afterwards stops the run (fix forward with a new file instead).
 * - Statements that delete or rewrite data or structure (DROP, TRUNCATE,
 *   DELETE, UPDATE, RENAME, ALTER COLUMN … TYPE) are refused: production
 *   data is never removed or overwritten by a migration.
 */

export type MigrationFile = { name: string; sql: string };
export type MigrationReport = { applied: string[]; pending: string[]; alreadyApplied: string[] };

const LOCK_KEY = 4_200_211_160; // any constant, shared by every runner
const DESTRUCTIVE =
  /\b(DROP\s+(TABLE|COLUMN|INDEX|SCHEMA|TYPE|VIEW|CONSTRAINT|TRIGGER|FUNCTION)|TRUNCATE|DELETE\s+FROM|UPDATE\s+[\w."]+\s+SET|RENAME\s+(TO|COLUMN)|ALTER\s+COLUMN\s+[\w"]+\s+(SET\s+DATA\s+)?TYPE)\b/i;

export function migrationChecksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

/** SQL without comments (so the destructive check reads statements only). */
function stripComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
}

export function destructiveStatement(sql: string): string | null {
  const match = stripComments(sql).match(DESTRUCTIVE);
  return match ? match[0] : null;
}

export async function runMigrations(db: Db, files: MigrationFile[], { apply }: { apply: boolean }): Promise<MigrationReport> {
  const ordered = [...files].sort((a, b) => a.name.localeCompare(b.name));
  for (const f of ordered) {
    const bad = destructiveStatement(f.sql);
    if (bad) throw new Error(`${f.name}: refused, destructive statement "${bad}"`);
  }

  const tableExists = (await db.query<{ t: string | null }>(`SELECT to_regclass('public.schema_migrations')::text AS t`)).rows[0]?.t;
  const applied = new Map<string, string>();
  if (tableExists) {
    for (const r of (await db.query<{ name: string; checksum: string }>(`SELECT name, checksum FROM schema_migrations`)).rows) applied.set(r.name, r.checksum);
  }
  for (const f of ordered) {
    const sum = applied.get(f.name);
    if (sum && sum !== migrationChecksum(f.sql)) throw new Error(`${f.name}: already applied with another checksum; add a new migration instead of editing it`);
  }

  const report: MigrationReport = { applied: [], pending: [], alreadyApplied: ordered.filter((f) => applied.has(f.name)).map((f) => f.name) };
  const pending = ordered.filter((f) => !applied.has(f.name));
  if (!apply) {
    report.pending = pending.map((f) => f.name);
    return report;
  }

  await db.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  );
  for (const f of pending) {
    const done = await db.transaction(async (tx) => {
      await tx.query(`SELECT pg_advisory_xact_lock($1)`, [LOCK_KEY]);
      const again = await tx.query(`SELECT 1 FROM schema_migrations WHERE name = $1`, [f.name]);
      if (again.rows.length) return false; // another runner applied it meanwhile
      await tx.query(f.sql);
      await tx.query(`INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)`, [f.name, migrationChecksum(f.sql)]);
      return true;
    });
    if (done) report.applied.push(f.name);
    else report.alreadyApplied.push(f.name);
  }
  return report;
}
