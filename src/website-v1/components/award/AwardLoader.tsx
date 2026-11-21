"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { OPENING_ATTR } from "../opening/openingBoot";
import { gsap } from "../wd/gsap";
import { KATOMADO_FRAME } from "./katomado";
import s from "./AwardLoader.module.css";

const active = () => ["pending", "play", "reduced", "reduced-out"].includes(document.documentElement.getAttribute(OPENING_ATTR) ?? "");

/**
 * Award Home loader (2026-11-22). First load of Home in a session only (the
 * layout's opening boot script decides, as before). White paper; Kansai
 * scenes flick through a katomado window like a flip book while a large
 * counter runs 000 → 100; the book stops on Osaka Castle, the counter and the
 * name slide away and the paper lifts off — the window is now the Hero's
 * window, in the same place, showing the same castle.
 */
export function AwardLoader({ photos }: { photos: { src: string }[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    const doc = document.documentElement;
    if (!el) return;
    if (!active()) {
      el.style.display = "none";
      return;
    }
    doc.setAttribute(OPENING_ATTR, "play");
    const finish = () => {
      doc.setAttribute(OPENING_ATTR, "done");
      doc.style.overflow = "";
      setGone(true);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.to(el, { autoAlpha: 0, duration: 0.5, delay: 0.3, onComplete: finish });
      return;
    }
    const frames = [...el.querySelectorAll<HTMLElement>("[data-frame]")];
    const counter = el.querySelector<HTMLElement>("[data-count]");
    const n = { v: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(n, {
      v: 100,
      duration: 2.4,
      ease: "power2.inOut",
      onUpdate: () => {
        if (counter) counter.textContent = String(Math.round(n.v)).padStart(3, "0");
        // Flip book: one scene per few percent; ends on the last frame (Osaka Castle).
        const i = Math.min(frames.length - 1, Math.floor((n.v / 100) * frames.length * 1.999) % frames.length);
        const at = n.v >= 99.5 ? frames.length - 1 : i;
        frames.forEach((f, j) => (f.style.visibility = j === at ? "visible" : "hidden"));
      },
    })
      .fromTo(el.querySelectorAll("[data-rise]"), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 }, 0)
      .to(el.querySelectorAll("[data-rise]"), { yPercent: -110, duration: 0.6, ease: "expo.in", stagger: 0.05 }, 2.45)
      .to(el.querySelector("[data-paper]"), { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, 2.85)
      .to(el.querySelector("[data-window]"), { autoAlpha: 0, duration: 0.4 }, 3.35);
    // Safety: never keep the page locked.
    const id = window.setTimeout(finish, 7000);
    return () => {
      tl.kill();
      window.clearTimeout(id);
    };
  }, []);

  if (gone) return null;
  // Scenes in order, Osaka Castle (the first Hero photo) last.
  const order = [...photos.slice(1), photos[0]].filter(Boolean);
  return (
    <div ref={root} aria-hidden className={s.root}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="aw-loader-window" clipPathUnits="objectBoundingBox">
            <path d={KATOMADO_FRAME} />
          </clipPath>
        </defs>
      </svg>
      <div data-paper className={s.paper} />
      <div data-window className={s.window}>
        {order.map((p, i) => (
          <div key={p.src} data-frame className={s.frame} style={{ visibility: i === 0 ? "visible" : "hidden" }}>
            <Image src={p.src} alt="" fill sizes="22vw" priority={i === order.length - 1} className="object-cover" />
          </div>
        ))}
      </div>
      <p className={s.brand}>
        <span className={s.mask}>
          <span data-rise>Connectrip Japan</span>
        </span>
      </p>
      <p className={s.count}>
        <span className={s.mask}>
          <span data-rise data-count>
            000
          </span>
        </span>
      </p>
    </div>
  );
}
