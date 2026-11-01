// Decides whether this process may use the database in POSTGRES_URL.
//
// Production data lives only on the Neon `main` branch. Preview and
// Development use the `development` branch through the connectrip_nonprod
// role, which exists only on that branch. So the role in the connection
// string tells us which side a URL belongs to, without hard-coding hosts:
// - a non-production environment must connect as connectrip_nonprod
// - production must not connect as connectrip_nonprod (it would store real
//   applications in the test database)
//
// Plain JS so both the app (src/lib/db.ts) and scripts/init-db.mjs use it.
// Never log or return the URL itself.

export const NONPROD_ROLE = "connectrip_nonprod";

/**
 * @param {Record<string, string | undefined>} env
 * @returns {boolean}
 */
export function isNonProductionEnv(env) {
  if (env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") return true;
  if (env.CONTEXT === "deploy-preview" || env.CONTEXT === "branch-deploy" || env.CONTEXT === "dev") {
    return true;
  }
  return env.NODE_ENV !== "production";
}

/**
 * The login role in a Postgres connection string, or null if it cannot be read.
 * @param {string} url
 * @returns {string | null}
 */
export function connectionRole(url) {
  try {
    const role = decodeURIComponent(new URL(url).username);
    return role || null;
  } catch {
    return null;
  }
}

/**
 * ok: the database may be used. reason: why it was refused (null when
 * POSTGRES_URL is simply not set).
 * @param {Record<string, string | undefined>} env
 * @returns {{ ok: boolean, reason: string | null }}
 */
export function checkDbTarget(env) {
  const url = env.POSTGRES_URL;
  if (!url) return { ok: false, reason: null };

  const role = connectionRole(url);
  if (isNonProductionEnv(env)) {
    if (role !== NONPROD_ROLE) {
      return {
        ok: false,
        reason: `Non-production environment must connect as ${NONPROD_ROLE} (Neon development branch).`,
      };
    }
    return { ok: true, reason: null };
  }

  // Production: an unreadable URL keeps the previous behaviour rather than
  // taking the live forms down; only the test role is refused.
  if (role === NONPROD_ROLE) {
    return { ok: false, reason: `Production must not connect as ${NONPROD_ROLE}.` };
  }
  return { ok: true, reason: null };
}
