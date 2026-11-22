"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "./gsap";

/**
 * Hold only the last viewport of each scene, after its own scroll sequence, so
 * the next scene slides up over it.
 * Phones: every Home scene. Wide screens: only from Connectrip Japan Select
 * to SNS (Human instruction 2026-11-22): the Explore Kansai section (Select /
 * Updates) and Our Value are held, so Our Value and SNS slide over them.
 */
const WIDE_STACK = new Set(["travelGuide", "whyConnectrip"]);

export function HomeSceneStack() {
  useEffect(() => {
    const phone = matchMedia("(max-width: 767px) and (prefers-reduced-motion: no-preference)");
    const wide = matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const all = Array.from(document.querySelectorAll<HTMLElement>("[data-home-stack-layer]"));
    let scenes: HTMLElement[] = [];
    const pick = () =>
      phone.matches
        ? all
        : wide.matches
          ? all.filter(scene => WIDE_STACK.has(scene.parentElement?.getAttribute("data-home-section") ?? ""))
          : [];
    const measure = (scene: HTMLElement) => {
      scene.style.setProperty("--scene-height", scene.offsetHeight + "px");
    };
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) measure(entry.target as HTMLElement);
    });
    // ScrollTrigger needs the normal-flow positions when it measures inner scenes.
    const release = () => all.forEach(scene => scene.removeAttribute("data-stack-ready"));
    const enable = () => {
      for (const scene of scenes) {
        measure(scene);
        scene.setAttribute("data-stack-ready", "");
      }
    };
    const sync = () => {
      observer.disconnect();
      release();
      scenes = pick();
      scenes.forEach(scene => observer.observe(scene));
      enable();
    };
    sync();
    phone.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    ScrollTrigger.addEventListener("refreshInit", release);
    ScrollTrigger.addEventListener("refresh", enable);
    return () => {
      observer.disconnect();
      phone.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
      ScrollTrigger.removeEventListener("refreshInit", release);
      ScrollTrigger.removeEventListener("refresh", enable);
      release();
    };
  }, []);
  return null;
}
