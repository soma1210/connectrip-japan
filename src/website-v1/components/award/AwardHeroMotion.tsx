"use client";

import { useEffect } from "react";
import { OPENING_ATTR } from "../opening/openingBoot";
import { gsap, ScrollTrigger } from "../wd/gsap";
import { KATOMADO_FULL, katomadoPath } from "./katomado";

/**
 * Motion of AwardHero.
 *
 * First screen: the words rise out of their masks (after the loader); scenes
 * cross-fade inside the window every 3.4 s; the floating photos follow the
 * pointer at three depths.
 *
 * Scroll (one scrubbed timeline over the pinned section, 210svh):
 *   0.00–0.70 the words part to both sides, the floating photos fly out, the
 *             window opens to full bleed and settles on Osaka Castle; its
 *             camera eases back 1.18 → 1
 *   0.70–1.00 the photo darkens towards its foot, ready for the next scene
 */
export function AwardHeroMotion({ targetId, places }: { targetId: string; places: string[] }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const q = (sel: string) => root.querySelector<HTMLElement>(sel);
    const qa = (sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
    const stage = q("[data-hero-stage]");
    const windowPath = root.querySelector<SVGPathElement>("[data-hero-window]");
    if (!stage || !windowPath) return;
    const left = q("[data-hero-word='left']");
    const right = q("[data-hero-word='right']");
    const rest = q("[data-hero-word='rest']");
    const rises = qa("[data-hero-rise]");
    const floats = qa("[data-hero-float]");
    const slides = qa("[data-hero-slide]");
    const cam = q("[data-hero-cam]");
    const frame = q("[data-hero-frame]");
    const shade = q("[data-hero-shade]");
    const ctas = q("[data-hero-ctas]");
    const place = q("[data-hero-place]");
    const placeText = q("[data-hero-place-text]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- The window on the first screen, in the stage's own units ----
    let startPath = windowPath.getAttribute("d") ?? KATOMADO_FULL;
    const measure = () => {
      const vw = stage.clientWidth;
      const vh = stage.clientHeight;
      const phone = vw < 768;
      const winW = phone ? vw * 0.46 : Math.min(380, Math.max(200, vw * 0.19));
      const winH = phone ? vh * 0.44 : Math.min(vh * 0.62, winW * 1.6);
      const cy = vh * (phone ? 0.52 : 0.5);
      const top = cy - winH / 2;
      startPath = katomadoPath({ cx: 0.5, w: winW / vw, ys: (top + 0.3 * winH) / vh, y1: (top + winH) / vh });
      root.style.setProperty("--win-w", `${winW.toFixed(1)}px`);
      root.style.setProperty("--win-h", `${winH.toFixed(1)}px`);
    };
    measure();
    windowPath.setAttribute("d", startPath);

    // ---- First screen ----
    const openingOn = () => ["pending", "play", "reduced", "reduced-out"].includes(document.documentElement.getAttribute(OPENING_ATTR) ?? "");
    let introDone = false;
    const intro = () => {
      if (introDone) return;
      introDone = true;
      if (reduced) return;
      gsap.fromTo(rises, { yPercent: 110 }, { yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.12 });
      gsap.fromTo(floats, { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.5, ease: "expo.out", stagger: 0.1, delay: 0.25 });
      gsap.fromTo([ctas, place], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", delay: 0.6 });
    };
    if (!reduced) gsap.set(rises, { yPercent: 110 });
    if (!openingOn()) intro();
    const mo = new MutationObserver(() => !openingOn() && intro());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: [OPENING_ATTR] });

    // Scenes inside the window (only while the page is at the top).
    let slide = 0;
    let atTop = true;
    slides[0]?.setAttribute("data-on", "");
    const rotate = window.setInterval(() => {
      if (!atTop || reduced || slides.length < 2 || document.hidden) return;
      slides[slide]?.removeAttribute("data-on");
      slide = (slide + 1) % slides.length;
      slides[slide]?.setAttribute("data-on", "");
      if (placeText && places[slide] !== undefined) {
        gsap.fromTo(placeText, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out", onStart: () => void (placeText.textContent = places[slide]) });
      }
    }, 3400);

    // Pointer parallax of the floating photos (mouse devices).
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduced;
    const depth = [26, 46, 16];
    const movers = floats.map((el) => ({ x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }) }));
    // The window leans towards the pointer in 3D while the page is at the top.
    const tiltX = frame ? gsap.quickTo(frame, "rotationX", { duration: 1.4, ease: "power3.out" }) : null;
    const tiltY = frame ? gsap.quickTo(frame, "rotationY", { duration: 1.4, ease: "power3.out" }) : null;
    if (frame) gsap.set(frame, { transformPerspective: 1600, transformOrigin: "50% 50%" });
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tiltX?.(atTop ? ny * -7 : 0);
      tiltY?.(atTop ? nx * 9 : 0);
      if (!atTop) return;
      movers.forEach((m, i) => {
        m.x(-nx * depth[i % depth.length]);
        m.y(-ny * depth[i % depth.length]);
      });
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    // ---- Scroll ----
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
          onUpdate: (self) => {
            const top = self.progress < 0.01;
            if (top !== atTop) {
              atTop = top;
              // Leaving the top: the window settles on Osaka Castle.
              slides.forEach((s) => (top && s === slides[slide] ? s.setAttribute("data-on", "") : s.removeAttribute("data-on")));
            }
          },
        },
      });
      tl.fromTo(windowPath, { attr: { d: () => startPath } }, { attr: { d: KATOMADO_FULL }, ease: "power3.inOut", duration: 0.7 }, 0)
        .fromTo(cam, { scale: 1.18 }, { scale: 1, duration: 1 }, 0)
        .to(left, { xPercent: -140, autoAlpha: 0, ease: "power2.in", duration: 0.5 }, 0)
        .to(right, { xPercent: 140, autoAlpha: 0, ease: "power2.in", duration: 0.5 }, 0)
        .to(rest, { yPercent: 120, autoAlpha: 0, ease: "power2.in", duration: 0.4 }, 0)
        .to([ctas, place], { autoAlpha: 0, y: 30, duration: 0.2 }, 0)
        .to(floats, { autoAlpha: 0, scale: 1.4, y: (i) => [-260, -320, 280][i % 3], x: (i) => [-200, 260, -120][i % 3], ease: "power2.in", duration: 0.45 }, 0)
        .fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.7);
    });

    const onOrient = () => ScrollTrigger.refresh();
    window.addEventListener("orientationchange", onOrient);
    return () => {
      mm.revert();
      mo.disconnect();
      window.clearInterval(rotate);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("orientationchange", onOrient);
    };
  }, [targetId, places]);

  return null;
}
