/**
 * IndexNow settings (2026-11-25). See scripts/indexnow/README.md.
 *
 * The key is public by design: search engines verify it by reading
 * https://connectripjapan.com/<KEY>.txt (public/<KEY>.txt), which must contain the key only.
 * Rotating it: create a new public/<key>.txt, change KEY here, release, then delete the old file.
 */
export const SITE_ORIGIN = "https://connectripjapan.com";
export const HOST = "connectripjapan.com";
export const KEY = "ef7bc773cb5d3c99b8a0abe0dbfc69aa";
export const KEY_LOCATION = `${SITE_ORIGIN}/${KEY}.txt`;
export const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;

/** Shared endpoint: forwarded to every participating engine (Bing, Yandex, Naver, Seznam, Yep…). Google does not take part. */
export const ENDPOINT = "https://api.indexnow.org/indexnow";

/** IndexNow accepts up to 10,000 URLs per request. */
export const MAX_URLS_PER_REQUEST = 10_000;

/** Retry policy for one request. */
export const RETRY = {
  maxAttempts: 4,
  /** Waits (seconds) after 429 when the response has no usable Retry-After. */
  tooManyRequestsBackoff: [60, 120, 300],
  /** Waits (seconds) after 5xx or a network error. */
  serverErrorBackoff: [15, 30, 60],
  /** Upper bound for any single wait, Retry-After included. */
  maxWaitSeconds: 600,
};

/**
 * Safety stop: a run that would remove more than this share of the previously
 * notified URLs is treated as a broken sitemap, not as real deletions.
 */
export const MAX_REMOVAL_SHARE = 0.5;

/** Where the live site reports its commit (src/app/api/build-info/route.ts). */
export const BUILD_INFO_URL = `${SITE_ORIGIN}/api/build-info`;

/** After a production deployment: how long to wait for connectripjapan.com to serve the commit. */
export const LIVE_WAIT = { timeoutSeconds: 900, intervalSeconds: 20, unknownGraceSeconds: 60 };

/** The scheduled check stops retrying an unfinished run after this many attempts (≈ 2 days at every 3 h). */
export const MAX_SCHEDULED_RETRIES = 16;

export const USER_AGENT = "ConnectripJapan-IndexNow/1.0 (+https://connectripjapan.com)";
