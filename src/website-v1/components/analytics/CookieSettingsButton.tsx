"use client";

import { openCookieSettings } from "../../consent/consent";

/** Footer link that reopens the cookie panel (shown only where GA4 is enabled). */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={`cursor-pointer text-left ${className ?? ""}`}>
      Cookie Settings
    </button>
  );
}
