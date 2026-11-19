import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { runMigrations, type MigrationFile } from "@/lib/migrations";
import type { Db, Queryable } from "@/lib/pg";

/**
 * Test database (tests only, never imported by the app): PGlite is the real
 * Postgres engine compiled to WebAssembly, in memory, so the SQL, CHECK /
 * UNIQUE constraints, transactions and row locks are Postgres' own.
 * Nothing leaves the machine and no real database is touched.
 */
function wrap(q: PGlite | Transaction): Queryable {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      // Several statements without parameters (a migration file): simple protocol, like pg / Neon.
      if (!params.length && text.trim().replace(/;\s*$/, "").includes(";")) {
        const results = await q.exec(text);
        return { rows: (results.at(-1)?.rows ?? []) as T[] };
      }
      return { rows: (await q.query<T>(text, params as unknown[])).rows };
    },
  };
}

export function pgliteDb(pg: PGlite): Db {
  return { ...wrap(pg), transaction: (fn) => pg.transaction((tx) => fn(wrap(tx))) };
}

export function migrationFiles(): MigrationFile[] {
  const dir = fileURLToPath(new URL("../../../sql/migrations/", import.meta.url));
  return readdirSync(dir)
    .filter((f) => /^\d{4}_[\w-]+\.sql$/.test(f))
    .map((name) => ({ name, sql: readFileSync(join(dir, name), "utf8") }));
}

/** A fresh in-memory database with every migration applied. */
export async function migratedTestDb(): Promise<{ pg: PGlite; db: Db }> {
  const pg = await PGlite.create();
  const db = pgliteDb(pg);
  await runMigrations(db, migrationFiles(), { apply: true });
  return { pg, db };
}
