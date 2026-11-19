"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { getLenis } from "./SmoothScroll";

/**
 * Motion of PrefectureScene (after therealhotels.com). The scroll position
 * inside the section is the single source of the current prefecture:
 *   - it becomes a continuous position along the list, followed with a short
 *     smoothing (no holds, no steps: the column always moves with the scroll,
 *     with a light pull towards each name);
 *   - the column glides so that position sits on the centre line; every
 *     name's brightness and size follow its distance from the centre; the
 *     Japanese name shows beside the one at the centre;
 *   - when the centre changes to another prefecture, its three photos rise in
 *     over the previous ones (clip-path curtain from below, each slot a beat
 *     after the other) while their cameras settle from a closer framing.
 * Choosing a name (click, tap, Enter) glides the page to that prefecture's
 * scroll position; its photos come in at once and stay while the page glides
 * past the names in between. With a mouse, hovering a name lifts it.
 * Reduced motion: the names step without gliding and photos simply swap.
 */
export function PrefectureMotion({ targetId, count }: { targetId: string; count: number }) {
  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const list = root.querySelector<HTMLElement>("[data-pf-list]");
    const names = [...root.querySelectorAll<HTMLElement>("[data-pf-name]")];
    const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-pf-pick]")];
    const counter = root.querySelector<HTMLElement>("[data-pf-count]");
    const slots = [...root.querySelectorAll<HTMLElement>("[data-pf-slot]")];
    if (!list || !names.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- Photos: one prefecture at a time, the newest curtain on top. ----
    let active = -1;
    let z = 1;
    const showPhotos = (i: number) => {
      if (i === active) return;
      const first = active === -1;
      active = i;
      if (counter) counter.textContent = String(i + 1).padStart(2, "0");
      buttons.forEach((b, k) => (k === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
      slots.forEach((slot, s) => {
        const photos = [...slot.querySelectorAll<HTMLElement>("[data-pf-photo]")];
        const next = photos[i];
        if (!next) return;
        const prev = photos.filter((p) => p !== next && p.hasAttribute("data-on"));
        // Hide the old photos once the new one covers them, unless one became current again meanwhile.
        const clear = () => prev.forEach((p) => p !== photos[active] && p.removeAttribute("data-on"));
        next.setAttribute("data-on", "");
        next.style.zIndex = String(++z);
        if (first || reduced) {
          gsap.set(next, { clipPath: "none" });
          clear();
          return;
        }
        gsap.killTweensOf(next);
        gsap.fromTo(
          next,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, delay: s * 0.09, ease: "expo.inOut", onComplete: clear },
        );
        const cam = next.querySelector("[data-pf-cam]");
        if (cam) gsap.fromTo(cam, { scale: 1.3, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 1.6, delay: s * 0.09, ease: "expo.out", overwrite: true });
      });
    };

    // ---- Names: position along the list (pos.c), hover lift per name. ----
    const pos = { c: 0 };
    const lift = names.map(() => ({ v: 0 }));
    let lock = -1; // a chosen prefecture, held while the page glides to it
    let itemH = 0;
    const measure = () => {
      itemH = names[0].offsetHeight;
    };
    const place = () => {
      const c = pos.c;
      gsap.set(list, { y: -c * itemH - itemH / 2 });
      names.forEach((name, i) => {
        const d = Math.abs(c - i);
        const h = lift[i].v;
        const o = Math.max(0.14, 1 - d * 0.72);
        const sc = 1 - Math.min(d, 2.5) * 0.07;
        name.style.opacity = (o + (1 - o) * h * 0.7).toFixed(3);
        name.style.transform = `scale(${(sc + (1 - sc) * h * 0.5).toFixed(3)})`;
        const kanji = name.querySelector<HTMLElement>("[data-pf-kanji]");
        if (kanji) kanji.style.opacity = Math.max(0, 1 - d * 2.5, h * 0.55).toFixed(3);
      });
      if (lock < 0) showPhotos(Math.min(count - 1, Math.max(0, Math.round(c))));
    };
    const glide = gsap.quickTo(pos, "c", { duration: 0.75, ease: "power3.out", onUpdate: place });
    const moveTo = (c: number) => {
      if (reduced) {
        pos.c = Math.round(c);
        place();
      } else glide(c);
    };

    measure();
    place();
    const magnet = gsap.parseEase("sine.inOut");
    const st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onRefresh: measure,
      onUpdate: (self) => {
        const raw = self.progress * (count - 1);
        const i = Math.min(count - 1, Math.floor(raw));
        const f = raw - i;
        // Always moving with the scroll, with a light pull towards each name.
        moveTo(i + f + (magnet(f) - f) * 0.55);
      },
    });

    // ---- Choosing a name: glide the page to it. ----
    let unlockTimer = 0;
    const unlock = () => {
      window.clearTimeout(unlockTimer);
      if (lock < 0) return;
      lock = -1;
      place();
    };
    const choose = (i: number) => {
      const y = st.start + (i / Math.max(1, count - 1)) * (st.end - st.start);
      lock = i;
      showPhotos(i);
      const distance = Math.abs(i - pos.c);
      const lenis = getLenis();
      window.clearTimeout(unlockTimer);
      if (lenis) {
        const duration = reduced ? 0 : Math.min(1.8, 0.9 + distance * 0.18);
        lenis.scrollTo(y, { duration, easing: (t: number) => 1 - Math.pow(1 - t, 4), force: true, onComplete: unlock });
        unlockTimer = window.setTimeout(unlock, duration * 1000 + 600);
      } else {
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
        unlockTimer = window.setTimeout(unlock, reduced ? 50 : 1400);
      }
    };
    // The reader takes over the scroll: follow it again.
    const takeOver = () => unlock();
    const onClick = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-pf-pick]");
      if (b) choose(Number(b.dataset.pfPick));
    };
    const setLift = (i: number, v: number) => gsap.to(lift[i], { v, duration: v ? 0.45 : 0.6, ease: "power2.out", overwrite: true, onUpdate: place });
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-pf-pick]");
      if (b) setLift(Number(b.dataset.pfPick), 1);
    };
    const onOut = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-pf-pick]");
      if (b && !b.contains(e.relatedTarget as Node)) setLift(Number(b.dataset.pfPick), 0);
    };
    list.addEventListener("click", onClick);
    list.addEventListener("pointerover", onOver);
    list.addEventListener("pointerout", onOut);
    window.addEventListener("wheel", takeOver, { passive: true });
    window.addEventListener("touchstart", takeOver, { passive: true });

    return () => {
      st.kill();
      window.clearTimeout(unlockTimer);
      list.removeEventListener("click", onClick);
      list.removeEventListener("pointerover", onOver);
      list.removeEventListener("pointerout", onOut);
      window.removeEventListener("wheel", takeOver);
      window.removeEventListener("touchstart", takeOver);
      gsap.killTweensOf([pos, ...lift]);
      gsap.set(list, { clearProps: "transform" });
    };
  }, [targetId, count]);

  return null;
}
