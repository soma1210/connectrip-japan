"use client";

import { useEffect, useRef, useState } from "react";

/** True until the first page of the visit has mounted (no curtain on a fresh load). */
let firstPage = true;

/**
 * Page transition (white-desert.com keeps a navy panel between pages): after a
 * client-side navigation the new page starts under a navy curtain with a thin
 * gold line, and the curtain lifts away upward. Not on the first load (the
 * Opening overlay and the Hero handle that) and not with reduced motion.
 * Mounted by src/app/v1/template.tsx, which remounts on every navigation.
 */
export function PageCurtain() {
  const [active] = useState(() => !firstPage);
  const el = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    firstPage = false;
    // Reduced motion: wd.css hides the curtain; the safety timer below removes it.
    if (!active) return;
    const node = el.current;
    const done = (e?: AnimationEvent) => {
      if (!e || e.target === node) setGone(true);
    };
    node?.addEventListener("animationend", done);
    const safety = window.setTimeout(() => done(), 2200);
    return () => {
      node?.removeEventListener("animationend", done);
      window.clearTimeout(safety);
    };
  }, [active]);

  if (!active || gone) return null;
  return (
    <div ref={el} aria-hidden className="wd-curtain">
      <span className="wd-curtain__line" />
    </div>
  );
}
