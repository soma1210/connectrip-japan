"use client";

import { useId, useLayoutEffect, useRef, type CSSProperties } from "react";
import { OPENING_ATTR } from "./openingBoot";
import { PremiumOpeningCrane } from "./PremiumOpeningCrane";
import styles from "./HomeOpeningExperience.module.css";

/** Decorative overlay only. The actual, unchanged Hero is already underneath. */
export function HomeOpeningExperience({ image }: {
  // Keep the existing Home integration API; never duplicate its image here.
  image: { src: string; focus?: string };
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const doc = document.documentElement;
    const state = doc.getAttribute(OPENING_ATTR);
    if (!["pending", "play", "reduced", "reduced-out"].includes(state ?? "")) return;
    const reduced = state === "reduced" || state === "reduced-out";
    const finish = () => {
      doc.setAttribute(OPENING_ATTR, "done");
      doc.style.overflow = "";
    };
    if (window.scrollY > 0) {
      finish();
      return;
    }
    const root = rootRef.current;
    doc.setAttribute(OPENING_ATTR, reduced ? "reduced-out" : "play");
    let disposed = false;
    let watchdog: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      if (!root || disposed) return;
      const animations = root.getAnimations({ subtree: true });
      // CSS owns pacing. Finish as soon as the actual animations complete,
      // including reduced motion; there is no minimum presentation time.
      void Promise.all(animations.map((animation) => animation.finished))
        .then(() => { if (!disposed) { window.clearInterval(watchdog); finish(); } })
        .catch(() => { if (!disposed) { window.clearInterval(watchdog); finish(); } });
      let previous = animations.map((animation) => animation.currentTime).join(",");
      let lastProgress = performance.now();
      watchdog = window.setInterval(() => {
        const current = animations.map((animation) => animation.currentTime).join(",");
        if (current !== previous) {
          previous = current;
          lastProgress = performance.now();
        } else if (performance.now() - lastProgress >= 5000) {
          // Only stalled motion triggers the fallback, never healthy playback.
          finish();
          window.clearInterval(watchdog);
        }
      }, 1000);
    });
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPreference = () => { if (preference.matches) finish(); };
    preference.addEventListener("change", onPreference);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.clearInterval(watchdog);
      preference.removeEventListener("change", onPreference);
      // StrictMode immediately reconnects this same node. A real unmount must
      // also release the scroll lock when navigating away during the opening.
      queueMicrotask(() => { if (!root?.isConnected) finish(); });
    };
  }, []);

  return (
    <div ref={rootRef} data-hero-source={image.src} className={styles.root} aria-hidden="true">
      <SlitCurtain count={16} className={styles.desktopCurtain} />
      <SlitCurtain count={12} className={styles.mobileCurtain} />
      <div className={styles.stage}>
        <div className={styles.crane}>
          <PremiumOpeningCrane className={styles.craneSvg} />
        </div>
        <div className={styles.title}>
          <p className={styles.welcome}>WELCOME TO</p>
          <p className={styles.japan}>JAPAN</p>
          <div className={styles.rule} />
          <p className={styles.signature}>CONNECTRIP JAPAN</p>
        </div>
      </div>
    </div>
  );
}

/** Black apertures remove the navy itself; no Hero/image copy is rendered. */
function SlitCurtain({ count, className }: { count: number; className: string }) {
  const maskId = useId();
  const weights = Array.from({ length: count }, (_, i) => [1, .86, 1.12, .94][i % 4]);
  const total = weights.reduce((a, b) => a + b, 0);
  let left = 0;
  return (
    <svg className={`${styles.backdrop} ${className}`} viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1000" style={{ maskType: "luminance" }}>
          <rect width="1600" height="1000" fill="white" />
          {weights.map((weight, i) => {
            const width = weight / total * 1600;
            const x = left;
            left += width;
            return <rect key={i} x={x - .5} y="0" width={width + 1} height="1000" fill="black"
              className={styles.slit}
              style={{ "--slit-delay": `${1250 + (count - 1 - i) * 12 + (i % 3) * 14}ms`, "--slit-origin": i % 2 ? "50% 100%" : "50% 0%" } as CSSProperties} />;
          })}
        </mask>
      </defs>
      <rect width="1600" height="1000" fill="var(--color-navy-dark, #0d1f36)" mask={`url(#${maskId})`} />
    </svg>
  );
}
