import { neonConfig } from "@neondatabase/serverless";
import { createPool, type VercelPool } from "@vercel/postgres";

/**
 * Minimal Postgres access for the inquiry system and admin sessions
 * (Phase 1, 2026-11-16). Parameterised queries only.
 *
 * Production: the existing `@vercel/postgres` pool (POSTGRES_URL, a pooled
 * Neon connection string). Tests: any object with the same two methods
 * (PGlite, see src/lib/inquiries/db.test.ts).
 */
export type QueryResult<T> = { rows: T[] };

export type Queryable = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
};

export type Db = Queryable & {
  /** BEGIN … COMMIT on one connection; ROLLBACK when `fn` throws. */
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
};

let cached: { url: string; db: Db } | null = null;

/**
 * Local end-to-end tests only: route the Neon driver through a local
 * WebSocket proxy (Neon's documented local-development setup) to a local
 * Postgres-compatible test database. Ignored in production builds, so a stray
 * variable can never redirect production traffic.
 */
function localWsProxy(env: Record<string, string | undefined>): void {
  const proxy = env.NEON_LOCAL_WS_PROXY?.trim();
  if (!proxy || process.env.NODE_ENV === "production") return;
  if (!/^(127\.0\.0\.1|localhost):\d{2,5}\/v1$/.test(proxy)) return;
  neonConfig.wsProxy = () => proxy;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineConnect = false;
  neonConfig.pipelineTLS = false;
}

/** Null when POSTGRES_URL is not set: callers answer 503 / "not configured", never pretend to store. */
export function dbFromEnv(env: Record<string, string | undefined> = process.env): Db | null {
  const url = env.POSTGRES_URL?.trim();
  if (!url) return null;
  if (cached?.url === url) return cached.db;
  localWsProxy(env);
  let pool: VercelPool;
  try {
    pool = createPool({ connectionString: url });
  } catch {
    // e.g. a direct (non-pooled) Neon URL. Never print the URL: it carries the password.
    console.error("[pg] POSTGRES_URL was rejected by @vercel/postgres (use the pooled connection string); treating the database as not configured");
    return null;
  }
  const db = fromVercelPool(pool);
  cached = { url, db };
  return db;
}

export function fromVercelPool(pool: VercelPool): Db {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const result = await pool.query(text, params as never[]);
      return { rows: result.rows as T[] };
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const tx: Queryable = {
          async query<T>(text: string, params: unknown[] = []) {
            const result = await client.query(text, params as never[]);
            return { rows: result.rows as T[] };
          },
        };
        const value = await fn(tx);
        await client.query("COMMIT");
        return value;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

/** Postgres error code (e.g. '23505' unique_violation), when there is one. */
export function pgErrorCode(error: unknown): string | null {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : null;
}
