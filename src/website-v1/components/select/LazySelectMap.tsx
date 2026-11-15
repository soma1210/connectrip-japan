"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import type { SelectMapContent } from "@/contracts";

/**
 * The Connectrip Japan Select map, loaded late (Explore Kansai map page).
 * - The map code is fetched only when the map area comes within 400 px of the
 *   screen; until then a same-sized placeholder keeps the layout still.
 * - If the code fails to load or the map throws, a short message points to
 *   the list of places under the map, which is plain server HTML.
 */
const SelectMap = dynamic(() => import("./SelectMap").then((m) => m.SelectMap), {
  ssr: false,
  // Page variant sizes the frame itself; the embed frame has the same aspect ratio as this one.
  loading: () => <MapFrame>Loading map…</MapFrame>,
});

function MapFrame({ children, fill }: { children: ReactNode; fill?: boolean }) {
  const box = fill ? "absolute inset-0" : "aspect-[4/5] w-full border border-gold/30 sm:aspect-[16/10]";
  return (
    <div className={`flex items-center justify-center bg-navy px-6 text-center text-sm text-cream/60 ${box}`} aria-live="polite">
      {children}
    </div>
  );
}

class MapErrorBoundary extends Component<{ children: ReactNode; fill?: boolean }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <MapFrame fill={this.props.fill}>The map could not be loaded. All the places are listed on this page.</MapFrame> : this.props.children;
  }
}

/** `variant="embed"`: the in-article map (only the article's places; no area buttons). */
export function LazySelectMap({ content, variant = "page" }: { content: SelectMapContent; variant?: "page" | "embed" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // IntersectionObserver is in every browser v1 supports; without it the placeholder and the place list remain.
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const embed = variant === "embed";
  const label = `Map of ${content.areaName.status === "TBD" ? "Osaka" : content.areaName.value}`;
  return (
    // Embed: SelectMap fills its parent, so the frame sets the size. Page: SelectMap sizes itself.
    <div ref={ref} className={embed ? "relative aspect-[4/5] w-full overflow-hidden border border-gold/40 sm:aspect-[16/10]" : "relative"}>
      <MapErrorBoundary fill={embed}>{near ? <SelectMap content={content} variant={variant} /> : <MapFrame fill={embed}>{label}</MapFrame>}</MapErrorBoundary>
    </div>
  );
}
