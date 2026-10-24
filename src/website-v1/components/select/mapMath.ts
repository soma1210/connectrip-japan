import { ILLUSTRATION as I } from "../../assets/osakaIllustratedMap";

/**
 * Pure map maths for Connectrip Select (shared by the map and checks):
 * Web Mercator projection, view fitting and clamping to the illustration.
 */
export const TILE = 256;
export const MAX_ZOOM = 16.5;

export type Point = { x: number; y: number };
export type View = { zoom: number; center: Point };

/** Web Mercator, normalised to 0..1 (same as the illustration). */
export function project(lat: number, lng: number): Point {
  const sin = Math.sin((lat * Math.PI) / 180);
  return { x: (lng + 180) / 360, y: 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI) };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** The illustrated area in normalised coordinates. */
export const AREA = { x: I.origin.x, y: I.origin.y, w: I.width / I.scale, h: I.height / I.scale };

/** Smallest zoom at which the view is fully covered by the illustration. */
export function minZoomFor(width: number, height: number) {
  return Math.log2(Math.max(width / (AREA.w * TILE), height / (AREA.h * TILE)));
}

/** Keep the view inside the illustration. */
export function clampView(v: View, width: number, height: number): View {
  const zoom = clamp(v.zoom, minZoomFor(width, height), MAX_ZOOM);
  const world = TILE * 2 ** zoom;
  const halfW = width / 2 / world;
  const halfH = height / 2 / world;
  return {
    zoom,
    center: {
      x: clamp(v.center.x, AREA.x + halfW, AREA.x + AREA.w - halfW),
      y: clamp(v.center.y, AREA.y + halfH, AREA.y + AREA.h - halfH),
    },
  };
}

export function fitPoints(points: Point[], width: number, height: number, pad: { x: number; y: number }, maxZoom = 15): View {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const zx = Math.log2((width - pad.x * 2) / (Math.max(maxX - minX, 1e-6) * TILE));
  const zy = Math.log2((height - pad.y * 2) / (Math.max(maxY - minY, 1e-6) * TILE));
  return clampView({ zoom: Math.min(zx, zy, maxZoom), center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 } }, width, height);
}

export function zoomedView(v: View, zoom: number, size: { width: number; height: number }, anchor?: Point): View {
  if (!anchor) return clampView({ zoom, center: v.center }, size.width, size.height);
  const before = TILE * 2 ** v.zoom;
  const after = TILE * 2 ** clamp(zoom, minZoomFor(size.width, size.height), MAX_ZOOM);
  const dx = anchor.x - size.width / 2;
  const dy = anchor.y - size.height / 2;
  return clampView(
    { zoom, center: { x: v.center.x + dx / before - dx / after, y: v.center.y + dy / before - dy / after } },
    size.width,
    size.height,
  );
}

