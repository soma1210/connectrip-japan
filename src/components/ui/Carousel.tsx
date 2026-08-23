"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { ReactNode } from "react";

export function Carousel({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByAmount(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * track.clientWidth * 0.9,
      behavior: "smooth",
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Previous"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/30 text-cream/70 transition-colors hover:border-gold hover:text-gold"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Next"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/30 text-cream/70 transition-colors hover:border-gold hover:text-gold"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
