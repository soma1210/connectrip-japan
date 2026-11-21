"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "./gsap";

/**
 * Page transition (2026-11-22, luxury pass): leaving a page, a lacquer-black
 * curtain rises from the foot of the screen (0.65 s) while a fine ivory line
 * draws across its centre and the brand name surfaces in spaced capitals; the
 * next page loads behind it; then the curtain lifts away upward (1 s) and the
 * new page's own entrance plays. Internal links only (same origin, new path,
 * no modifier keys, no new tab / download); back / forward navigate as usual.
 * Off with reduced motion. Mounted once in the layout.
 */
export function PageTransition() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const covered = useRef(false);
  const safety = useRef(0);

  // Reveal the new page once its path is live.
  useEffect(() => {
    const el = root.current;
    if (!el || !covered.current) return;
    covered.current = false;
    window.clearTimeout(safety.current);
    const line = el.querySelector("[data-pt-line]");
    const mark = el.querySelectorAll("[data-pt-char]");
    gsap
      .timeline({ delay: 0.15, onComplete: () => void (el.style.visibility = "hidden") })
      .to(mark, { autoAlpha: 0, y: -10, duration: 0.35, ease: "power2.in", stagger: 0.012 }, 0)
      .to(line, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.45, ease: "power3.in" }, 0)
      .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "power4.inOut" }, 0.3);
  }, [pathname]);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const line = el.querySelector("[data-pt-line]");
    const mark = el.querySelectorAll("[data-pt-char]");

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return; // files
      e.preventDefault();
      covered.current = true;
      el.style.visibility = "visible";
      gsap
        .timeline({ onComplete: () => router.push(url.pathname + url.search + url.hash) })
        .fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.65, ease: "power4.inOut" }, 0)
        .fromTo(line, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.6, ease: "power3.inOut" }, 0.3)
        .fromTo(mark, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.018 }, 0.4);
      // Never leave the screen covered if the navigation stalls.
      safety.current = window.setTimeout(() => {
        covered.current = false;
        gsap.to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.7, ease: "power3.out", onComplete: () => void (el.style.visibility = "hidden") });
      }, 6000);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(safety.current);
    };
  }, [router]);

  return (
    <div ref={root} aria-hidden className="wd-curtain">
      <div className="wd-curtain__inner">
        <span data-pt-line className="wd-curtain__line" />
        <span className="wd-curtain__mark">
          {"CONNECTRIP JAPAN".split("").map((ch, i) => (
            <span key={i} data-pt-char className="inline-block">
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
