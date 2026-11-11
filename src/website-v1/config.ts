/**
 * Two modes, fixed at build time (`NEXT_PUBLIC_` so server and client agree):
 *
 * - Preview (`NEXT_PUBLIC_WEBSITE_V1_PREVIEW=1`, set by `bun run dev:v1`): the
 *   site runs under `/v1` next to the current site. Every page is noindex,
 *   TBD boxes and DEMO / DRAFT content are shown for review, and the preview
 *   banner is on.
 * - Public (default, i.e. any production build): Website v1 is served at the
 *   site root (src/proxy.ts), only the pages in `PUBLIC_PATHS` (routes.ts)
 *   exist, undecided (TBD) slots render nothing and only published Travel
 *   Guide articles that pass the publish gate are rendered. Indexing is
 *   still blocked on *.netlify.app hosts (next.config.ts, netlify.toml).
 */
export const V1_PREVIEW = process.env.NEXT_PUBLIC_WEBSITE_V1_PREVIEW === "1";

/** Production organization name: public author of Travel Guide articles (W1-D10 K-3). */
export const ORGANIZATION_NAME = "Connectrip Japan";
