"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  OPEN_COOKIE_SETTINGS_EVENT,
  deleteAnalyticsCookies,
  readConsent,
  writeConsent,
  type AnalyticsChoice,
} from "../../consent/consent";
import { OPENING_ATTR } from "../opening/openingBoot";

/**
 * Cookie consent banner + Google Analytics 4 under Google Consent Mode v2,
 * basic implementation (owner instruction 2026-11-24). Rendered only where
 * GA4 is enabled (Vercel Production; see website-v1/analytics.ts).
 *
 * - No choice yet: the banner shows; the Google tag is NOT loaded, so nothing
 *   is sent to Google. Closing the page or scrolling is not consent.
 * - Accept Analytics: consent defaults (everything denied), then
 *   analytics_storage granted, then the Google tag loads and sends the page_view.
 *   ad_storage, ad_user_data and ad_personalization stay denied, and Google
 *   signals / ad personalization are switched off: no advertising use.
 * - Reject Analytics: the tag is never loaded.
 * - Changed to reject later: `ga-disable-<ID>` stops every further hit on this
 *   page, analytics_storage is updated to denied and the _ga cookies are deleted.
 *   Later pages never load the tag.
 *
 * The banner waits for the Home opening animation to finish, so it never
 * covers it. "Cookie Settings" in the footer reopens the panel at any time.
 */

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; [key: string]: unknown };

/** Consent commands go to the dataLayer once per page, before the tag's own config. */
let consentInitialised = false;

function gtagFor(w: GtagWindow) {
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== "function") {
    // Google's own stub: gtag.js reads Arguments objects from the dataLayer, not arrays.
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
  }
  return w.gtag;
}

function grantAnalytics(gaId: string) {
  const w = window as unknown as GtagWindow;
  w[`ga-disable-${gaId}`] = false;
  const gtag = gtagFor(w);
  if (!consentInitialised) {
    consentInitialised = true;
    gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
    gtag("set", "allow_google_signals", false);
    gtag("set", "allow_ad_personalization_signals", false);
  }
  gtag("consent", "update", { analytics_storage: "granted" });
}

function stopAnalytics(gaId: string) {
  const w = window as unknown as GtagWindow;
  w[`ga-disable-${gaId}`] = true;
  if (consentInitialised && typeof w.gtag === "function") w.gtag("consent", "update", { analytics_storage: "denied" });
  deleteAnalyticsCookies();
}

/** Runs before <GoogleAnalytics> (sibling effects run in order), so consent is set before its config. */
function ConsentGrant({ gaId }: { gaId: string }) {
  useEffect(() => grantAnalytics(gaId), [gaId]);
  return null;
}

function subscribeConsent(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_STORAGE_KEY) onChange();
  };
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const OPENING_PLAYING = ["pending", "play", "reduced", "reduced-out"];

function subscribeOpening(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [OPENING_ATTR] });
  return () => observer.disconnect();
}

const BUTTON =
  "inline-flex min-h-11 w-full items-center justify-center px-4 py-2.5 text-[13px] font-medium tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold cursor-pointer";
// Deep crimson from the brand red: cream text 5.05:1 (WCAG AA); brand red #e0532f would only give 3.17:1.
const ACCEPT = `${BUTTON} bg-[#ad3b1d] text-[#f3e8d2] hover:bg-[#93311a]`;
// Literal cream: the site turns `.bg-cream` panels into dark surfaces (globals.css), which would hide Reject.
const REJECT = `${BUTTON} bg-[#f3e8d2] text-[#0f0e0d] hover:bg-[#e4d5b8]`;
const SMALL_LINK =
  "text-[12px] tracking-[0.04em] text-cream/70 underline decoration-cream/30 underline-offset-4 transition-colors hover:text-gold hover:decoration-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold cursor-pointer";

export function CookieConsent({ gaId, privacyHref }: { gaId: string; privacyHref: string }) {
  const uid = useId();
  // undefined on the server and during hydration: render nothing until the browser has read the choice.
  const choice = useSyncExternalStore<AnalyticsChoice | null | undefined>(subscribeConsent, readConsent, () => undefined);
  const openingPlaying = useSyncExternalStore(
    subscribeOpening,
    () => OPENING_PLAYING.includes(document.documentElement.getAttribute(OPENING_ATTR) ?? ""),
    () => false,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // No consent (never chosen, rejected, expired): stop and clear anything analytics left behind.
  useEffect(() => {
    if (choice === "denied" || choice === null) stopAnalytics(gaId);
  }, [choice, gaId]);

  // Footer "Cookie Settings".
  useEffect(() => {
    const open = () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    if (settingsOpen) headingRef.current?.focus();
  }, [settingsOpen]);

  const closeSettings = () => {
    setSettingsOpen(false);
    opener.current?.focus();
    opener.current = null;
  };

  const choose = (next: AnalyticsChoice) => {
    writeConsent(next);
    if (settingsOpen) closeSettings();
  };

  const view = settingsOpen ? "settings" : choice === null && !openingPlaying ? "banner" : null;
  const titleId = `${uid}-title`;

  return (
    <>
      {choice === "granted" ? (
        <>
          <ConsentGrant gaId={gaId} />
          <GoogleAnalytics gaId={gaId} />
        </>
      ) : null}

      {view ? (
        <section
          data-cookie-consent={view}
          aria-labelledby={titleId}
          onKeyDown={(e) => {
            if (e.key === "Escape" && view === "settings" && choice !== null) closeSettings();
          }}
          className="fixed inset-x-3 bottom-3 z-[49] max-h-[calc(100svh-1.5rem)] overflow-y-auto border border-gold/25 bg-navy-dark/95 text-cream shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] backdrop-blur-md print:hidden sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[min(27rem,calc(100vw-3rem))]"
        >
          <div className="p-5 sm:p-6">
            <span aria-hidden className="block h-px w-10 bg-red" />
            {view === "banner" ? (
              <>
                <h2 id={titleId} className="mt-4 font-heading-en text-[15px] font-medium tracking-[0.08em] text-cream">
                  Your Privacy Matters
                </h2>
                <p className="mt-2 text-[13px] leading-[1.65] text-cream/75">
                  We use optional analytics cookies to understand how visitors use our website and improve your experience. You can accept or
                  reject analytics cookies at any time.
                </p>
              </>
            ) : (
              <>
                <h2 id={titleId} ref={headingRef} tabIndex={-1} className="mt-4 font-heading-en text-[15px] font-medium tracking-[0.08em] text-cream outline-none">
                  Cookie Settings
                </h2>
                <p className="mt-2 text-[13px] leading-[1.65] text-cream/75">
                  Choose whether we may use optional analytics cookies. You can change your choice at any time from &ldquo;Cookie Settings&rdquo; at
                  the bottom of every page.
                </p>
                <dl className="mt-4 divide-y divide-cream/10 border-y border-cream/10 text-[12.5px] leading-[1.6]">
                  <div className="py-3">
                    <dt className="flex items-center justify-between gap-3 font-medium text-cream">
                      Strictly necessary <span className="text-[11px] font-normal tracking-[0.08em] text-gold/80">Always on</span>
                    </dt>
                    <dd className="mt-1 text-cream/65">
                      Remembers your cookie choice in this browser and, while the tab is open, that the home page opening has been shown. Nothing
                      is sent to us or to anyone else.
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="flex items-center justify-between gap-3 font-medium text-cream">
                      Analytics (Google Analytics 4)
                      <span className="text-[11px] font-normal tracking-[0.08em] text-gold/80">
                        {choice === "granted" ? "On" : choice === "denied" ? "Off" : "Off · not chosen"}
                      </span>
                    </dt>
                    <dd className="mt-1 text-cream/65">
                      Helps us see how visitors find and use this website: pages viewed, where visits come from, approximate country or region
                      and device type. Uses Google Analytics cookies; the service is provided by Google LLC. Off unless you accept.
                    </dd>
                  </div>
                </dl>
              </>
            )}

            {/* Equal buttons: rejecting is as easy as accepting. */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => choose("denied")} className={REJECT}>
                Reject Analytics
              </button>
              <button type="button" onClick={() => choose("granted")} className={ACCEPT}>
                Accept Analytics
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <Link href={`${privacyHref}#cookies`} className={SMALL_LINK}>
                Privacy Policy
              </Link>
              {view === "banner" ? (
                <button type="button" onClick={() => setSettingsOpen(true)} className={SMALL_LINK}>
                  Cookie Settings
                </button>
              ) : (
                <button type="button" onClick={closeSettings} className={SMALL_LINK}>
                  {choice === null ? "Back" : "Close"}
                </button>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
