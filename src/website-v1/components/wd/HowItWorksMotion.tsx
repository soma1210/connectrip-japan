"use client";

import { useEffect } from "react";
import { gsap, MQ_DESKTOP_MOTION, MQ_MOTION, ScrollTrigger } from "./gsap";

/**
 * Motion of HowItWorksScene. Wide screens: one ScrollTrigger over the pinned
 * section turns the scroll position into the active step (0 … total-1, flows
 * one after another). Each change of step is played as a short, timed
 * transition (not scrubbed), so steps switch crisply:
 *   number stack rolls, active / done flags on the steps, progress bar of the
 *   flow, flow panels wipe across when the flow changes, tab underline and
 *   the background light move.
 * Phones: steps and CTAs rise one after another as they scroll in.
 */
export function HowItWorksMotion({ targetId, total, perFlow }: { targetId: string; total: number; perFlow: number[] }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const flows = [...root.querySelectorAll<HTMLElement>("[data-hiw-flow]")];
    const numbers = root.querySelector<HTMLElement>("[data-hiw-numbers]");
    const count = root.querySelector<HTMLElement>("[data-hiw-count]");
    const tabs = [...root.querySelectorAll<HTMLElement>("[data-hiw-tab]")];
    const underline = root.querySelector<HTMLElement>("[data-hiw-underline]");
    const glow = root.querySelector<HTMLElement>("[data-hiw-glow]");
    const mm = gsap.matchMedia();

    mm.add(MQ_DESKTOP_MOTION, () => {
      let current = -1;
      let currentFlow = -1;
      const locate = (k: number) => {
        let f = 0;
        let i = k;
        while (f < perFlow.length - 1 && i >= perFlow[f]) i -= perFlow[f++];
        return { f, i };
      };
      gsap.set(flows, { autoAlpha: 0 });

      const show = (k: number) => {
        if (k === current) return;
        const { f, i } = locate(k);
        const forward = k > current;
        current = k;
        gsap.to(numbers, { yPercent: (-100 * k) / total, duration: 0.9, ease: "expo.out", overwrite: true });
        if (count) count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(perFlow[f]).padStart(2, "0")}`;

        if (f !== currentFlow) {
          const prev = flows[currentFlow];
          if (prev) gsap.to(prev, { autoAlpha: 0, x: forward ? -80 : 80, clipPath: forward ? "inset(-30% 100% -30% 0%)" : "inset(-30% 0% -30% 100%)", duration: 0.7, ease: "power3.inOut", overwrite: true });
          gsap.fromTo(
            flows[f],
            { autoAlpha: 0, x: forward ? 80 : -80, clipPath: forward ? "inset(-30% 0% -30% 100%)" : "inset(-30% 100% -30% 0%)" },
            { autoAlpha: 1, x: 0, clipPath: "inset(-30% -5% -30% -5%)", duration: 0.9, ease: "power3.inOut", delay: prev ? 0.2 : 0, overwrite: true },
          );
          tabs.forEach((t, j) => t.toggleAttribute("data-on", j === f));
          const tab = tabs[f];
          if (underline && tab) gsap.to(underline, { x: tab.offsetLeft, width: tab.offsetWidth, duration: 0.8, ease: "expo.out" });
          currentFlow = f;
        }
        flows.forEach((flow, fi) => {
          flow.querySelectorAll<HTMLElement>("[data-hiw-step]").forEach((step, si) => {
            step.toggleAttribute("data-on", fi === f && si === i);
            step.toggleAttribute("data-done", fi === f && si < i);
          });
          const bar = flow.querySelector<HTMLElement>("[data-hiw-bar]");
          if (bar && fi === f) gsap.to(bar, { scaleX: (i + 1) / perFlow[f], duration: 0.8, ease: "expo.out" });
        });
        if (glow) gsap.to(glow, { xPercent: (i - 1.5) * 18, yPercent: (f ? 30 : 0) + i * 6, duration: 1.6, ease: "sine.inOut" });
      };

      const st = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => show(Math.min(total - 1, Math.floor(self.progress * total * 0.999))),
      });
      show(0);
      return () => {
        st.kill();
        flows.forEach((flow) => flow.querySelectorAll("[data-hiw-step]").forEach((s) => (s.removeAttribute("data-on"), s.removeAttribute("data-done"))));
        tabs.forEach((t) => t.removeAttribute("data-on"));
      };
    });

    mm.add(`(max-width: 767px) and ${MQ_MOTION}`, () => {
      root.querySelectorAll<HTMLElement>("[data-hiw-step]").forEach((step) => {
        gsap.from(step, { x: -40, autoAlpha: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: step, start: "top 92%" } });
      });
    });
    return () => mm.revert();
  }, [targetId, total, perFlow]);

  return null;
}
