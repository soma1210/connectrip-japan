import { sql as vercelSql } from "@vercel/postgres";
import { checkDbTarget, isNonProductionEnv } from "@/lib/db-guard.mjs";

// NODE_ENV is read as a literal so Next.js inlines it at build time, the same
// way the storage-mode checks in src/lib/data do.
const guardEnv = { ...process.env, NODE_ENV: process.env.NODE_ENV };
const target = checkDbTarget(guardEnv);

if (target.reason) console.error(`[db-guard] Database disabled: ${target.reason}`);

export const isDbConfigured = target.ok;
export const dbGuardReason = target.reason;
export const isNonProduction = isNonProductionEnv(guardEnv);

function refuse(): never {
  throw new Error(`[db-guard] Database disabled: ${target.reason ?? "POSTGRES_URL is not set."}`);
}

// When the guard refuses, isDbConfigured is false and callers take their
// no-database path; this stub only catches a caller that skips that check.
export const sql: typeof vercelSql = target.ok
  ? vercelSql
  : (Object.assign(refuse, { query: refuse }) as unknown as typeof vercelSql);
