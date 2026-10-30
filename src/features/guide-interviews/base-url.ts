// The origin used in links we send outside (booking links, admin notices).
//
// Production must use INTERVIEW_PUBLIC_BASE_URL, an https origin that is not a
// local address, so a misconfigured deploy fails loudly instead of emailing an
// applicant a link they cannot open. Development falls back to the request's
// origin (localhost).

/** INTERVIEW_PUBLIC_BASE_URL is missing or unusable in production. */
export class PublicBaseUrlError extends Error {}

const LOCAL_ORIGIN = /^https?:\/\/(?:localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i;

const trimSlashes = (url: string) => url.trim().replace(/\/+$/, "");

export const isLocalOrigin = (url: string) => LOCAL_ORIGIN.test(url.trim());

export function resolvePublicBaseUrl(options: {
  configured: string | undefined;
  requestOrigin: string;
  production: boolean;
}): string {
  const configured = options.configured ? trimSlashes(options.configured) : "";
  if (!options.production) return configured || trimSlashes(options.requestOrigin);

  if (!configured) throw new PublicBaseUrlError("INTERVIEW_PUBLIC_BASE_URL is not set.");
  if (!configured.startsWith("https://")) throw new PublicBaseUrlError("INTERVIEW_PUBLIC_BASE_URL must start with https://.");
  if (isLocalOrigin(configured)) throw new PublicBaseUrlError("INTERVIEW_PUBLIC_BASE_URL must not be a local address.");
  return configured;
}
