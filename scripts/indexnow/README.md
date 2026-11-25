# IndexNow (2026-11-25, final 2026-11-26)

Tells search engines that take part in IndexNow (Bing, Yandex, Naver, Seznam, Yep…) which
`https://connectripjapan.com` pages are new, updated, deleted or moved. Google does not take part:
Google keeps using the sitemap and Search Console.

## When it runs (`.github/workflows/indexnow.yml`)

| Trigger | What happens |
|---|---|
| Vercel commit status `success` | Only for commits contained in `main` (preview branches stop at once). The script asks `https://connectripjapan.com/api/build-info` which commit is live, every 20 s for up to 15 min, and goes ahead when the live commit **is** the deployed one or a later one that contains it. If the site still serves an older or unrelated commit (slow alias, failed promotion, rollback), nothing is sent and the run is marked unfinished. If the site does not report a commit at all (`/api/build-info` down), a dry run goes ahead with a warning after 60 s, but a **live run sends nothing** (unfinished; the scheduled check retries). This holds for every live trigger, manual runs included. |
| Every 3 h (only when sending is enabled) | One request to `/api/build-info`. Real work only when a run is unfinished (failure, 429, not live in time) or the live commit was never handled (missed event, redeploy, instant rollback). Gives up after 16 attempts (~2 days); the next deployment or a manual run starts again. |
| By hand (Actions → IndexNow → Run workflow) | `dry-run` (list only) or `live`. Always runs. |

Vercel creates no GitHub Deployments in this repository, so `deployment_status` is not available;
the commit status is used. One run at a time (`concurrency: indexnow-production`, never cancelled).
The workflow is separate from the deployment: the site is already live, and nothing here changes it.
Do not make it a required status check.

## Sending switch

Stopping at once: the variable is read when a run starts, so changing it does not affect a run that is
already queued or running. Set the variable first, then cancel those runs: Actions → IndexNow → the
run → **Cancel workflow** (or `gh run list --workflow indexnow.yml` and `gh run cancel <id>`).

Repository variable `INDEXNOW_ENABLED` (Settings → Secrets and variables → Actions → Variables).

- Not `true` (default): every run is a **dry run**. Nothing is sent, the record is not touched, no
  log line is written, the scheduled check does not run. The run's Summary shows the URL list.
- `true`: deployments and the scheduled check send. **First notification**: right after setting the
  variable, Actions → IndexNow → Run workflow → `live` (no need to wait for a deployment).

## What is sent

| Reason | When |
|---|---|
| added | in the sitemap and indexable, never notified before (or first run) |
| updated | its content fingerprint changed |
| deleted | notified before, now 404 / 410 |
| moved | notified before, now redirects (the new URL is sent as "added") |
| noindex | notified before, now noindex or canonicalised elsewhere (so engines drop it) |

Never sent: URLs outside the live sitemap; noindex pages, drafts and unapproved Explore articles;
anything that is not `https://connectripjapan.com/...` (localhost, `*.vercel.app`, `*.netlify.app`,
`www.`, `/v1`, query strings). Live mode refuses any other origin. A page dropped from the sitemap
but still live and indexable is not reported as deleted.

### Content fingerprint (no false updates)

SHA-256 of: title, meta description, canonical, meta robots, the visible text of `<main>`, and its
images (file + alt). Ignored: header / footer, scripts (Next.js payload, build ids), styles, SVG,
every other attribute (hashed class names, React ids, animation styles, data-* state), image
optimizer sizes, the daily USD reference next to yen prices, invisible characters and whitespace.
Checked: repeated fetches of production and a separate local build give identical fingerprints.

## Record (`indexnow-state` branch, public: URLs and run data only)

- `state.json`: URL → fingerprint, notified time and commit; the last sitemap; the live commit last
  handled; `retry` while a run is unfinished.
- `log/YYYY-MM.jsonl`: one line per live run: time, trigger, target commit, commit confirmed live,
  each URL with its reason, URLs not sent and why, HTTP status with meaning, every attempt and wait,
  retry count, outcome.
- The branch has its own `vercel.json` (`deploymentEnabled: false`) and is listed in the main
  `vercel.json`, so Vercel never builds it.

The record advances **only** when IndexNow received the request (or there was nothing to send).
Otherwise pages and the handled commit stay as they were, so the same URLs are found again. A dry run
never marks a commit as handled, so it never blocks a later live run.

Outcomes: `accepted` (HTTP 200: received), `accepted-key-pending` (HTTP 202: received, key
validation pending). **Neither means indexed.** `failed`, `aborted`, `not-live` (unfinished, retried
by the scheduled check), `no-change`, `skipped`, `nothing-pending`, `dry-run`.

## Errors

| Case | Behaviour |
|---|---|
| 429 | waits for Retry-After (else 60 / 120 / 300 s, at most 600 s), up to 4 attempts in the run; then the scheduled check retries every 3 h |
| 5xx, network | waits 15 / 30 / 60 s, up to 4 attempts; then the scheduled check |
| 400 / 403 / 422 | no retry in the run (needs a fix: format / key file / host); the scheduled check tries again |
| key file not served | nothing sent, unfinished |
| sitemap unreachable or empty | nothing sent, unfinished |
| more than half of the notified URLs vanish at once | treated as a broken sitemap, nothing sent (`--force` by hand to override) |
| a page cannot be read | that page keeps its record and is checked again next time |
| the same commit reported twice after success | skipped |

A failed run is marked red in Actions (GitHub e-mails the owner). Nothing needs doing by hand.

## Local

```sh
bun run indexnow:dry-run                                   # production, send nothing
bun run indexnow:dry-run -- --origin http://localhost:3083 # a local build (URLs stay the official ones)
bun run check:indexnow                                     # unit tests (part of test:unit)
```

`--simulate-accept` (dry run only, explicit `--state-dir` only) stores a record as if accepted, to
rehearse a sequence of runs.

## Key

`public/<KEY>.txt` holds the key only (`config.ts` KEY). It is public by design. To rotate: add a new
key file, change KEY, release, then delete the old file.
