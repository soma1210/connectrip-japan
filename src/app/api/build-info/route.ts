/**
 * Which commit this deployment was built from (2026-11-26). Read by the IndexNow
 * workflow to confirm that connectripjapan.com really serves a commit before
 * notifying search engines (scripts/indexnow/README.md).
 *
 * Public by design and harmless: the repository is public, so the commit id is
 * already public. Values come from Vercel's system environment variables; both
 * are null outside Vercel. Not cached, so a new deployment answers at once.
 * Not crawled: robots.txt disallows /api.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null, environment: process.env.VERCEL_ENV ?? null },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
