// Small in-memory sliding-window rate limiter for public form endpoints.
//
// Best effort only: each serverless instance keeps its own counters, so a
// burst spread across several instances can get a little further. It is a
// speed bump against scripted floods, not a security boundary — the honeypot,
// validation and the database UNIQUE constraints do the real work.

const buckets = new Map<string, number[]>();
const MAX_KEYS = 5000;

export function isRateLimited(key: string, limit: number, windowMs: number, now = Date.now()) {
  const recent = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
  const limited = recent.length >= limit;
  if (!limited) recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > MAX_KEYS) {
    for (const [bucketKey, times] of buckets) {
      if (times.every((time) => now - time >= windowMs)) buckets.delete(bucketKey);
    }
  }
  return limited;
}

/** Client IP as seen by Netlify / common proxies, or null when unknown. */
export function clientIp(request: Request) {
  const headers = request.headers;
  return (
    headers.get("x-nf-client-connection-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    null
  );
}
