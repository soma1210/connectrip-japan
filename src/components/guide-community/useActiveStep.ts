"use client";

import { useEffect, useState } from "react";

/**
 * Index of the form section currently at the top of the screen, for the
 * sticky progress bar label. UI-only; reads `#step-<id>` elements.
 */
export function useActiveStep(sectionIds: string[], offset = 140) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = 0;
      sectionIds.forEach((id, index) => {
        const element = document.getElementById(`step-${id}`);
        if (element && element.getBoundingClientRect().top <= offset) current = index;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sectionIds, offset]);

  return active;
}
