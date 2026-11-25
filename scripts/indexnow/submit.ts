import { ENDPOINT, HOST, KEY, KEY_LOCATION, MAX_URLS_PER_REQUEST, RETRY } from "./config";
import { isOfficialUrl } from "./page";

export type Attempt = { at: string; status: number | null; error?: string; waitSeconds?: number };

export type SubmitResult = {
  /** 200 or 202: IndexNow RECEIVED the URLs. It says nothing about indexing. */
  accepted: boolean;
  status: number | null;
  attempts: Attempt[];
  message?: string;
};

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;
export type Sleep = (seconds: number) => Promise<void>;

/** Retry-After as seconds ("120") or an HTTP date. */
export function retryAfterSeconds(value: string | null, now = Date.now()): number | null {
  if (!value) return null;
  if (/^\d+$/.test(value.trim())) return Number(value.trim());
  const at = Date.parse(value);
  return Number.isNaN(at) ? null : Math.max(0, Math.ceil((at - now) / 1000));
}

const MEANING: Record<number, string> = {
  200: "OK: URLs received",
  202: "Accepted: URLs received, key validation pending",
  400: "Bad request: invalid format",
  403: "Forbidden: key not valid (key file missing or wrong)",
  422: "Unprocessable: URLs not on this host or key mismatch",
  429: "Too many requests",
};

export function meaning(status: number | null): string {
  if (status === null) return "network error";
  return MEANING[status] ?? (status >= 500 ? "server error" : `HTTP ${status}`);
}

/**
 * POST the URLs to IndexNow, once per batch of 10,000. Retries 429 (Retry-After,
 * else 60/120/300 s), 5xx and network errors (15/30/60 s); never retries
 * 400/403/422, which need a fix, not a retry. Only official URLs are ever sent.
 */
export async function submit(urls: string[], deps: { fetch: Fetch; sleep: Sleep; now?: () => string }): Promise<SubmitResult> {
  const now = deps.now ?? (() => new Date().toISOString());
  const bad = urls.filter((u) => !isOfficialUrl(u));
  if (bad.length) return { accepted: false, status: null, attempts: [], message: `refused to send non-official URLs: ${bad.join(", ")}` };
  if (urls.length === 0) return { accepted: true, status: null, attempts: [], message: "nothing to send" };

  const attempts: Attempt[] = [];
  let last: number | null = null;
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
    const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls.slice(i, i + MAX_URLS_PER_REQUEST) });
    let ok = false;
    for (let attempt = 1; attempt <= RETRY.maxAttempts; attempt++) {
      let status: number | null = null;
      let retryAfter: string | null = null;
      let error: string | undefined;
      try {
        const res = await deps.fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body });
        status = res.status;
        retryAfter = res.headers.get("retry-after");
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
      last = status;
      const entry: Attempt = { at: now(), status, ...(error ? { error } : {}) };
      attempts.push(entry);
      if (status === 200 || status === 202) {
        ok = true;
        break;
      }
      const retryable = status === null || status === 429 || status >= 500;
      if (!retryable || attempt === RETRY.maxAttempts) break;
      const table = status === 429 ? RETRY.tooManyRequestsBackoff : RETRY.serverErrorBackoff;
      const fallback = table[Math.min(attempt - 1, table.length - 1)];
      const wait = Math.min(RETRY.maxWaitSeconds, status === 429 ? (retryAfterSeconds(retryAfter) ?? fallback) : fallback);
      entry.waitSeconds = wait;
      await deps.sleep(wait);
    }
    if (!ok) return { accepted: false, status: last, attempts, message: meaning(last) };
  }
  return { accepted: true, status: last, attempts, message: meaning(last) };
}
