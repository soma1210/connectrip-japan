"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { getLenis } from "./SmoothScroll";

/**
 * Motion of HowItWorksScene. Wide screens: one ScrollTrigger over the held
 * section splits the scroll into one part per service (first half Ready-made
 * Experience, second half Private Guide); the part the scroll is in decides
 * the service on screen. A change of service plays as a short, timed
 * transition (not scrubbed): the giant number rolls, the panels cross-fade
 * with a light slide, the steps rise one after another, the progress rule
 * draws, the tab underline and the background light move.
 * Tabs (every screen): choosing a service glides the page to the middle of
 * its part of the scroll (phones: to its panel), so the scroll stays the only
 * source of the state and click / scroll never disagree.
 * Phones: steps rise as they scroll in. Reduced motion: no animation.
 */
export function HowItWorksMotion({ targetId, flowCount }: { targetId: string; flowCount: number }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const flows = [...root.querySelectorAll<HTMLElement>("[data-hiw-flow]")];
    const numbers = root.querySelector<HTMLElement>("[data-hiw-numbers]");
    const count = root.querySelector<HTMLElement>("[data-hiw-count]");
    const tabs = [...root.querySelectorAll<HTMLButtonElement>("[data-hiw-tab]")];
    const underline = root.querySelector<HTMLElement>("[data-hiw-underline]");
    const glow = root.querySelector<HTMLElement>("[data-hiw-glow]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const d = (s: number) => (reduced ? 0 : s);
    const pad = (n: number) => String(n).padStart(2, "0");
    const mark = (f: number) =>
      tabs.forEach((t, j) => {
        t.toggleAttribute("data-on", j === f);
        t.setAttribute("aria-pressed", String(j === f));
      });

    // Where a tab takes the page; set per screen size below.
    let target: (f: number) => number = () => window.scrollY;
    const glideTo = (y: number) => {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration: reduced ? 0 : 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 4), force: true });
      else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    };
    const onTab = (e: MouseEvent) => {
      const t = (e.currentTarget as HTMLElement).dataset.hiwTab;
      if (t !== undefined) glideTo(target(Number(t)));
    };
    tabs.forEach((t) => t.addEventListener("click", onTab));

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      let current = -1;
      gsap.set(flows, { autoAlpha: 0 });

      const show = (f: number) => {
        if (f === current) return;
        const forward = f > current;
        const prev = flows[current];
        current = f;
        gsap.to(numbers, { yPercent: (-100 * f) / flowCount, duration: d(0.9), ease: "expo.out", overwrite: true });
        if (count) count.textContent = `${pad(f + 1)} / ${pad(flowCount)}`;
        if (prev) gsap.to(prev, { autoAlpha: 0, x: forward ? -56 : 56, duration: d(0.5), ease: "power2.inOut", overwrite: true });
        gsap.fromTo(flows[f], { autoAlpha: 0, x: forward ? 56 : -56 }, { autoAlpha: 1, x: 0, duration: d(0.8), delay: prev ? d(0.15) : 0, ease: "power3.out", overwrite: true });
        const steps = flows[f].querySelectorAll<HTMLElement>("[data-hiw-step]");
        gsap.fromTo(steps, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: d(0.6), stagger: d(0.06), delay: d(0.2), ease: "power2.out", overwrite: true });
        const bar = flows[f].querySelector<HTMLElement>("[data-hiw-bar]");
        if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: d(1.1), delay: d(0.3), ease: "expo.out", overwrite: true });
        mark(f);
        const tab = tabs[f];
        if (underline && tab) gsap.to(underline, { x: tab.offsetLeft, width: tab.offsetWidth, duration: d(0.8), ease: "expo.out", overwrite: true });
        if (glow) gsap.to(glow, { xPercent: f ? 18 : -18, yPercent: f ? 24 : 0, duration: d(1.6), ease: "sine.inOut", overwrite: true });
      };

      const st = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => show(Math.min(flowCount - 1, Math.floor(self.progress * flowCount))),
      });
      // The middle of each service's part of the scroll.
      target = (f) => st.start + ((f + 0.5) / flowCount) * (st.end - st.start);
      show(Math.min(flowCount - 1, Math.floor(st.progress * flowCount)));
      return () => {
        st.kill();
        gsap.set([...flows, ...flows.flatMap((fl) => [...fl.querySelectorAll("[data-hiw-step]")])], { clearProps: "all" });
        target = () => window.scrollY;
      };
    });

    mm.add("(max-width: 767px)", () => {
      // Phones: both services are stacked; a tab jumps to its panel, and the tab of the panel in view is lit.
      const header = 96;
      target = (f) => flows[f].getBoundingClientRect().top + window.scrollY - header;
      mark(0);
      const st = flows[1]
        ? ScrollTrigger.create({ trigger: flows[1], start: "top 55%", onToggle: (self) => mark(self.isActive ? 1 : 0), end: "max" })
        : null;
      if (!reduced) {
        root.querySelectorAll<HTMLElement>("[data-hiw-step]").forEach((step) => {
          gsap.from(step, { x: -40, autoAlpha: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: step, start: "top 92%" } });
        });
      }
      return () => {
        st?.kill();
        target = () => window.scrollY;
      };
    });
    return () => {
      tabs.forEach((t) => t.removeEventListener("click", onTab));
      mm.revert();
    };
  }, [targetId, flowCount]);

  return null;
}
