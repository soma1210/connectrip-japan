import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ENDPOINT, HOST, KEY, KEY_LOCATION } from "./config";
import { classify, extractContent, fingerprint, imageKey, isOfficialUrl, parseSitemap, sameUrl, type Snapshot } from "./page";
import { waitUntilLive, type BuildInfo, type Relation } from "./deploy";
import { decide, EMPTY_STATE, plan, recordAfter, urlList, type State } from "./plan";
import { retryAfterSeconds, submit } from "./submit";

const page = (body: string, head = "") =>
  `<!doctype html><html><head><title>T</title><meta name="description" content="D"/>${head}</head><body><header>Menu</header><main>${body}</main><footer>© 2026</footer></body></html>`;
const hash = (html: string) => fingerprint(extractContent(html));

// --- Key file: served from public/, holds the key only ---------------------------
assert.match(KEY, /^[a-f0-9]{32}$/);
assert.equal(readFileSync(new URL(`../../public/${KEY}.txt`, import.meta.url), "utf8"), KEY);
assert.equal(KEY_LOCATION, `https://connectripjapan.com/${KEY}.txt`);
assert.equal(HOST, "connectripjapan.com");
assert.equal(ENDPOINT, "https://api.indexnow.org/indexnow");

// --- Official URLs only -------------------------------------------------------------
assert.ok(isOfficialUrl("https://connectripjapan.com/"));
assert.ok(isOfficialUrl("https://connectripjapan.com/explore/select/osaka-food-guide"));
for (const u of [
  "http://connectripjapan.com/",
  "https://www.connectripjapan.com/",
  "http://localhost:3081/",
  "https://connectrip-japan-git-main-soma.vercel.app/",
  "https://connectrip.netlify.app/",
  "https://connectripjapan.com/v1/about",
  "https://connectripjapan.com/?utm_source=x",
  "https://connectripjapan.com/#top",
  "not a url",
])
  assert.equal(isOfficialUrl(u), false, u);
assert.ok(sameUrl("https://connectripjapan.com", "https://connectripjapan.com/"));
assert.ok(!sameUrl("https://connectripjapan.com/about", "https://connectripjapan.com/"));
assert.deepEqual(parseSitemap("<urlset><url><loc>https://connectripjapan.com/</loc></url><url><loc> https://connectripjapan.com/a&amp;b </loc></url></urlset>"), [
  "https://connectripjapan.com/",
  "https://connectripjapan.com/a&b",
]);

// --- Fingerprint: dynamic values do not count, real content does --------------------
const a = page(`<h1 class="x_abc123" id="«r1»" style="--c:0">Osaka Tour</h1><p>From ¥24,800 ≈ $ 155 USD</p><img src="/_next/image?url=%2Fimages%2Fa.jpg&amp;w=640&amp;q=75" alt="Osaka Castle"/><script>self.__next_f.push(["build-1"])</script>`);
const b = page(`<h1 class="x_zzz999" id="«r7»" style="--c:3">Osaka   Tour</h1><p>From ¥24,800 ≈ $ 162 USD</p><img src="/_next/image?url=%2Fimages%2Fa.jpg&amp;w=1080&amp;q=85" alt="Osaka Castle"/><script>self.__next_f.push(["build-2"])</script><!-- x -->`);
assert.equal(hash(a), hash(b), "class names, ids, styles, scripts, image sizes and the USD reference are ignored");
assert.notEqual(hash(a), hash(a.replace("Osaka Tour", "Kyoto Tour")), "a text change counts");
assert.notEqual(hash(a), hash(a.replace("¥24,800", "¥26,000")), "a yen price change counts");
assert.notEqual(hash(a), hash(a.replace("Osaka Castle", "Osaka Castle at night")), "an alt change counts");
assert.notEqual(hash(a), hash(a.replace("%2Fimages%2Fa.jpg", "%2Fimages%2Fb.jpg")), "a new photo counts");
assert.notEqual(hash(a), hash(a.replace('content="D"', 'content="New description"')), "a description change counts");
assert.equal(hash(a), hash(a.replace("<header>Menu</header>", "<header>Menu · New</header>").replace("© 2026", "© 2027")), "header / footer are not the page's content");
assert.equal(hash(page("A⁠B&nbsp;C")), hash(page("AB C")), "invisible characters and entities");
assert.equal(imageKey("https://connectripjapan.com/images/x.webp?v=2"), "/images/x.webp");

// --- Classification ----------------------------------------------------------------
const U = "https://connectripjapan.com/about";
assert.equal(classify(U, 200, page("x", '<meta name="robots" content="index, follow"/>'), null, null).kind, "indexable");
assert.equal(classify(U, 200, page("x", '<meta name="robots" content="noindex, nofollow"/>'), null, null).kind, "noindex");
assert.equal(classify(U, 200, page("x"), "noindex", null).kind, "noindex");
assert.equal(classify(U, 200, page("x", '<link rel="canonical" href="https://connectripjapan.com/company"/>'), null, null).kind, "noindex");
assert.equal(classify(U, 200, page("x", '<link rel="canonical" href="https://connectripjapan.com/about"/>'), null, null).kind, "indexable");
assert.equal(classify("https://connectripjapan.com/", 200, page("x", '<link rel="canonical" href="https://connectripjapan.com"/>'), null, null).kind, "indexable");
assert.deepEqual(classify(U, 308, "", null, "/about-us"), { kind: "redirect", status: 308, location: "https://connectripjapan.com/about-us" });
assert.deepEqual(classify(U, 410, "", null, null), { kind: "gone", status: 410 });
assert.equal(classify(U, 503, "", null, null).kind, "error");

// --- Planning ----------------------------------------------------------------------
const S = (u: string) => `https://connectripjapan.com${u}`;
const ok = (h: string): Snapshot => ({ kind: "indexable", hash: h });
const meta = { sha: "abc", now: "2026-11-25T00:00:00.000Z" };

// First run: every indexable sitemap URL is "added"; noindex pages are never sent.
let p = plan(EMPTY_STATE, [S("/"), S("/about"), S("/draft")], new Map([[S("/"), ok("1")], [S("/about"), ok("2")], [S("/draft"), { kind: "noindex", detail: "meta robots" }]]), meta);
assert.deepEqual(p.changes.map((c) => [c.url, c.reason]), [[S("/"), "added"], [S("/about"), "added"]]);
assert.deepEqual(p.skipped.map((s) => s.reason), ["not-indexable"]);
assert.equal(p.abort, undefined);
assert.deepEqual(Object.keys(p.next.pages), [S("/"), S("/about")]);
assert.equal(p.next.lastProcessedSha, "abc");
let st: State = p.next;

// Nothing changed: nothing sent.
p = plan(st, [S("/"), S("/about")], new Map([[S("/"), ok("1")], [S("/about"), ok("2")]]), { ...meta, sha: "def" });
assert.equal(p.changes.length, 0);

// Update, new page, deletion, move, noindex, page left the sitemap but still live.
st = { ...st, pages: { ...st.pages, [S("/old")]: { hash: "o", notifiedAt: "", sha: "" }, [S("/gone")]: { hash: "g", notifiedAt: "", sha: "" }, [S("/hide")]: { hash: "h", notifiedAt: "", sha: "" }, [S("/kept")]: { hash: "k", notifiedAt: "", sha: "" } } };
p = plan(
  st,
  [S("/"), S("/about"), S("/new"), S("/hide")],
  new Map<string, Snapshot>([
    [S("/"), ok("1")],
    [S("/about"), ok("2b")],
    [S("/new"), ok("3")],
    [S("/hide"), { kind: "noindex", detail: "meta robots" }],
    [S("/old"), { kind: "redirect", status: 308, location: S("/new") }],
    [S("/gone"), { kind: "gone", status: 404 }],
    [S("/kept"), ok("k")],
  ]),
  { ...meta, sha: "ghi", force: true },
);
const reasons = Object.fromEntries(p.changes.map((c) => [c.url, c.reason]));
assert.deepEqual(reasons, { [S("/about")]: "updated", [S("/new")]: "added", [S("/hide")]: "noindex", [S("/old")]: "moved", [S("/gone")]: "deleted" });
assert.ok(p.skipped.some((s) => s.url === S("/kept") && s.reason === "left-sitemap"));
assert.deepEqual(Object.keys(p.next.pages).sort(), [S("/"), S("/about"), S("/new")]);
assert.deepEqual(urlList([...p.changes, ...p.changes]), [...new Set(p.changes.map((c) => c.url))].sort(), "each URL once");

// A page that cannot be read keeps its record; the commit is not marked as handled.
p = plan(st, [S("/"), S("/about")], new Map<string, Snapshot>([[S("/"), ok("1")], [S("/about"), { kind: "error", detail: "timeout" }]]), { ...meta, sha: "jkl", force: true });
assert.equal(p.next.pages[S("/about")].hash, "2");
assert.equal(p.next.lastProcessedSha, st.lastProcessedSha);

// Safety stops: an empty sitemap, or most notified URLs vanishing at once.
assert.match(plan(st, [], new Map(), meta).abort ?? "", /no URL/);
const many: State = { ...EMPTY_STATE, pages: Object.fromEntries(["/a", "/b", "/c", "/d", "/e"].map((u) => [S(u), { hash: "x", notifiedAt: "", sha: "" }])) };
const gone = new Map<string, Snapshot>(["/a", "/b", "/c", "/d", "/e"].map((u) => [S(u), { kind: "gone", status: 404 }]));
gone.set(S("/"), ok("1"));
assert.match(plan(many, [S("/")], gone, meta).abort ?? "", /broken sitemap/);
assert.equal(plan(many, [S("/")], gone, { ...meta, force: true }).abort, undefined);

// --- Sending -----------------------------------------------------------------------
assert.equal(retryAfterSeconds("120"), 120);
assert.equal(retryAfterSeconds(new Date(Date.UTC(2026, 0, 1, 0, 1)).toUTCString(), Date.UTC(2026, 0, 1)), 60);
assert.equal(retryAfterSeconds(null), null);

function fake(statuses: (number | Error)[], headers: Record<string, string> = {}) {
  const calls: { url: string; body: unknown }[] = [];
  const waits: number[] = [];
  return {
    calls,
    waits,
    deps: {
      fetch: async (url: string, init: RequestInit) => {
        calls.push({ url, body: JSON.parse(String(init.body)) });
        const s = statuses.shift() ?? 200;
        if (s instanceof Error) throw s;
        return new Response(null, { status: s, headers });
      },
      sleep: async (s: number) => void waits.push(s),
      now: () => "t",
    },
  };
}

let f = fake([200]);
let r = await submit([S("/"), S("/about")], f.deps);
assert.ok(r.accepted);
assert.deepEqual(f.calls[0].body, { host: "connectripjapan.com", key: KEY, keyLocation: KEY_LOCATION, urlList: [S("/"), S("/about")] });

f = fake([202]);
assert.ok((await submit([S("/")], f.deps)).accepted, "202 = received, key pending");

f = fake([429, 429, 200], { "retry-after": "30" });
r = await submit([S("/")], f.deps);
assert.ok(r.accepted);
assert.deepEqual(f.waits, [30, 30], "429 waits for Retry-After");

f = fake([429, 429, 429, 429]);
r = await submit([S("/")], f.deps);
assert.equal(r.accepted, false);
assert.deepEqual(f.waits, [60, 120, 300], "429 without Retry-After backs off");
assert.equal(r.attempts.length, 4);

f = fake([429], { "retry-after": "99999" });
await submit([S("/")], f.deps);
assert.equal(f.waits[0], 600, "a single wait is capped");

f = fake([new Error("ECONNRESET"), 503, 200]);
r = await submit([S("/")], f.deps);
assert.ok(r.accepted);
assert.deepEqual(f.waits, [15, 30]);

for (const s of [400, 403, 422]) {
  f = fake([s]);
  r = await submit([S("/")], f.deps);
  assert.equal(r.accepted, false);
  assert.equal(f.calls.length, 1, `${s} is not retried`);
}

f = fake([]);
r = await submit(["http://localhost:3081/", S("/")], f.deps);
assert.equal(r.accepted, false);
assert.equal(f.calls.length, 0, "a non-official URL stops the whole request");

// --- Is the commit live on connectripjapan.com? ---------------------------------------------
async function live(answers: (BuildInfo | null)[], rel: Relation = null, timeoutSeconds = 100) {
  const waits: number[] = [];
  const res = await waitUntilLive(
    "c2",
    { info: async () => (answers.length > 1 ? answers.shift()! : answers[0]), relation: async () => rel, sleep: async (s) => void waits.push(s) },
    { timeoutSeconds, intervalSeconds: 20, unknownGraceSeconds: 60 },
  );
  return { res, waits };
}
const prod = (commit: string): BuildInfo => ({ commit, environment: "production" });
let w = await live([prod("c2")]);
assert.equal(w.res.state, "live", "already live: no wait");
assert.equal(w.waits.length, 0);
w = await live([prod("c1"), prod("c1"), prod("c2")], "behind");
assert.deepEqual([w.res.state, w.waits.length], ["live", 2], "old commit still live: waits for the alias");
w = await live([prod("c3")], "ahead");
assert.equal(w.res.state, "newer", "a later deployment already contains the commit");
w = await live([prod("c1")], "behind");
assert.equal(w.res.state, "timeout", "rollback / never promoted: nothing sent");
w = await live([prod("cX")], "diverged");
assert.equal(w.res.state, "timeout", "an unrelated commit is live");
w = await live([{ commit: "c2", environment: "preview" }], null, 1000);
assert.equal(w.res.state, "unknown", "a preview answer never counts as production");
w = await live([null]);
assert.equal(w.res.state, "unknown", "no /api/build-info: short grace, then go on with a warning");
assert.ok(w.waits.reduce((x, y) => x + y, 0) <= 80);

// --- Record after a run --------------------------------------------------------------------
const base: State = { ...EMPTY_STATE, pages: { [S("/")]: { hash: "1", notifiedAt: "t0", sha: "c1" } }, lastProcessedSha: "c1", sitemap: [S("/")] };
const p2 = plan(base, [S("/"), S("/new")], new Map([[S("/"), ok("1")], [S("/new"), ok("9")]]), { sha: "c2", now: "t1" });
for (const o of ["accepted", "accepted-key-pending", "no-change"] as const) {
  const r = recordAfter(base, o, p2, { now: "t1", status: 200 })!;
  assert.equal(r.lastProcessedSha, "c2", o);
  assert.ok(r.pages[S("/new")], o);
  assert.equal(r.retry, null, o);
}
for (const o of ["failed", "aborted", "not-live"] as const) {
  const r = recordAfter(base, o, p2, { now: "t1", status: 429 })!;
  assert.deepEqual(r.pages, base.pages, `${o}: pages stay as last accepted`);
  assert.equal(r.lastProcessedSha, "c1", `${o}: the commit is not marked handled`);
  assert.deepEqual(r.retry, { since: "t1", attempts: 1, lastAt: "t1", lastOutcome: o, lastStatus: 429 });
  const again = recordAfter(r, o, p2, { now: "t2", status: 503 })!;
  assert.deepEqual([again.retry!.since, again.retry!.attempts], ["t1", 2], "retries are counted from the first failure");
}
for (const o of ["dry-run", "skipped", "nothing-pending"] as const) assert.equal(recordAfter(base, o, p2, { now: "t1", status: null }), null, `${o}: record untouched`);

// --- Should a run read the site? -------------------------------------------------------------
const m = { sha: "c1", liveCommit: null, force: false, maxRetries: 16 };
assert.equal(decide("status", base, m).run, false, "same commit twice after success: skipped");
assert.equal(decide("status", { ...base, retry: { since: "t", attempts: 1, lastAt: "t", lastOutcome: "failed", lastStatus: 429 } }, m).run, true, "a failed run never blocks the same commit");
assert.equal(decide("status", EMPTY_STATE, m).run, true, "after dry runs only (nothing stored): the first live run goes ahead");
assert.equal(decide("status", base, { ...m, sha: "c2" }).run, true);
assert.equal(decide("schedule", base, { ...m, liveCommit: "c1" }).run, false, "schedule: nothing pending");
assert.equal(decide("schedule", base, { ...m, liveCommit: "c9" }).run, true, "schedule: live commit never handled (missed event / rollback)");
assert.equal(decide("schedule", EMPTY_STATE, { ...m, liveCommit: "c1" }).run, true, "schedule: first run after enabling");
const pending = { ...base, retry: { since: "t", attempts: 3, lastAt: "t", lastOutcome: "failed", lastStatus: 503 } };
assert.equal(decide("schedule", pending, { ...m, liveCommit: "c1" }).run, true, "schedule: retries an unfinished run");
assert.equal(decide("schedule", { ...pending, retry: { ...pending.retry, attempts: 16 } }, { ...m, liveCommit: "c1" }).run, false, "schedule: stops after the limit");
assert.equal(decide("workflow_dispatch", base, m).run, true, "by hand: always");

console.log("indexnow: all checks passed");
