import { MAX_REMOVAL_SHARE } from "./config";
import type { Snapshot } from "./page";

/** What was last notified successfully (kept on the `indexnow-state` branch). */
export type State = {
  version: 1;
  /** Sitemap URLs at the last successful run. */
  sitemap: string[];
  /** Every URL IndexNow currently knows from us, with the content fingerprint it was notified with. */
  pages: Record<string, { hash: string; notifiedAt: string; sha: string }>;
  /** Commit live on connectripjapan.com when it was last handled completely (no pending failure). */
  lastProcessedSha: string | null;
  updatedAt: string | null;
  /**
   * Set while a live run has not completed (failed send, 429, deployment not live yet, broken
   * sitemap). The scheduled check retries until it clears; `pages` stay as last accepted.
   */
  retry?: { since: string; attempts: number; lastAt: string; lastOutcome: string; lastStatus: number | null } | null;
};

export const EMPTY_STATE: State = { version: 1, sitemap: [], pages: {}, lastProcessedSha: null, updatedAt: null, retry: null };

/**
 * Why a URL is sent:
 * - added: newly in the sitemap (or first run) and indexable;
 * - updated: its content fingerprint changed;
 * - deleted: was notified before, now 404 / 410;
 * - moved: was notified before, now redirects (its new URL is sent as "added");
 * - noindex: was notified before, now noindex or canonicalised elsewhere (so engines drop it).
 */
export type Reason = "added" | "updated" | "deleted" | "moved" | "noindex";

/** Why a URL is not sent. */
export type SkipReason =
  | "unchanged"
  | "not-indexable" // in the sitemap but noindex / non-canonical, never notified before
  | "left-sitemap" // dropped from the sitemap but still live and indexable: not a deletion
  | "fetch-error" // could not be read this time: retried on the next run
  | "invalid-url"; // not an official https://connectripjapan.com URL

export type Change = { url: string; reason: Reason; detail?: string };
export type Skip = { url: string; reason: SkipReason; detail?: string };

export type Plan = {
  changes: Change[];
  skipped: Skip[];
  /** The state to store when every change was accepted. */
  next: State;
  /** Set when the run must stop without sending anything. */
  abort?: string;
};

export function plan(prev: State, sitemap: string[], snapshots: Map<string, Snapshot>, meta: { sha: string; now: string; force?: boolean }): Plan {
  const changes: Change[] = [];
  const skipped: Skip[] = [];
  const pages: State["pages"] = { ...prev.pages };
  const current = new Set(sitemap);

  for (const url of sitemap) {
    const snap = snapshots.get(url);
    const before = prev.pages[url];
    if (!snap || snap.kind === "error") {
      skipped.push({ url, reason: "fetch-error", detail: snap?.kind === "error" ? snap.detail : "not read" });
      continue;
    }
    if (snap.kind === "indexable") {
      if (!before) changes.push({ url, reason: "added" });
      else if (before.hash !== snap.hash) changes.push({ url, reason: "updated" });
      else {
        skipped.push({ url, reason: "unchanged" });
        continue;
      }
      pages[url] = { hash: snap.hash, notifiedAt: meta.now, sha: meta.sha };
      continue;
    }
    // In the sitemap but not indexable (noindex, redirect, 404): never send it as content.
    const detail = snap.kind === "noindex" ? snap.detail : snap.kind === "redirect" ? `${snap.status} → ${snap.location}` : `HTTP ${snap.status}`;
    if (before) {
      changes.push({ url, reason: snap.kind === "redirect" ? "moved" : snap.kind === "gone" ? "deleted" : "noindex", detail });
      delete pages[url];
    } else skipped.push({ url, reason: "not-indexable", detail });
  }

  let removals = 0;
  for (const url of Object.keys(prev.pages)) {
    if (current.has(url)) continue;
    const snap = snapshots.get(url);
    if (!snap || snap.kind === "error") {
      skipped.push({ url, reason: "fetch-error", detail: snap?.kind === "error" ? snap.detail : "not read" });
      continue;
    }
    removals++;
    if (snap.kind === "indexable") {
      skipped.push({ url, reason: "left-sitemap" });
    } else {
      const detail = snap.kind === "noindex" ? snap.detail : snap.kind === "redirect" ? `${snap.status} → ${snap.location}` : `HTTP ${snap.status}`;
      changes.push({ url, reason: snap.kind === "redirect" ? "moved" : snap.kind === "gone" ? "deleted" : "noindex", detail });
    }
    delete pages[url];
  }

  // A page that could not be read keeps its old record and is checked again; the commit is then not "done".
  const incomplete = skipped.some((s) => s.reason === "fetch-error");
  const next: State = { version: 1, sitemap: [...sitemap], pages, lastProcessedSha: incomplete ? prev.lastProcessedSha : meta.sha, updatedAt: meta.now, retry: null };
  const known = Object.keys(prev.pages).length;

  let abort: string | undefined;
  if (sitemap.length === 0) abort = "The sitemap lists no URL: nothing is sent and the record is kept.";
  else if (!meta.force && known >= 4 && removals / known > MAX_REMOVAL_SHARE)
    abort = `${removals} of ${known} notified URLs left the sitemap at once: treated as a broken sitemap, nothing is sent (run with --force if this is intended).`;

  return { changes, skipped, next, abort };
}

/** URLs to send, each once, in a stable order. */
export function urlList(changes: Change[]): string[] {
  return [...new Set(changes.map((c) => c.url))].sort();
}

/**
 * accepted              HTTP 200: IndexNow received the URLs
 * accepted-key-pending  HTTP 202: received, key validation pending
 * (neither means indexed)
 */
export type Outcome = "accepted" | "accepted-key-pending" | "failed" | "no-change" | "aborted" | "not-live" | "skipped" | "nothing-pending" | "dry-run";
export const COMPLETE: readonly Outcome[] = ["accepted", "accepted-key-pending", "no-change"];
export const UNFINISHED: readonly Outcome[] = ["failed", "aborted", "not-live"];

/**
 * The record after a run. `null` = leave the stored record exactly as it is.
 * - complete (200, 202, nothing to send): the planned state, retry cleared;
 * - unfinished (failure, 429 exhausted, broken sitemap, not live): pages and
 *   lastProcessedSha stay as last accepted, retry counted, so the next check sends again;
 * - dry run, skipped, nothing pending: unchanged (a dry run never counts as handled).
 */
export function recordAfter(prev: State, outcome: Outcome, p: Plan | undefined, meta: { now: string; status: number | null }): State | null {
  if (COMPLETE.includes(outcome)) return p ? { ...p.next, retry: null } : null;
  if (UNFINISHED.includes(outcome))
    return {
      ...prev,
      retry: { since: prev.retry?.since ?? meta.now, attempts: (prev.retry?.attempts ?? 0) + 1, lastAt: meta.now, lastOutcome: outcome, lastStatus: meta.status },
    };
  return null;
}

/**
 * Should this run read the site at all?
 * - status: yes, unless this exact commit was already handled completely (duplicate event).
 *   An unfinished run (retry pending) is never "already handled"; a dry run never marks a commit handled.
 * - schedule: only when a run is unfinished, or the live commit was never handled
 *   (missed event, redeploy, rollback); unfinished runs stop being retried after maxRetries.
 * - workflow_dispatch / manual: always.
 */
export function decide(
  trigger: string,
  prev: State,
  meta: { sha: string; liveCommit: string | null; force: boolean; maxRetries: number },
): { run: true } | { run: false; outcome: "skipped" | "nothing-pending"; message?: string } {
  if (meta.force) return { run: true };
  if (trigger === "status") {
    if (!prev.retry && prev.lastProcessedSha === meta.sha) return { run: false, outcome: "skipped", message: "this commit was already handled" };
    return { run: true };
  }
  if (trigger === "schedule") {
    const unhandled = !!meta.liveCommit && meta.liveCommit !== prev.lastProcessedSha;
    if (unhandled) return { run: true };
    if (!prev.retry) return { run: false, outcome: "nothing-pending" };
    if (prev.retry.attempts >= meta.maxRetries)
      return { run: false, outcome: "skipped", message: `gave up after ${prev.retry.attempts} attempts; the next deployment or a manual run tries again` };
    return { run: true };
  }
  return { run: true };
}
