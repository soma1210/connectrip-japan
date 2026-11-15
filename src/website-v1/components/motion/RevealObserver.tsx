"use client";

import { useLayoutEffect } from "react";

const MOTION_ATTR = "data-v1-motion";

/**
 * Drives the Home scroll motion (Reveal.module.css). Mounted once, on Home.
 *
 * 1. Reveals (time-based, once): `data-reveal-item`, alone or inside a
 *    `data-reveal-group`. What is already on screen or above it when the page
 *    opens is marked revealed BEFORE the hidden states are switched on, so a
 *    reload, back / forward or an #anchor never flashes or re-animates.
 *    `data-reveal-group="late"` waits until the group is well inside the screen.
 *
 * 2. Scroll-linked scenes (wide screens with a mouse, no reduced motion):
 *    - `data-progress="0.85"` → `--p`, 0 → 1 while the enclosing <section>
 *      travels the given share of the screen height after entering.
 *      `data-progress-from="top"` → measured from the top of the page instead
 *      (the scene change right after the Hero).
 *    - `data-parallax="0.07"` → `--py` in px.
 *    One passive scroll listener; values are eased towards their target in a
 *    rAF loop that stops when everything has settled, so mouse-wheel steps look
 *    continuous without taking over scrolling. Only scenes near the screen are
 *    computed. Nothing is stored in React state.
 *
 * On unmount (client navigation away from Home) everything is removed, so
 * pages that reuse the same components show them plainly.
 */
export function RevealObserver() {
  useLayoutEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const doc = document.documentElement;

    // ---- 1. Reveals ----
    const groups = [...document.querySelectorAll<HTMLElement>("[data-reveal-group]")];
    const loose = [...document.querySelectorAll<HTMLElement>("[data-reveal-item]")].filter((el) => !el.closest("[data-reveal-group]"));
    // A group reveals every item inside it, and itself when it is an item too.
    const itemsOf = (target: HTMLElement) =>
      target.hasAttribute("data-reveal-group")
        ? [...(target.hasAttribute("data-reveal-item") ? [target] : []), ...target.querySelectorAll<HTMLElement>("[data-reveal-item]")]
        : [target];

    const pending = new Set<HTMLElement>();
    for (const target of [...groups, ...loose]) {
      if (target.getBoundingClientRect().top < window.innerHeight) itemsOf(target).forEach((el) => el.setAttribute("data-revealed", "instant"));
      else pending.add(target);
    }
    doc.setAttribute(MOTION_ATTR, "on");

    const makeObserver = (rootMargin: string) =>
      new IntersectionObserver(
        (entries, observer) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            itemsOf(entry.target as HTMLElement).forEach((el) => el.setAttribute("data-revealed", ""));
            observer.unobserve(entry.target);
            pending.delete(entry.target as HTMLElement);
          }
        },
        { rootMargin, threshold: 0 },
      );
    // Start a little after the top edge has entered the screen; "late" groups about a third of the way in.
    const io = makeObserver("0px 0px -12% 0px");
    const ioLate = makeObserver("0px 0px -34% 0px");
    const observerOf = (target: HTMLElement) => (target.getAttribute("data-reveal-group") === "late" ? ioLate : io);
    pending.forEach((target) => observerOf(target).observe(target));

    // Anything the page has jumped past (scroll restored on back / forward, End key, a fast fling) is
    // shown without animation, so scrolling back up never finds hidden content.
    let passedFrame = 0;
    const showPassed = () => {
      passedFrame = 0;
      for (const target of pending) {
        if (target.getBoundingClientRect().bottom >= 0) continue;
        itemsOf(target).forEach((el) => el.setAttribute("data-revealed", "instant"));
        observerOf(target).unobserve(target);
        pending.delete(target);
      }
      if (pending.size === 0) window.removeEventListener("scroll", onPassed);
    };
    const onPassed = () => {
      if (!passedFrame) passedFrame = window.requestAnimationFrame(showPassed);
    };
    window.addEventListener("scroll", onPassed, { passive: true });

    // ---- 2. Scroll-linked scenes ----
    type Scene = { el: HTMLElement; host: Element; p: number | null; py: number | null };
    const scenes: Scene[] = [...document.querySelectorAll<HTMLElement>("[data-progress], [data-parallax]")].map((el) => ({
      el,
      host: el.closest("section") ?? el.parentElement ?? el,
      p: null,
      py: null,
    }));
    const near = new Set<Element>();
    const allowed = window.matchMedia("(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    let frame = 0;

    const clear = () => {
      for (const s of scenes) {
        s.el.style.removeProperty("--p");
        s.el.style.removeProperty("--py");
        s.p = null;
        s.py = null;
      }
    };

    const tick = () => {
      frame = 0;
      if (!allowed.matches) {
        clear();
        return;
      }
      const vh = window.innerHeight;
      let moving = false;
      for (const s of scenes) {
        const fromTop = s.el.dataset.progressFrom === "top";
        if (!fromTop && !near.has(s.host)) continue;
        const rect = fromTop ? null : s.host.getBoundingClientRect();
        if (s.el.dataset.progress !== undefined) {
          const span = Number(s.el.dataset.progress) || 0.85;
          const target = rect ? clamp((vh - rect.top) / (vh * span), 0, 1) : clamp(window.scrollY / (vh * span), 0, 1);
          // First value: jump (page opened mid-scroll). Afterwards: ease towards the target.
          s.p = s.p === null ? target : s.p + (target - s.p) * 0.16;
          if (Math.abs(target - s.p) < 0.0015) s.p = target;
          else moving = true;
          s.el.style.setProperty("--p", s.p.toFixed(4));
        }
        if (s.el.dataset.parallax !== undefined && rect) {
          const factor = Number(s.el.dataset.parallax) || 0.06;
          const target = clamp(-(rect.top + rect.height / 2 - vh / 2) * factor, -64, 64);
          s.py = s.py === null ? target : s.py + (target - s.py) * 0.16;
          if (Math.abs(target - s.py) < 0.2) s.py = target;
          else moving = true;
          s.el.style.setProperty("--py", `${s.py.toFixed(1)}px`);
        }
      }
      if (moving) frame = window.requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!frame) frame = window.requestAnimationFrame(tick);
    };
    // Scenes are computed only while their section is within half a screen of the viewport.
    const sio = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) near.add(entry.target);
          else near.delete(entry.target);
        }
        kick();
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    new Set(scenes.map((s) => s.host)).forEach((host) => sio.observe(host));
    if (scenes.length > 0) {
      window.addEventListener("scroll", kick, { passive: true });
      window.addEventListener("resize", kick, { passive: true });
      allowed.addEventListener("change", kick);
      tick();
    }

    return () => {
      io.disconnect();
      ioLate.disconnect();
      sio.disconnect();
      window.removeEventListener("scroll", onPassed);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      allowed.removeEventListener("change", kick);
      if (frame) window.cancelAnimationFrame(frame);
      if (passedFrame) window.cancelAnimationFrame(passedFrame);
      clear();
      doc.removeAttribute(MOTION_ATTR);
    };
  }, []);
  return null;
}
