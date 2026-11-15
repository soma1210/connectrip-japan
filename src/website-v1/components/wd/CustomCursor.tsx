"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor follower (white-desert.com: a small dot that trails the pointer and
 * opens up over things you can act on). A gold dot follows with a soft lag; over
 * links and buttons it grows into a thin ring, over photos into a larger
 * hollow ring. Mouse devices only; the system cursor stays visible.
 */
export function CustomCursor() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ok = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!ok.matches) return;
    el.dataset.on = "";
    let x = -100;
    let y = -100;
    let cx = -100;
    let cy = -100;
    let raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target as HTMLElement | null;
      const action = t?.closest("a, button, [role='button'], summary, label, select, input[type='checkbox'], input[type='radio']");
      const photo = !action && t?.closest("img, picture, [data-cursor='photo']");
      el.dataset.state = action ? "action" : photo ? "photo" : "";
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(loop) : 0;
    };
    const leave = () => (el.dataset.hidden = "");
    const enter = () => delete el.dataset.hidden;
    const down = () => (el.dataset.press = "");
    const up = () => delete el.dataset.press;
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    document.documentElement.addEventListener("pointerenter", enter);
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.removeEventListener("pointerenter", enter);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      cancelAnimationFrame(raf);
      delete el.dataset.on;
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="wd-cursor">
      <span className="wd-cursor__dot" />
      <span className="wd-cursor__ring" />
    </div>
  );
}
