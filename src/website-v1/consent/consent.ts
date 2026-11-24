/**
 * Cookie consent for Google Analytics (owner instruction 2026-11-24).
 *
 * Basic consent mode: until the visitor chooses "Accept Analytics", the Google
 * tag is not loaded at all, so nothing is sent to Google. No choice, closing
 * the page or scrolling is never treated as consent.
 *
 * The choice is kept in the browser's localStorage under its own key,
 * separate from anything analytics stores, and is never sent to us or to
 * Google. It expires after CONSENT_MAX_AGE_MS, after which the banner asks
 * again. Browser-only module: call these functions in effects or handlers.
 */
export type AnalyticsChoice = "granted" | "denied";

export const CONSENT_STORAGE_KEY = "crj-cookie-consent";
/** Bump when the purposes change in a way that needs a new choice. */
export const CONSENT_VERSION = 1;
/** Ask again after 12 months (owner to confirm; see the review note). */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/** Fired on window after the choice changes (detail: AnalyticsChoice). */
export const CONSENT_CHANGE_EVENT = "crj:consent-change";
/** Fired on window to open the Cookie Settings panel (footer link). */
export const OPEN_COOKIE_SETTINGS_EVENT = "crj:open-cookie-settings";

type Stored = { v: number; analytics: AnalyticsChoice; at: number };

/** Used only when localStorage cannot be used (blocked storage): the choice lasts for this page. */
let memoryChoice: AnalyticsChoice | null = null;

/** The visitor's valid choice, or null when there is none (never chosen, expired, old version, unreadable). */
export function readConsent(now = Date.now()): AnalyticsChoice | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return memoryChoice;
  }
  try {
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Stored>;
    if (s.v !== CONSENT_VERSION || (s.analytics !== "granted" && s.analytics !== "denied") || typeof s.at !== "number") return null;
    if (now - s.at > CONSENT_MAX_AGE_MS || s.at > now + 60_000) return null;
    return s.analytics;
  } catch {
    return null;
  }
}

/** Saves the choice and tells the page. If storage is blocked, the choice still applies to this page view. */
export function writeConsent(choice: AnalyticsChoice) {
  memoryChoice = choice;
  try {
    const value: Stored = { v: CONSENT_VERSION, analytics: choice, at: Date.now() };
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode / blocked storage: nothing remembered, the banner asks again next time.
  }
  window.dispatchEvent(new CustomEvent<AnalyticsChoice>(CONSENT_CHANGE_EVENT, { detail: choice }));
}

export function analyticsConsentGranted(): boolean {
  return typeof window !== "undefined" && readConsent() === "granted";
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

/**
 * Deletes the Google Analytics cookies (_ga, _ga_<container>, and the older
 * _gid / _gat) for this host and each parent domain, since the Google tag
 * sets them on the widest domain it can (e.g. `.connectripjapan.com`).
 */
export function deleteAnalyticsCookies() {
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((n) => /^(_ga(_.+)?|_gid|_gat(_.+)?)$/.test(n));
  if (names.length === 0) return;
  const parts = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join(".")}`);
  for (const name of names) {
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
  }
}
