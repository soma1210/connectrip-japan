/**
 * Is a commit really live on connectripjapan.com? The site answers its commit at
 * /api/build-info (src/app/api/build-info/route.ts); GitHub tells how two commits relate.
 *
 * - live commit = expected            → "live"
 * - live commit contains the expected  → "newer": a later deployment already went out; its
 *   (main moved on and deployed again)   content includes this one, so the run goes ahead
 * - live commit is older / elsewhere   → keep waiting (alias not switched yet), then "timeout":
 *   (slow alias, failed promotion,       nothing is sent; the scheduled check sends whatever
 *   instant rollback)                    the live site really shows once it settles
 * - no answer (route not deployed yet, → "unknown" after a short fixed wait: the run goes ahead
 *   not on Vercel)                       on the live content, with a warning
 */
export type BuildInfo = { commit: string | null; environment: string | null };
export type Relation = "identical" | "ahead" | "behind" | "diverged" | null;

export type LiveCheck =
  | { state: "live"; live: string; waitedSeconds: number }
  | { state: "newer"; live: string; waitedSeconds: number }
  | { state: "timeout"; live: string | null; waitedSeconds: number; detail: string }
  | { state: "unknown"; live: null; waitedSeconds: number; detail: string };

export type LiveDeps = {
  info: () => Promise<BuildInfo | null>;
  /** GitHub compare `base...head`: "ahead" = head contains base. */
  relation: (base: string, head: string) => Promise<Relation>;
  sleep: (seconds: number) => Promise<void>;
};

export async function waitUntilLive(expected: string, deps: LiveDeps, opts = { timeoutSeconds: 900, intervalSeconds: 20, unknownGraceSeconds: 60 }): Promise<LiveCheck> {
  let waited = 0;
  let last: BuildInfo | null = null;
  let unanswered = 0;
  for (;;) {
    last = await deps.info().catch(() => null);
    if (last?.commit && last.environment === "production") {
      if (last.commit === expected) return { state: "live", live: last.commit, waitedSeconds: waited };
      const rel = await deps.relation(expected, last.commit).catch(() => null);
      if (rel === "ahead" || rel === "identical") return { state: "newer", live: last.commit, waitedSeconds: waited };
    } else {
      unanswered += opts.intervalSeconds;
      if (unanswered > opts.unknownGraceSeconds) return { state: "unknown", live: null, waitedSeconds: waited, detail: "the site does not report its commit (/api/build-info)" };
    }
    if (waited >= opts.timeoutSeconds)
      return { state: "timeout", live: last?.commit ?? null, waitedSeconds: waited, detail: `connectripjapan.com still serves ${last?.commit?.slice(0, 7) ?? "an unknown commit"} after ${waited} s` };
    await deps.sleep(opts.intervalSeconds);
    waited += opts.intervalSeconds;
  }
}
