"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./gsap";

/**
 * Site-wide pointer and scroll feedback:
 * - Scroll progress: a thin gold line across the top of the screen grows with
 *   the page (scaleX from the scroll position).
 * - Tilt: cards marked `data-wd-tilt` lean towards the pointer in 3D (CSS
 *   `rotate` / `scale`, so scroll animations on `transform` are kept) and a
 *   soft light follows the pointer across them.
 * - Magnetic CTAs: the paired buttons are pulled a little towards the pointer
 *   and spring back when it leaves (CSS `translate`, so no transform clashes).
 * - Spotlight: a soft light trails the pointer across the whole site.
 * - Ripple: photos inside `data-ripple` ripple like water as the pointer arrives.
 * Mouse devices with motion only for tilt / magnetic / light / ripple; the progress line shows everywhere.
 */
export function Interactions() {
  const bar = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const line = bar.current;
    let frame = 0;
    const progress = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      line?.style.setProperty("transform", `scaleX(${max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0})`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(progress);
    };
    progress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
    let tilted: HTMLElement | null = null;
    let pulled: HTMLElement | null = null;
    const reset = (el: HTMLElement | null, kind: "tilt" | "pull") => {
      if (!el) return;
      if (kind === "tilt") {
        el.style.removeProperty("rotate");
        el.style.removeProperty("scale");
        el.removeAttribute("data-wd-tilting");
      } else el.style.removeProperty("translate");
    };
    const move = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const card = t?.closest<HTMLElement>("[data-wd-tilt]") ?? null;
      if (card !== tilted) {
        reset(tilted, "tilt");
        tilted = card;
      }
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        // CSS `rotate` (axis + angle) and `scale` sit beside any GSAP transform on the card; the parent gives the depth.
        card.parentElement?.style.setProperty("perspective", "1000px");
        card.setAttribute("data-wd-tilting", "");
        card.style.setProperty("rotate", `${(-py).toFixed(3)} ${px.toFixed(3)} 0 ${(Math.hypot(px, py) * 22).toFixed(2)}deg`);
        card.style.setProperty("scale", "1.025");
        card.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
      }
      const cta = t?.closest<HTMLElement>("a[data-cta-id]") ?? null;
      if (cta !== pulled) {
        reset(pulled, "pull");
        pulled = cta;
      }
      if (cta) {
        const r = cta.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        cta.style.setProperty("translate", `${(dx * 0.22).toFixed(1)}px ${(dy * 0.32).toFixed(1)}px`);
      }
    };
    // Spotlight: a soft light trails the pointer (eased).
    const light = spot.current;
    let lx = window.innerWidth / 2;
    let ly = window.innerHeight / 2;
    let tx = lx;
    let ty = ly;
    let lraf = 0;
    const glide = () => {
      lx += (tx - lx) * 0.12;
      ly += (ty - ly) * 0.12;
      light?.style.setProperty("--mx", `${lx.toFixed(1)}px`);
      light?.style.setProperty("--my", `${ly.toFixed(1)}px`);
      lraf = Math.abs(tx - lx) + Math.abs(ty - ly) > 0.5 ? requestAnimationFrame(glide) : 0;
    };
    const onLight = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      light?.setAttribute("data-on", "");
      if (!lraf) lraf = requestAnimationFrame(glide);
    };

    // Ripple: photos inside [data-ripple] ripple like water when the pointer arrives.
    const disp = document.getElementById("wd-ripple-map");
    const turb = document.getElementById("wd-ripple-noise");
    let rippled: HTMLElement | null = null;
    const onOver = (e: PointerEvent) => {
      const img = (e.target as HTMLElement | null)?.closest("[data-ripple]")?.querySelector<HTMLElement>("img") ?? null;
      if (!img || img === rippled || !disp) return;
      if (rippled) rippled.style.filter = "";
      rippled = img;
      img.style.filter = "url(#wd-ripple)";
      const st = { s: 0, f: 0.004 };
      gsap.killTweensOf(st);
      gsap
        .timeline({ onComplete: () => { if (rippled === img) { img.style.filter = ""; rippled = null; } } })
        .to(st, { s: 34, f: 0.022, duration: 0.45, ease: "power2.out", onUpdate: () => { disp.setAttribute("scale", st.s.toFixed(1)); turb?.setAttribute("baseFrequency", `${st.f.toFixed(4)} ${(st.f * 2.4).toFixed(4)}`); } })
        .to(st, { s: 0, f: 0.004, duration: 1.1, ease: "power3.out", onUpdate: () => { disp.setAttribute("scale", st.s.toFixed(1)); turb?.setAttribute("baseFrequency", `${st.f.toFixed(4)} ${(st.f * 2.4).toFixed(4)}`); } });
    };

    const leave = () => {
      reset(tilted, "tilt");
      reset(pulled, "pull");
      tilted = pulled = null;
    };
    if (fine) {
      window.addEventListener("pointermove", onLight, { passive: true });
      document.addEventListener("pointerover", onOver, { passive: true });
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointermove", onLight);
      document.removeEventListener("pointerover", onOver);
      cancelAnimationFrame(lraf);
      document.documentElement.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
      leave();
    };
  }, []);

  return (
    <>
      <div ref={bar} aria-hidden className="wd-progress" />
      <div ref={spot} aria-hidden className="wd-spot" />
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id="wd-ripple" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence id="wd-ripple-noise" type="fractalNoise" baseFrequency="0.004 0.0096" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap id="wd-ripple-map" in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </>
  );
}
