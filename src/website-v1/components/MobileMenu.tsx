"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { NavItem } from "@/contracts";
import { cn } from "@/lib/cn";
import type { RecruitNav } from "../content/pages";
import { RecruitAccordion } from "./RecruitMenu";
import { TbdText } from "./Tbd";
import { gsap } from "./wd/gsap";

/**
 * Full-screen menu (award redesign 2026-11-22), below 1340 px where the bar
 * has no inline nav. Same items, CTAs and RECRUIT links as before.
 * Opening: a white panel spreads from the top-right corner (0.7 s), then the
 * links rise in huge type, sharpening from a blur one after another; the CTAs
 * follow. Closing plays it back faster. The bar (and this toggle) stays on
 * top; page scrolling is held while the menu is open (data-menu-open).
 */
export function MobileMenu({
  items,
  recruit,
  children,
  ctaClassName,
}: {
  items: NavItem[];
  recruit: RecruitNav;
  /** CTAs, shown first so they are visible as soon as the menu opens. */
  children: ReactNode;
  /** Hides the CTA block where the header already shows the CTAs. */
  ctaClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  // True only in the browser (the portal needs document.body); no state set in an effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const links = el.querySelectorAll<HTMLElement>("[data-menu-item]");
    document.documentElement.toggleAttribute("data-menu-open", open);
    if (open) {
      el.style.visibility = "visible";
      if (reduced) {
        gsap.set(el, { clipPath: "circle(150% at 100% 0%)" });
        gsap.set(links, { autoAlpha: 1, y: 0, filter: "none" });
        return;
      }
      gsap
        .timeline()
        .fromTo(el, { clipPath: "circle(0% at 100% 0%)" }, { clipPath: "circle(150% at 100% 0%)", duration: 0.75, ease: "power3.inOut" })
        .fromTo(
          links,
          { autoAlpha: 0, y: 40, filter: "blur(10px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out", stagger: 0.07 },
          0.35,
        );
    } else if (el.style.visibility === "visible") {
      gsap
        .timeline({ onComplete: () => void (el.style.visibility = "hidden") })
        .to(links, { autoAlpha: 0, y: -20, duration: 0.25, ease: "power2.in", stagger: 0.02 })
        .to(el, { clipPath: "circle(0% at 100% 0%)", duration: 0.5, ease: "power3.inOut" }, 0.1);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => document.documentElement.removeAttribute("data-menu-open"), []);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative z-[2] flex h-11 w-11 items-center justify-center text-cream min-[1340px]:hidden"
        aria-label="Menu"
        aria-expanded={open}
      >
        {/* Two lines that cross into an X. */}
        <span aria-hidden className="relative block h-3 w-6">
          <span className={cn("absolute left-0 h-px w-full bg-current transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)]", open ? "top-1.5 rotate-45" : "top-0")} />
          <span className={cn("absolute left-0 h-px w-full bg-current transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)]", open ? "top-1.5 -rotate-45" : "top-3")} />
        </span>
      </button>

      {mounted
        ? createPortal(
            <div
              ref={panel}
              data-lenis-prevent
              className="invisible fixed inset-0 z-[45] overflow-y-auto bg-paper text-ink min-[1340px]:hidden"
              style={{ clipPath: "circle(0% at 100% 0%)" }}
              aria-hidden={!open}
            >
              <div className="mx-auto flex min-h-full w-full max-w-(--container-app) flex-col px-5 pt-28 pb-10 md:px-10 md:pt-32">
                <nav aria-label="Main" className="flex flex-col">
                  {items.map((item) => (
                    <div key={item.id} data-menu-item className="border-b border-ink/10">
                      <Link
                        href={item.href}
                        onClick={close}
                        tabIndex={open ? undefined : -1}
                        className="group flex items-baseline justify-between py-4 font-display text-[clamp(2.2rem,8vw,4.6rem)] leading-[1.05] text-ink transition-colors hover:text-enji"
                      >
                        <TbdText value={item.label} slot="Nav label" />
                        <span aria-hidden className="translate-x-[-0.4em] font-sans text-base opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                          →
                        </span>
                      </Link>
                    </div>
                  ))}
                  <div data-menu-item className="pt-6 text-ink">
                    <RecruitAccordion recruit={recruit} onNavigate={close} />
                  </div>
                </nav>
                <div data-menu-item className={cn("mt-auto flex flex-wrap gap-3 pt-10", ctaClassName)} onClick={close}>
                  {children}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
