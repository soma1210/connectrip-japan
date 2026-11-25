/**
 * IndexNow: tell search engines which connectripjapan.com pages changed. Run by
 * .github/workflows/indexnow.yml (see README.md):
 * - trigger "status": Vercel finished a production deployment of commit --sha. The run first
 *   waits until connectripjapan.com really serves that commit (or a later one).
 * - trigger "schedule": every 3 h; does real work only when a run is unfinished (failure,
 *   429, deployment not live in time) or the live commit was never handled (missed event,
 *   redeploy, rollback). Otherwise it stops after one small request.
 * - trigger "workflow_dispatch": by hand, e.g. the first notification once sending is enabled.
 *
 *   bun scripts/indexnow/run.ts --mode dry-run                                 # production, send nothing
 *   bun scripts/indexnow/run.ts --mode dry-run --origin http://localhost:3083  # a local build
 *   bun scripts/indexnow/run.ts --mode live --state-dir indexnow-state --trigger status --sha <commit>
 *
 * Options: --state-dir <dir> (state.json + log/), --sha, --trigger, --target-url (Vercel link,
 * logged), --summary <file> (Markdown, e.g. $GITHUB_STEP_SUMMARY), --report <file> (JSON),
 * --force (skip the broken-sitemap stop and the already-handled check), --no-wait (do not wait
 * for the commit to be live), --simulate-accept (dry run only: store the record as if accepted,
 * to rehearse a sequence of runs locally).
 *
 * Dry runs never send and never change the record (unless --simulate-accept in a local folder).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BUILD_INFO_URL, KEY, KEY_LOCATION, LIVE_WAIT, MAX_SCHEDULED_RETRIES, SITE_ORIGIN, SITEMAP_URL, USER_AGENT } from "./config";
import { waitUntilLive, type BuildInfo, type LiveCheck, type Relation } from "./deploy";
import { classify, isOfficialUrl, parseSitemap, type Snapshot } from "./page";
import { COMPLETE, decide, EMPTY_STATE, plan, recordAfter, urlList, type Change, type Outcome, type Plan, type Skip, type State } from "./plan";
import { meaning, submit, type SubmitResult } from "./submit";

type Mode = "dry-run" | "live";

function args(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[a.slice(2)] = true;
    else {
      out[a.slice(2)] = next;
      i++;
    }
  }
  return out;
}

const sleep = (s: number) => new Promise<void>((r) => setTimeout(r, s * 1000));

async function get(url: string, origin: string): Promise<{ status: number; body: string; xRobots: string | null; location: string | null }> {
  // The URL is always the official one; only where it is read from may differ (dry runs against a local build).
  const u = new URL(url);
  const target = origin === SITE_ORIGIN ? url : `${origin}${u.pathname}`;
  const res = await fetch(target, { redirect: "manual", headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(30_000) });
  const location = res.headers.get("location");
  return {
    status: res.status,
    body: res.status === 200 ? await res.text() : "",
    xRobots: res.headers.get("x-robots-tag"),
    location: location && origin !== SITE_ORIGIN ? location.replace(origin, SITE_ORIGIN) : location,
  };
}

async function snapshot(url: string, origin: string): Promise<Snapshot> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await get(url, origin);
      if (r.status >= 500 && attempt < 3) {
        await sleep(5 * attempt);
        continue;
      }
      return classify(url, r.status, r.body, r.xRobots, r.location);
    } catch (e) {
      if (attempt === 3) return { kind: "error", detail: e instanceof Error ? e.message : String(e) };
      await sleep(5 * attempt);
    }
  }
  return { kind: "error", detail: "unreachable" };
}

async function readSitemap(origin: string): Promise<string[]> {
  let lastError = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await get(SITEMAP_URL, origin);
      if (r.status === 200) return parseSitemap(r.body);
      lastError = `HTTP ${r.status}`;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
    await sleep(10 * attempt);
  }
  throw new Error(`sitemap unreachable (${lastError})`);
}

async function buildInfo(origin: string): Promise<BuildInfo | null> {
  const r = await get(BUILD_INFO_URL, origin);
  if (r.status !== 200) return null;
  const j = JSON.parse(r.body) as Partial<BuildInfo>;
  return { commit: typeof j.commit === "string" ? j.commit : null, environment: typeof j.environment === "string" ? j.environment : null };
}

/** GitHub compare base...head ("ahead" = head contains base). Needs GH_TOKEN and GITHUB_REPOSITORY (Actions). */
async function relation(base: string, head: string): Promise<Relation> {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!repo || !token) return null;
  const res = await fetch(`https://api.github.com/repos/${repo}/compare/${base}...${head}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) return null;
  const status = ((await res.json()) as { status?: string }).status;
  return status === "identical" || status === "ahead" || status === "behind" || status === "diverged" ? status : null;
}

function loadState(dir: string): State {
  const file = join(dir, "state.json");
  if (!existsSync(file)) return structuredClone(EMPTY_STATE);
  const s = JSON.parse(readFileSync(file, "utf8")) as State;
  if (s.version !== 1) throw new Error(`unknown state version ${s.version}`);
  return { ...s, retry: s.retry ?? null };
}

function saveState(dir: string, s: State) {
  mkdirSync(dir, { recursive: true });
  const pages = Object.fromEntries(Object.entries(s.pages).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(join(dir, "state.json"), `${JSON.stringify({ ...s, sitemap: [...s.sitemap].sort(), pages }, null, 2)}\n`);
}

type RunRecord = {
  runAt: string;
  mode: Mode;
  trigger: string;
  sha: string;
  liveCommit: string | null;
  targetUrl: string | null;
  outcome: Outcome;
  note: string;
  sent: Change[];
  skipped: Skip[];
  http: { status: number | null; meaning: string; attempts: SubmitResult["attempts"] } | null;
  retry?: State["retry"];
  message?: string;
};

const LABEL: Record<string, string> = {
  added: "新規",
  updated: "更新",
  deleted: "削除",
  moved: "URL変更",
  noindex: "noindex化",
  unchanged: "変更なし",
  "not-indexable": "対象外（noindex等）",
  "left-sitemap": "サイトマップから外れた（公開中のため通知しない）",
  "fetch-error": "取得失敗（次回再確認）",
  "invalid-url": "公式URLではない",
};

const OUTCOME_LABEL: Record<Outcome, string> = {
  accepted: "受理（HTTP 200）",
  "accepted-key-pending": "受理・キー検証保留（HTTP 202）",
  failed: "送信失敗（記録は据え置き、自動で再送）",
  "no-change": "変更なし",
  aborted: "中止（何も送信せず、自動で再確認）",
  "not-live": "本番未反映のため送信せず（自動で再確認）",
  skipped: "処理済みのため省略",
  "nothing-pending": "未処理なし",
  "dry-run": "Dry Run（送信なし・記録変更なし）",
};

function markdown(r: RunRecord): string {
  const lines = [
    `## IndexNow — ${r.mode === "live" ? "本番送信" : "Dry Run（送信なし）"}`,
    "",
    `- 実行日時: ${r.runAt}`,
    `- きっかけ: ${r.trigger}`,
    `- 対象コミット: \`${r.sha}\`${r.targetUrl ? ` ([Vercel](${r.targetUrl}))` : ""}`,
    `- 本番で確認したコミット: ${r.liveCommit ? `\`${r.liveCommit}\`` : "—"}`,
    `- 結果: **${OUTCOME_LABEL[r.outcome]}**${r.message ? ` — ${r.message}` : ""}`,
  ];
  if (r.http) lines.push(`- API応答: ${r.http.status ?? "なし"}（${r.http.meaning}）／試行 ${r.http.attempts.length} 回`);
  if (r.retry) lines.push(`- 再試行: ${r.retry.attempts} 回目（${r.retry.since} から未完了）。3時間ごとの定期確認で自動再送します。`);
  lines.push(`- 注意: ${r.note}`, "", `### 通知対象（${r.sent.length}件）`, "");
  if (r.sent.length) {
    lines.push("| URL | 理由 | 詳細 |", "|---|---|---|");
    for (const c of r.sent) lines.push(`| ${c.url} | ${LABEL[c.reason]} | ${c.detail ?? ""} |`);
  } else lines.push("なし");
  const other = r.skipped.filter((s) => s.reason !== "unchanged");
  lines.push("", `### 送信しないURL（変更なし ${r.skipped.length - other.length}件、その他 ${other.length}件）`, "");
  if (other.length) {
    lines.push("| URL | 理由 | 詳細 |", "|---|---|---|");
    for (const s of other) lines.push(`| ${s.url} | ${LABEL[s.reason]} | ${s.detail ?? ""} |`);
  }
  if (r.http?.attempts.length) {
    lines.push("", "### 送信の試行", "", "| 日時 | 応答 | 待機 |", "|---|---|---|");
    for (const a of r.http.attempts) lines.push(`| ${a.at} | ${a.status ?? a.error ?? "—"} | ${a.waitSeconds ? `${a.waitSeconds}秒後に再試行` : ""} |`);
  }
  return `${lines.join("\n")}\n`;
}

async function main(): Promise<number> {
  const a = args(process.argv.slice(2));
  const mode: Mode = a.mode === "live" ? "live" : "dry-run";
  const origin = typeof a.origin === "string" ? a.origin.replace(/\/$/, "") : SITE_ORIGIN;
  const stateDir = typeof a["state-dir"] === "string" ? a["state-dir"] : "indexnow-state";
  const sha = typeof a.sha === "string" ? a.sha : "local";
  const trigger = typeof a.trigger === "string" ? a.trigger : "manual";
  const targetUrl = typeof a["target-url"] === "string" && a["target-url"] ? a["target-url"] : null;
  const simulate = a["simulate-accept"] === true;
  const force = a.force === true;
  const now = new Date().toISOString();

  if (mode === "live" && origin !== SITE_ORIGIN) throw new Error(`live mode reads ${SITE_ORIGIN} only (got ${origin})`);
  if (simulate && mode === "live") throw new Error("--simulate-accept is for dry runs only");
  if (simulate && !(typeof a["state-dir"] === "string")) throw new Error("--simulate-accept needs an explicit --state-dir (never the real record)");

  const prev = loadState(stateDir);
  let liveCommit: string | null = null;

  const finish = (r: Omit<RunRecord, "runAt" | "mode" | "trigger" | "sha" | "liveCommit" | "targetUrl" | "note">, p?: Plan, opts: { log?: boolean } = {}) => {
    const after = recordAfter(prev, r.outcome, p, { now, status: r.http?.status ?? null });
    const record: RunRecord = {
      runAt: now,
      mode,
      trigger,
      sha,
      liveCommit,
      targetUrl,
      note: "HTTP 200/202 はIndexNowが通知を受け取ったという意味で、インデックス登録の完了ではありません（202 はキー検証保留）。",
      ...r,
      retry: COMPLETE.includes(r.outcome) ? null : (after?.retry ?? prev.retry ?? null),
    };
    const md = markdown(record);
    process.stdout.write(md);
    if (typeof a.summary === "string") appendFileSync(a.summary, md);
    if (typeof a.report === "string") writeFileSync(a.report, `${JSON.stringify({ ...record, origin }, null, 2)}\n`);
    if (mode === "live" && opts.log !== false) {
      mkdirSync(join(stateDir, "log"), { recursive: true });
      appendFileSync(join(stateDir, "log", `${now.slice(0, 7)}.jsonl`), `${JSON.stringify(record)}\n`);
      if (after) saveState(stateDir, after);
    }
    // Local rehearsal only: store the planned record as if IndexNow had accepted.
    if (simulate && p && record.outcome === "dry-run") saveState(stateDir, { ...p.next, retry: null });
    if (record.outcome === "not-live") console.log(`::warning::${record.message}`);
    return record.outcome === "failed" || record.outcome === "aborted" ? 1 : 0;
  };

  // --- Is there anything to do? ------------------------------------------------------------
  if (trigger === "schedule") liveCommit = (await buildInfo(origin).catch(() => null))?.commit ?? null;
  const d = decide(trigger, prev, { sha, liveCommit, force, maxRetries: MAX_SCHEDULED_RETRIES });
  if (!d.run) return finish({ outcome: d.outcome, sent: [], skipped: [], http: null, message: d.message }, undefined, { log: false });

  // A production deployment: wait until connectripjapan.com serves the commit (or a later one).
  if (trigger === "status" && a["no-wait"] !== true) {
    const check: LiveCheck = await waitUntilLive(sha, { info: () => buildInfo(origin), relation, sleep }, LIVE_WAIT);
    liveCommit = check.live;
    if (check.state === "timeout") return finish({ outcome: "not-live", sent: [], skipped: [], http: null, message: check.detail });
    if (check.state === "newer") console.log(`a later commit ${check.live.slice(0, 7)} is live; its content includes ${sha.slice(0, 7)}`);
    if (check.state === "unknown") {
      if (mode === "live") return finish({ outcome: "not-live", sent: [], skipped: [], http: null, message: `${check.detail}: live mode sends nothing without a confirmed production commit` });
      console.log(`::warning::${check.detail}; dry run goes ahead on the live content`);
    }
  } else if (!liveCommit) {
    liveCommit = (await buildInfo(origin).catch(() => null))?.commit ?? null;
  }
  // Live mode never sends without a confirmed production commit (owner rule 2026-11-26).
  if (mode === "live" && !liveCommit)
    return finish({ outcome: "not-live", sent: [], skipped: [], http: null, message: "/api/build-info did not report a production commit: nothing sent, retried by the scheduled check" });
  const handled = liveCommit ?? sha;

  // --- Read the live site ------------------------------------------------------------------
  let sitemap: string[];
  try {
    sitemap = await readSitemap(origin);
  } catch (e) {
    return finish({ outcome: "aborted", sent: [], skipped: [], http: null, message: e instanceof Error ? e.message : String(e) });
  }
  const invalid = sitemap.filter((u) => !isOfficialUrl(u));
  const official = [...new Set(sitemap.filter(isOfficialUrl))];

  // Every sitemap URL, and every URL notified before that left it (deleted / moved?).
  const toRead = [...new Set([...official, ...Object.keys(prev.pages)])];
  const snapshots = new Map<string, Snapshot>();
  for (let i = 0; i < toRead.length; i += 4) {
    const batch = toRead.slice(i, i + 4);
    const res = await Promise.all(batch.map((u) => snapshot(u, origin)));
    batch.forEach((u, k) => snapshots.set(u, res[k]));
  }

  const p = plan(prev, official, snapshots, { sha: handled, now, force });
  const skipped: Skip[] = [...p.skipped, ...invalid.map((url) => ({ url, reason: "invalid-url" as const }))];
  if (p.abort) return finish({ outcome: "aborted", sent: p.changes, skipped, http: null, message: p.abort }, p);

  const urls = urlList(p.changes);
  if (urls.length === 0) return finish({ outcome: mode === "live" ? "no-change" : "dry-run", sent: [], skipped, http: null }, p);

  if (mode === "dry-run") {
    // Check the key file the engines will read, without sending anything.
    let keyNote = "";
    try {
      const k = await get(KEY_LOCATION, origin);
      keyNote = k.status === 200 && k.body.trim() === KEY ? "key file OK" : `key file NOT served correctly (HTTP ${k.status})`;
    } catch (e) {
      keyNote = `key file unreachable (${e instanceof Error ? e.message : e})`;
    }
    return finish({ outcome: "dry-run", sent: p.changes, skipped, http: null, message: `${urls.length} URL(s) would be sent; ${keyNote}` }, p);
  }

  // Live: the key file must be served before IndexNow can verify us.
  const k = await get(KEY_LOCATION, origin).catch(() => null);
  if (!k || k.status !== 200 || k.body.trim() !== KEY) {
    return finish({ outcome: "failed", sent: p.changes, skipped, http: null, message: `key file ${KEY_LOCATION} is not served (HTTP ${k?.status ?? "—"}); nothing sent` }, p);
  }

  const result = await submit(urls, { fetch: (u, init) => fetch(u, { ...init, signal: AbortSignal.timeout(60_000) }), sleep });
  const outcome: Outcome = !result.accepted ? "failed" : result.status === 202 ? "accepted-key-pending" : "accepted";
  return finish(
    {
      outcome,
      sent: p.changes,
      skipped,
      http: { status: result.status, meaning: meaning(result.status), attempts: result.attempts },
      message: result.accepted ? "IndexNow received the URLs (not yet indexed)" : `${result.message}; the same URLs are found and sent again by the next check`,
    },
    p,
  );
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e instanceof Error ? e.stack : e);
    process.exit(1);
  },
);
