"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "./gsap";

/** Hold only the last viewport of each scene, after its own scroll sequence. */
export function HomeSceneStack() {
  useEffect(() => {
    const query = matchMedia("(max-width: 767px) and (prefers-reduced-motion: no-preference)");
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-home-stack-layer]"));
    const measure = (scene: HTMLElement) => {
      scene.style.setProperty("--scene-height", scene.offsetHeight + "px");
    };
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) measure(entry.target as HTMLElement);
    });
    // ScrollTrigger needs the normal-flow positions when it measures inner scenes.
    const release = () => scenes.forEach(scene => scene.removeAttribute("data-stack-ready"));
    const enable = () => {
      if (!query.matches) return;
      for (const scene of scenes) {
        measure(scene);
        scene.setAttribute("data-stack-ready", "");
      }
    };
    const sync = () => {
      observer.disconnect();
      release();
      if (!query.matches) return;
      scenes.forEach(scene => observer.observe(scene));
      enable();
    };
    sync();
    query.addEventListener("change", sync);
    ScrollTrigger.addEventListener("refreshInit", release);
    ScrollTrigger.addEventListener("refresh", enable);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", sync);
      ScrollTrigger.removeEventListener("refreshInit", release);
      ScrollTrigger.removeEventListener("refresh", enable);
      release();
    };
  }, []);
  return null;
}
