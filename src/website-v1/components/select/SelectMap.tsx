"use client";

import { Hand, MapPin, Maximize2, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import type { SelectAreaKey, SelectMapContent, SelectSpot } from "@/contracts";
import { cn } from "@/lib/cn";
import { ILLUSTRATION } from "../../assets/osakaIllustratedMap";
import { TbdImage, textOr } from "../Tbd";
import { PIN_HEAD_OFFSET, layoutLabels } from "./labelLayout";
import { TILE, clampView, fitPoints, project, zoomedView, type Point, type View } from "./mapMath";

/**
 * Connectrip Select map (v0.2): an illustrated, geographically accurate map of
 * Osaka. The background is an original SVG illustration simplified from
 * OpenStreetMap data (sea, Osaka Prefecture, major rivers, parks) in the same
 * Web Mercator projection as the pins, so every pin stays on its real
 * latitude / longitude. No tiles, no external map service.
 *
 * Pins + names only (labels never hidden: offset with leader lines when
 * crowded). A compact popup after a click; one at a time.
 * Drag to pan, +/- / double-click / pinch / Ctrl⌘+wheel to zoom.
 * `?spot=<slug>` opens a spot (review links).
 *
 * Variants: `page` (standalone route: framed map + area links) and `embed`
 * (fills its parent: the Home Connectrip Select section). On touch screens
 * the map starts locked so swipes scroll the page; "Move map" unlocks
 * dragging.
 * Pins, labels and the zoom buttons work while locked.
 * Tourist spots only: no category filter (the dataset keeps its categories).
 */

const PIN_HIT = 44;
const I = ILLUSTRATION;

/** Room around the spots on fit (labels). */
function fitPaddingFor(variant: "page" | "embed", width: number) {
  if (width < 640) return { x: 70, y: 48 };
  return variant === "embed" ? { x: 130, y: 44 } : { x: 150, y: 56 };
}

/** Touch-first device (phones, tablets). */
const COARSE = "(pointer: coarse)";
function subscribeCoarse(onChange: () => void) {
  const mq = window.matchMedia(COARSE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const isCoarsePointer = () => window.matchMedia(COARSE).matches;

/** Approximate label width for the site serif at a given size. */
const labelWidth = (text: string, font: number) => Math.ceil(text.length * font * 0.56) + 18;

// Illustration palette: warm paper land, soft blue water, Connectrip gold border.
const C = {
  outside: "#e8e1d2",
  osaka: "#f7f2e7",
  park: "#dfe6cf",
  forest: "#d2ddc0",
  sea: "#c5dae1",
  coast: "#a9c6d0",
  river: "#b9d3dc",
  border: "#c9a45c",
};

export function SelectMap({ content, variant = "page" }: { content: SelectMapContent; variant?: "page" | "embed" }) {
  const { spots } = content;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<View | null>(null);
  const [openId, setOpenId] = useState<string>();
  // Touch screens: locked until "Move map", so the page can still scroll.
  const [touchLocked, setTouchLocked] = useState(true);
  const coarse = useSyncExternalStore(subscribeCoarse, isCoarsePointer, () => false);
  const locked = coarse && touchLocked;

  const projected = useMemo(() => spots.map((s) => ({ spot: s, p: project(s.latitude, s.longitude) })), [spots]);
  const visible = projected;
  const open = visible.find(({ spot }) => spot.id === openId)?.spot;
  const mobile = size.width > 0 && size.width < 640;

  const fitAll = useCallback(
    (width: number, height: number, points = projected.map((s) => s.p)) =>
      fitPoints(points, width, height, fitPaddingFor(variant, width)),
    [projected, variant],
  );

  // Measure. On first layout fit all spots, or open `?spot=<slug>`.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
      setView((v) => {
        if (v) return clampView(v, width, height);
        const slug = new URLSearchParams(window.location.search).get("spot");
        const target = slug ? projected.find(({ spot }) => spot.slug === slug) : undefined;
        if (target) {
          setOpenId(target.spot.id);
          return clampView({ zoom: 15, center: target.p }, width, height);
        }
        return fitAll(width, height);
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitAll, projected]);

  const zoomAt = useCallback(
    (zoom: number | ((current: number) => number), anchor?: Point) => {
      setView((v) => (v ? zoomedView(v, typeof zoom === "function" ? zoom(v.zoom) : zoom, size, anchor) : v));
    },
    [size],
  );

  // Ctrl/⌘ + wheel and trackpad pinch zoom; a plain wheel scrolls the page.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt((z) => z - e.deltaY * 0.01, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // Drag to pan, two fingers to pinch.
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ moved: boolean; pinchDist?: number; pinchZoom?: number }>({ moved: false });

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-map-control]")) return;
    if (locked && e.pointerType === "touch") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) gesture.current = { moved: false };
    if (pointers.current.size === 2 && view) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { moved: true, pinchDist: Math.hypot(a.x - b.x, a.y - b.y), pinchZoom: view.zoom };
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !view) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    if (pointers.current.size === 2 && gesture.current.pinchDist && gesture.current.pinchZoom !== undefined) {
      const [a, b] = [...pointers.current.values()];
      const rect = e.currentTarget.getBoundingClientRect();
      const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
      zoomAt(gesture.current.pinchZoom + Math.log2(Math.hypot(a.x - b.x, a.y - b.y) / gesture.current.pinchDist), mid);
      return;
    }
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    if (!gesture.current.moved && Math.hypot(dx, dy) < 3) return;
    gesture.current.moved = true;
    const scale = TILE * 2 ** view.zoom;
    setView(clampView({ zoom: view.zoom, center: { x: view.center.x - dx / scale, y: view.center.y - dy / scale } }, size.width, size.height));
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current.pinchDist = undefined;
  }

  function onMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (gesture.current.moved) return;
    if ((e.target as HTMLElement).closest("[data-map-control],[data-spot]")) return;
    setOpenId(undefined);
  }

  function onDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!view || (e.target as HTMLElement).closest("[data-map-control],[data-spot]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    zoomAt(view.zoom + 1, { x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function selectSpot(id: string) {
    if (gesture.current.moved) return;
    setOpenId((current) => (current === id ? undefined : id));
  }

  function jumpTo(area: SelectAreaKey | "all") {
    const points = area === "all" ? projected.map((s) => s.p) : projected.filter(({ spot }) => spot.area === area).map((s) => s.p);
    setOpenId(undefined);
    setView(fitAll(size.width, size.height, points));
  }

  // Screen geometry for the current view.
  const ready = view && size.width > 0;
  const worldPx = ready ? TILE * 2 ** view.zoom : 1;
  const toScreen = (p: Point) =>
    ready ? { x: (p.x - view.center.x) * worldPx + size.width / 2, y: (p.y - view.center.y) * worldPx + size.height / 2 } : { x: 0, y: 0 };
  const unitsPerPx = I.scale / worldPx;
  const viewBox = ready
    ? [
        (view.center.x - size.width / 2 / worldPx - I.origin.x) * I.scale,
        (view.center.y - size.height / 2 / worldPx - I.origin.y) * I.scale,
        size.width * unitsPerPx,
        size.height * unitsPerPx,
      ].join(" ")
    : `0 0 ${I.width} ${I.height}`;

  const font = mobile ? 11 : 12;
  const labelH = mobile ? 20 : 22;
  const pins = visible.map(({ spot, p }) => ({ spot, s: toScreen(p) }));
  const labels = ready
    ? layoutLabels(
        pins.map(({ spot, s }) => ({ id: spot.id, x: s.x, y: s.y, width: labelWidth(spot.name, font), height: labelH })),
        size,
      )
    : [];
  const labelById = new Map(labels.map((l) => [l.id, l]));
  const openPin = open ? pins.find((p) => p.spot.id === open.id) : undefined;
  const geoLabels = I.labels.map((l) => ({ ...l, s: toScreen(project(l.lat, l.lng)) }));

  return (
    <div className={variant === "embed" ? "absolute inset-0" : "flex flex-col gap-4"}>
      {/* Map */}
      <div
        ref={containerRef}
        className={cn(
          "overflow-hidden select-none",
          variant === "embed" ? "absolute inset-0" : "relative h-[68svh] min-h-[440px] border border-gold/40 md:h-[min(78svh,820px)] md:min-h-[560px]",
          // Locked: the browser keeps normal page scrolling.
          locked ? "touch-pan-x touch-pan-y" : "touch-none",
        )}
        style={{ background: C.outside }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onMapClick}
        onDoubleClick={onDoubleClick}
        role="application"
        aria-label={`Illustrated map of ${textOr(content.areaName, "Osaka")} with ${visible.length} spots`}
      >
        {/* Illustration */}
        <svg className="absolute inset-0 h-full w-full" viewBox={viewBox} preserveAspectRatio="none" aria-hidden>
          <rect x={-1e5} y={-1e5} width={2e5} height={2e5} fill={C.outside} />
          {I.prefecture.map((d, i) => (
            <path key={`pref-${i}`} d={d} fill={C.osaka} />
          ))}
          {I.parks.map((p, i) => (
            <path key={`park-${i}`} d={p.d} fill={p.kind === "forest" ? C.forest : C.park} />
          ))}
          {I.prefecture.map((d, i) => (
            <path
              key={`pref-line-${i}`}
              d={d}
              fill="none"
              stroke={C.border}
              strokeOpacity={0.55}
              strokeWidth={1.2}
              strokeDasharray="5 5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {I.sea.map((d, i) => (
            <path key={`sea-${i}`} d={d} fill={C.sea} stroke={C.coast} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
          ))}
          {I.islands.map((d, i) => (
            <path key={`island-${i}`} d={d} fill={C.osaka} stroke={C.coast} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          {I.rivers.map((r, i) => (
            <path
              key={`river-${i}`}
              d={r.d}
              fill="none"
              stroke={C.river}
              strokeWidth={Math.max(r.w, 1.4 * unitsPerPx)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {/* Geographic labels (from the data, not placed by eye) */}
        {ready
          ? geoLabels.map((l) => (
              <span
                key={l.text}
                aria-hidden
                className={cn(
                  "pointer-events-none absolute font-heading-en whitespace-nowrap italic",
                  l.kind === "sea" ? "text-sm tracking-[0.35em] text-[#6f93a1] uppercase md:text-base" : "text-[11px] tracking-[0.2em] text-[#6f93a1]",
                )}
                style={{ left: l.s.x, top: l.s.y, transform: `translate(-50%, -50%) rotate(${l.rotate}deg)` }}
              >
                {l.text}
              </span>
            ))
          : null}

        {/* Leader lines */}
        {ready ? (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            {labels
              .filter((l) => l.leader)
              .map((l) => (
                <line key={l.id} x1={l.leader!.x1} y1={l.leader!.y1} x2={l.leader!.x2} y2={l.leader!.y2} stroke="#0d1f36" strokeOpacity={0.45} strokeWidth={1} />
              ))}
          </svg>
        ) : null}

        {/* Pins */}
        {pins.map(({ spot, s }) => {
          const isOpen = spot.id === open?.id;
          return (
            <button
              key={spot.id}
              type="button"
              data-spot
              onClick={(e) => {
                e.stopPropagation();
                selectSpot(spot.id);
              }}
              aria-label={spot.name}
              aria-expanded={isOpen}
              className={cn("absolute flex items-end justify-center", isOpen ? "z-30" : "z-10 hover:z-20")}
              style={{ left: s.x - PIN_HIT / 2, top: s.y - PIN_HIT, width: PIN_HIT, height: PIN_HIT }}
            >
              <MapPin
                className={cn("h-[26px] w-[26px] drop-shadow-[0_2px_2px_rgba(13,31,54,0.35)] transition-transform", isOpen ? "scale-125" : "hover:scale-110")}
                fill={isOpen ? "#0d1f36" : "#a92d3a"}
                stroke="#f7f2e7"
                strokeWidth={1.6}
              />
            </button>
          );
        })}

        {/* Names: always shown */}
        {pins.map(({ spot }) => {
          const l = labelById.get(spot.id);
          if (!l) return null;
          const isOpen = spot.id === open?.id;
          return (
            <button
              key={`label-${spot.id}`}
              type="button"
              data-spot
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                selectSpot(spot.id);
              }}
              className={cn(
                "absolute flex items-center justify-center whitespace-nowrap rounded-full font-heading-en shadow-[0_1px_3px_rgba(13,31,54,0.22)] transition-colors",
                isOpen ? "z-30 bg-navy text-cream" : "z-20 bg-white/95 text-navy hover:bg-white",
              )}
              style={{ left: l.left, top: l.top, width: l.width, height: l.height, fontSize: font }}
            >
              {spot.name}
            </button>
          );
        })}

        {/* Popup */}
        {open && openPin ? (
          <SpotPopup
            spot={open}
            areaLabel={textOr(content.areas[open.area], open.area)}
            anchor={{ x: openPin.s.x, y: openPin.s.y - PIN_HEAD_OFFSET }}
            mapSize={size}
            mobile={mobile}
            onClose={() => setOpenId(undefined)}
          />
        ) : null}

        {/* Compass + controls */}
        <div data-map-control aria-hidden className="pointer-events-none absolute top-3 right-3 z-40 flex flex-col items-center font-heading-en text-navy/60">
          <span className="text-[11px] tracking-[0.2em]">N</span>
          <span className="h-6 w-px bg-navy/40" />
        </div>
        <div data-map-control className="absolute right-3 bottom-8 z-40 flex flex-col border border-navy/15 bg-white/95 shadow-md">
          <button type="button" aria-label="Zoom in" onClick={() => zoomAt((z) => z + 1)} className="flex h-11 w-11 items-center justify-center text-navy hover:bg-cream-dark">
            <Plus className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomAt((z) => z - 1)} className="flex h-11 w-11 items-center justify-center border-t border-navy/10 text-navy hover:bg-cream-dark">
            <Minus className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Show all of Osaka" onClick={() => jumpTo("all")} className="flex h-11 w-11 items-center justify-center border-t border-navy/10 text-navy hover:bg-cream-dark">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        {coarse ? (
          <button
            data-map-control
            type="button"
            onClick={() => setTouchLocked((v) => !v)}
            aria-pressed={!touchLocked}
            className="absolute top-3 left-3 z-40 flex h-11 items-center gap-2 rounded-full border border-navy/15 bg-white/95 px-4 text-xs text-navy shadow-md"
          >
            <Hand className="h-4 w-4" aria-hidden />
            {touchLocked ? "Move map" : "Done"}
          </button>
        ) : null}
        <a
          data-map-control
          href={content.attribution.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-0 bottom-0 z-40 bg-white/70 px-2 py-0.5 text-[10px] text-navy/60 hover:text-navy"
        >
          {content.attribution.text}
        </a>
      </div>

      {/* Explore by area (jumps the map; not a sidebar). Standalone page only. */}
      {variant === "page" ? (
        <nav aria-label="Explore by area" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-cream/60">
          <span className="font-heading-en tracking-[0.2em] text-cream/45 italic">EXPLORE</span>
          {(Object.keys(content.areas) as SelectAreaKey[]).map((area) => (
            <button key={area} type="button" onClick={() => jumpTo(area)} className="py-1 transition-colors hover:text-gold">
              {textOr(content.areas[area], area)}
            </button>
          ))}
          <button type="button" onClick={() => jumpTo("all")} className="py-1 text-gold/80 transition-colors hover:text-gold">
            All of Osaka
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function SpotPopup({
  spot,
  areaLabel,
  anchor,
  mapSize,
  mobile,
  onClose,
}: {
  spot: SelectSpot;
  areaLabel: string;
  anchor: Point;
  mapSize: { width: number; height: number };
  mobile: boolean;
  onClose: () => void;
}) {
  const width = 240;
  // Desktop: beside the pin, inside the map. Mobile: compact card at the bottom of the map.
  const style = mobile
    ? undefined
    : (() => {
        const placeRight = anchor.x + 28 + width < mapSize.width - 8;
        const left = placeRight ? anchor.x + 28 : anchor.x - 28 - width;
        const top = Math.min(Math.max(anchor.y - 140, 8), Math.max(8, mapSize.height - 260));
        return { left: Math.min(Math.max(left, 8), mapSize.width - width - 8), top, width };
      })();

  return (
    <div
      data-map-control
      role="dialog"
      aria-label={spot.name}
      className={cn("absolute z-50 overflow-hidden bg-white text-navy shadow-[0_10px_30px_rgba(13,31,54,0.28)]", mobile ? "inset-x-3 bottom-3 flex" : "flex flex-col")}
      style={style}
    >
      <div className={cn("relative shrink-0 bg-cream-dark", mobile ? "w-28" : "aspect-[16/10] w-full")}>
        <TbdImage value={spot.mainImage} slot="Photo" sizes="240px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 pr-10">
        <p className="font-heading-en text-lg leading-tight text-navy">{spot.name}</p>
        {spot.nameJa ? <p className="text-xs text-navy/60">{spot.nameJa}</p> : null}
        <p className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-red/10 px-2.5 py-1 text-[11px] text-red">
          <MapPin className="h-3 w-3" aria-hidden />
          {areaLabel}
        </p>
        {/* Future actions (not built): View Guide / Add to My Private Day / View Experience. */}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-navy shadow hover:bg-cream-dark"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
