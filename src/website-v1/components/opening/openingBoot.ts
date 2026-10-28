/**
 * Home Opening Experience — vertical slit reveal (PENDING HUMAN VISUAL REVIEW).
 *
 * The opening plays once per browser session, on the first full page load of
 * Home. A tiny inline script (rendered by the v1 layout, before the header)
 * decides this before the first paint, so Home never flashes before the
 * overlay. It only sets an attribute on <html>; the Hero content is always in
 * the server HTML (the overlay sits on top of it).
 *
 * States of `<html data-v1-opening>`:
 * - "pending":  overlay shows its dark backdrop; HomeOpeningExperience
 *               starts the timeline, then →
 * - "play":     the CSS animations run until component completion (HomeOpeningExperience.module.css).
 * - "reduced":  prefers-reduced-motion — short navy fade, then
 * - "reduced-out": faded out in 0.6 s
 * - "done":     overlay hidden; normal site
 * No attribute: no opening (no JS, later visits, client-side navigation).
 *
 * To see it again during development: open `/v1?opening=1`, or run
 * `sessionStorage.removeItem("ctj-v1-opening-seen")` and reload, or use a new tab.
 */
export const OPENING_ATTR = "data-v1-opening";
export const OPENING_SEEN_KEY = "ctj-v1-opening-seen";
/** Legacy attribute cleaned up by the boot safety net. */
export const OPENING_HOLD_ATTR = "data-v1-opening-hold";
/** Legacy Hero slider start delay. Preserve independently of opening completion. */
export const OPENING_TOTAL_MS = 3000;
export const OPENING_REDUCED_MS = 600;
/** Boot-only fallback: never interrupts a component-owned running animation. */
const OPENING_SAFETY_MS = 8000;

/** Inline script source. Runs during HTML parsing; must stay small and dependency-free. */
export function openingBootScript(homePath: string): string {
  return `(function(){try{var d=document.documentElement,p=location.pathname.replace(/\\/$/,"")||"/";if(p!==${JSON.stringify(homePath)})return;var f=/[?&]opening=1(&|$)/.test(location.search);if(!f&&sessionStorage.getItem(${JSON.stringify(OPENING_SEEN_KEY)}))return;sessionStorage.setItem(${JSON.stringify(OPENING_SEEN_KEY)},"1");d.setAttribute(${JSON.stringify(OPENING_ATTR)},matchMedia("(prefers-reduced-motion: reduce)").matches?"reduced":"pending");d.style.overflow="hidden";setTimeout(function(){if(["pending","reduced"].includes(d.getAttribute(${JSON.stringify(OPENING_ATTR)}))){d.setAttribute(${JSON.stringify(OPENING_ATTR)},"done");d.removeAttribute(${JSON.stringify(OPENING_HOLD_ATTR)});d.style.overflow=""}},${OPENING_SAFETY_MS})}catch(e){}})();`;
}
