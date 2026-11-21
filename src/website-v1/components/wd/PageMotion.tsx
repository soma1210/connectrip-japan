"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "./gsap";

/**
 * Site-wide scroll choreography in the spirit of white-desert.com, applied to
 * the markup that is already there (no content is added, removed or reworded):
 *
 * - Page titles (h1): letters drop in with a blur, from the centre out.
 * - Section headings (h2): words rise out of their own masks, staggered.
 * - Kinetic titles (`data-wd-letters`): letters flip up in 3D with the scroll.
 * - Figures (prices etc.) count up; key / value rows are drawn in from the left;
 *   rounded cards lean towards the pointer.
 * - Photos: a curtain opens upward over each one while its camera settles
 *   (clip-path + scale); large photos keep drifting slower than the page.
 * - Text blocks, lists and cards: rise and fade in small staggered batches.
 * - Footer: the CONNECTRIP JAPAN wordmark rises letter by letter.
 *
 * Home runs its own scene choreography (components/motion, Hero mosaic), so
 * there only the kinetic titles, figures and the footer are driven from here. Anything inside
 * `[data-wd-skip]`, the header, forms, maps and the Explore / Globe scenes is
 * left alone. Reduced motion: nothing moves.
 */
const SKIP = "[data-wd-skip], header, form, nav, [data-reveal-item], [data-reveal-group], #home-hero, #value, #explore-kansai, #sns, [data-globe], .leaflet-container, svg";
const BLOCKS = "p, li, blockquote, details, figure, aside, article, address, h3";

function isTextOnly(el: HTMLElement) {
  return [...el.childNodes].every((n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && (n as HTMLElement).tagName === "BR"));
}

/** Wrap each word in a mask (same text). Returns an undo function. */
function splitWords(el: HTMLElement, chars = false): () => void {
  const original = [...el.childNodes].map((n) => n.cloneNode(true));
  const frag = document.createDocumentFragment();
  let i = 0;
  for (const node of [...el.childNodes]) {
    if (node.nodeType !== Node.TEXT_NODE) {
      frag.append(node.cloneNode(true));
      continue;
    }
    const parts = (node.textContent ?? "").split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(document.createTextNode(" "));
        continue;
      }
      const mask = document.createElement("span");
      if (chars) {
        // Letters stay together per word (no break inside a word).
        mask.className = "wd-chars";
        for (const ch of part) {
          const c = document.createElement("span");
          c.className = "wd-char";
          c.textContent = ch;
          mask.append(c);
        }
        frag.append(mask);
        continue;
      }
      mask.className = "wd-word";
      const inner = document.createElement("span");
      inner.textContent = part;
      inner.style.setProperty("--w", String(i++));
      mask.append(inner);
      frag.append(mask);
    }
  }
  el.setAttribute("aria-label", el.textContent?.replace(/\s+/g, " ").trim() ?? "");
  el.replaceChildren(frag);
  return () => {
    el.replaceChildren(...original);
    el.removeAttribute("aria-label");
  };
}

export function PageMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isHome = !!document.getElementById("home-hero");
    const undo: (() => void)[] = [];
    const io: IntersectionObserver[] = [];
    const frames: number[] = [];

    const ctx = gsap.context(() => {
      if (reduced) return;

      // ---- Footer wordmark: letters rise as the footer arrives. ----
      const wordmark = document.querySelector<HTMLElement>("[data-wd-wordmark]");
      const letters = wordmark?.querySelectorAll<HTMLElement>("[data-l]") ?? [];
      if (wordmark && letters.length) {
        gsap.fromTo(
          letters,
          { yPercent: 115, rotate: 6 },
          {
            yPercent: 0,
            rotate: 0,
            ease: "expo.out",
            duration: 1.4,
            stagger: { each: 0.045, from: "start" },
            scrollTrigger: { trigger: wordmark, start: "top 98%", toggleActions: "play none none reverse" },
          },
        );
      }

      // ---- Kinetic titles: letters flip up in 3D, one after another, with the scroll (Home scenes, SNS). ----
      for (const title of main.querySelectorAll<HTMLElement>("[data-wd-letters]")) {
        gsap.fromTo(
          title.querySelectorAll("[data-wd-l]"),
          { rotateX: -100, yPercent: 70, autoAlpha: 0, transformOrigin: "50% 100%" },
          {
            rotateX: 0,
            yPercent: 0,
            autoAlpha: 1,
            ease: "power3.out",
            stagger: 0.035,
            scrollTrigger: { trigger: title, start: "top 92%", end: "top 55%", scrub: 0.6 },
          },
        );
      }

      // ---- Hairline rules draw in from the left (data-wd-rule). ----
      for (const rule of main.querySelectorAll<HTMLElement>("[data-wd-rule]")) {
        gsap.fromTo(rule, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 1.2, ease: "power4.inOut", scrollTrigger: { trigger: rule, start: "top 92%", once: true } });
      }

      // ---- Manifesto line (data-wd-highlight): its letters light up one after another with the scroll. ----
      for (const p of main.querySelectorAll<HTMLElement>("[data-wd-highlight]")) {
        if (!isTextOnly(p)) continue;
        const text = p.textContent ?? "";
        const original = [...p.childNodes].map((n) => n.cloneNode(true));
        p.setAttribute("aria-label", text);
        p.replaceChildren(
          ...text.split(/(\s+)/).map((part) => {
            if (/^\s+$/.test(part)) return document.createTextNode(" ");
            const word = document.createElement("span");
            word.style.whiteSpace = "nowrap";
            word.setAttribute("aria-hidden", "true");
            for (const ch of part) {
              const c = document.createElement("span");
              c.className = "wd-hl";
              c.textContent = ch;
              word.append(c);
            }
            return word;
          }),
        );
        undo.push(() => {
          p.replaceChildren(...original);
          p.removeAttribute("aria-label");
        });
        gsap.fromTo(p.querySelectorAll(".wd-hl"), { opacity: 0.12 }, { opacity: 1, ease: "none", stagger: 0.02, scrollTrigger: { trigger: p, start: "top 80%", end: "bottom 50%", scrub: 0.4 } });
      }

      // ---- Numbers (prices, figures of 100 and more) count up when they come into view. ----
      for (const el of main.querySelectorAll<HTMLElement>("dd, p, span, strong, td")) {
        if (el.closest(SKIP) || el.children.length) continue;
        const text = el.textContent ?? "";
        const m = text.match(/^(\D{0,3}?)(\d{1,3}(?:,\d{3})+|\d{3,})(\D{0,12})$/);
        if (!m) continue;
        const target = Number(m[2].replace(/,/g, ""));
        const comma = m[2].includes(",");
        const node = el.firstChild;
        if (!node || node.nodeType !== Node.TEXT_NODE || target > 10_000_000) continue;
        el.style.setProperty("font-variant-numeric", "tabular-nums");
        // Counted with its own rAF once on screen; the original text is always restored at the end.
        const count = new IntersectionObserver(
          ([entry]) => {
            if (!entry.isIntersecting) return;
            count.disconnect();
            const t0 = performance.now();
            const step = (now: number) => {
              const k = Math.min(1, (now - t0) / 1600);
              const n = Math.round(target * (1 - Math.pow(1 - k, 3)));
              node.textContent = k < 1 ? `${m[1]}${comma ? n.toLocaleString("en-US") : n}${m[3]}` : text;
              if (k < 1) frames.push(requestAnimationFrame(step));
            };
            frames.push(requestAnimationFrame(step));
          },
          { rootMargin: "0px 0px -8% 0px" },
        );
        count.observe(el);
        io.push(count);
        undo.push(() => (node.textContent = text));
      }

      if (isHome) return;

      // ---- Cards (rounded, bordered boxes) lean towards the pointer (components/wd/Interactions). ----
      for (const card of main.querySelectorAll<HTMLElement>("li[class*='rounded-xl'], article[class*='border'], div[class*='rounded-xl'][class*='border']")) {
        if (card.closest(SKIP) || card.hasAttribute("data-wd-tilt")) continue;
        card.setAttribute("data-wd-tilt", "auto");
        undo.push(() => card.removeAttribute("data-wd-tilt"));
      }

      // ---- Table-like rows (key / value lists, table rows): drawn in from the left, one after another. ----
      const rows = [...main.querySelectorAll<HTMLElement>("dl > div, tr")].filter((r) => !r.closest(SKIP));
      gsap.set(rows, { clipPath: "inset(0% 100% 0% 0%)" });
      ScrollTrigger.batch(rows, {
        start: "top 94%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.1,
            ease: "expo.inOut",
            stagger: 0.07,
            onComplete: () => gsap.set(batch, { clearProps: "clipPath" }),
          }),
      });

      // ---- Page title (h1): letters drop in with a blur, staggered from the centre. ----
      for (const h of main.querySelectorAll<HTMLElement>("h1")) {
        if (h.closest(SKIP) || !isTextOnly(h) || !h.textContent?.trim()) continue;
        undo.push(splitWords(h, true));
        // Page title: letters rise out of their masks, one after another (after the curtain lifts).
        h.querySelectorAll<HTMLElement>(".wd-chars").forEach((w) => {
          w.style.overflow = "clip";
          w.style.setProperty("overflow-clip-margin", "0.12em");
          w.style.paddingBottom = "0.06em";
        });
        gsap.fromTo(
          h.querySelectorAll(".wd-char"),
          { yPercent: 115 },
          { yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.03, delay: 0.55 },
        );
      }

      // ---- Section headings (h2): words rise out of masks. ----
      for (const h of main.querySelectorAll<HTMLElement>("h2")) {
        if (h.closest(SKIP) || !isTextOnly(h) || !h.textContent?.trim()) continue;
        undo.push(splitWords(h));
        gsap.fromTo(
          h.querySelectorAll(".wd-word > span"),
          { yPercent: 110, rotate: 3 },
          { yPercent: 0, rotate: 0, duration: 1.25, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: h, start: "top 92%", once: true } },
        );
      }

      // ---- Photos: the curtain opens upward while the camera settles; large ones keep drifting. ----
      for (const img of main.querySelectorAll<HTMLImageElement>("img")) {
        if (img.closest(SKIP)) continue;
        const box = img.getBoundingClientRect();
        if (box.width < 160 || box.height < 120) continue;
        const parent = img.parentElement;
        const clipped = !!parent && ["hidden", "clip"].includes(getComputedStyle(parent).overflow);
        const drift = clipped && box.height > 280;
        const rest = drift ? 1.16 : 1;
        gsap.fromTo(
          img,
          { clipPath: "inset(100% 0% 0% 0%)", scale: clipped ? rest + 0.22 : 1 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: rest,
            duration: 1.6,
            ease: "expo.inOut",
            scrollTrigger: { trigger: parent ?? img, start: "top 90%", once: true },
            onComplete: () => gsap.set(img, { clearProps: "clipPath" }),
          },
        );
        if (drift) {
          gsap.fromTo(
            img,
            { yPercent: -7 },
            { yPercent: 7, ease: "none", scrollTrigger: { trigger: parent, start: "top bottom", end: "bottom top", scrub: true } },
          );
        }
      }

      // ---- Text blocks, lists, cards: staggered rise. ----
      const all = [...main.querySelectorAll<HTMLElement>(BLOCKS)].filter((el) => !el.closest(SKIP) && el.offsetHeight > 0);
      const blocks = all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
      // Text blocks come into focus: a short rise out of a soft blur (no plain fade-up).
      gsap.set(blocks, { autoAlpha: 0, y: 22, filter: "blur(8px)" });
      ScrollTrigger.batch(blocks, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.5,
            ease: "power3.out",
            stagger: 0.07,
            overwrite: true,
            // Nothing left behind: sticky / fixed children keep working.
            onComplete: () => gsap.set(batch, { clearProps: "transform,opacity,visibility,filter" }),
          }),
      });
      // Anything already passed (anchor jump, restored scroll) is shown at once.
      const showPassed = () => {
        for (const el of blocks) if (el.getBoundingClientRect().bottom < 0) gsap.set(el, { clearProps: "transform,opacity,visibility" });
      };
      ScrollTrigger.addEventListener("refresh", showPassed);
      undo.push(() => ScrollTrigger.removeEventListener("refresh", showPassed));
    }, main);

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      window.clearTimeout(refresh);
      io.forEach((o) => o.disconnect());
      frames.forEach((f) => cancelAnimationFrame(f));
      ctx.revert();
      undo.reverse().forEach((fn) => fn());
    };
  }, [pathname]);

  return null;
}
