"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Header behaviour (white-desert.com nav):
 * - over the Home Hero at the top of the page the bar is clear (no navy band),
 *   so the photo runs to the top edge;
 * - scrolling down tucks the bar away, any scroll up brings it back as a
 *   frosted glass bar;
 * - never hidden while its menu is open or something inside it has focus.
 * Writes data attributes on <header id="v1-header">; styles in wd.css.
 */
export function HeaderMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const header = document.getElementById("v1-header");
    if (!header) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const hero = document.getElementById("home-hero");
      const clear = !!hero && y < 24;
      header.toggleAttribute("data-clear", clear);
      header.toggleAttribute("data-scrolled", y > 24);
      // Keyboard focus only: a clicked link keeps focus but should not pin the bar.
      const busy = !!header.querySelector(":focus-visible, [aria-expanded='true']");
      if (!reduced && !busy && y > 180 && y > last + 2) header.setAttribute("data-hidden", "");
      else if (y < last - 2 || y <= 180 || busy) header.removeAttribute("data-hidden");
      last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    header.addEventListener("focusin", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      header.removeEventListener("focusin", onScroll);
      cancelAnimationFrame(frame);
      header.removeAttribute("data-hidden");
      header.removeAttribute("data-clear");
    };
  }, [pathname]);

  return null;
}
