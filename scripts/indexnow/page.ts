import { createHash } from "node:crypto";
import { HOST, SITE_ORIGIN } from "./config";

/**
 * What a page says, reduced to the parts that matter to a search engine, so that
 * a new build or a re-render does not count as an update. Only the page's own
 * content is read: <main> (not the shared header / footer), its images, and the
 * title, description, canonical and robots of <head>.
 *
 * Ignored on purpose (they change without the page changing):
 * - every attribute except img src/alt: hashed CSS class names, React ids
 *   (useId), inline animation styles, data-* state;
 * - <script>, <style>, <noscript>, <svg>, <template> and comments: the Next.js
 *   RSC payload, build ids, inline JSON-LD shared by every page;
 * - Next.js image optimizer parameters (`/_next/image?url=…&w=…&q=…` → the file);
 * - the USD reference next to yen prices, recalculated every day (content/exchangeRate.ts);
 * - invisible characters (word joiners, zero-width spaces) and whitespace.
 */
export type PageContent = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  text: string;
  images: string[];
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", "#x27": "'" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+[0-9]*);/gi, (m, e: string) => {
    const lower = e.toLowerCase();
    if (lower in ENTITIES) return ENTITIES[lower];
    if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return m;
  });
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? decodeEntities(m[2] ?? m[3] ?? "") : undefined;
}

function metaContent(head: string, key: "name" | "property", value: string): string {
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    if ((attr(tag, key) ?? "").toLowerCase() === value) return attr(tag, "content") ?? "";
  }
  return "";
}

/** `/_next/image?url=%2Fimages%2Fa.jpg&w=640&q=75` → `/images/a.jpg`; other URLs lose their query. */
export function imageKey(src: string): string {
  const m = src.match(/[?&]url=([^&]+)/);
  const path = m && src.includes("/_next/image") ? decodeURIComponent(m[1]) : src;
  return path.replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0];
}

export function normalizeText(s: string): string {
  return s
    .replace(/[​-‍⁠﻿­]/g, "")
    .replace(/≈\s*(?:US)?\$\s*[\d,]+(?:\.\d+)?\s*(?:USD)?/g, "≈ USD")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractContent(html: string): PageContent {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html;
  const title = normalizeText(decodeEntities(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""));
  const canonicalTag = (head.match(/<link\b[^>]*>/gi) ?? []).find((t) => (attr(t, "rel") ?? "").toLowerCase() === "canonical");

  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
  const cleaned = main
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ");
  const images = (cleaned.match(/<img\b[^>]*>/gi) ?? []).map((t) => `${imageKey(attr(t, "src") ?? "")} ${normalizeText(attr(t, "alt") ?? "")}`.trim());
  const text = normalizeText(decodeEntities(cleaned.replace(/<[^>]+>/g, " ")));

  return {
    title,
    description: normalizeText(metaContent(head, "name", "description")),
    canonical: canonicalTag ? (attr(canonicalTag, "href") ?? "") : "",
    robots: metaContent(head, "name", "robots").toLowerCase(),
    text,
    images,
  };
}

export function fingerprint(c: PageContent): string {
  return createHash("sha256").update(JSON.stringify([c.title, c.description, c.canonical, c.robots, c.text, c.images])).digest("hex");
}

/** Only https://connectripjapan.com/... pages, no query or fragment, no preview path. */
export function isOfficialUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  return u.protocol === "https:" && u.host === HOST && !u.search && !u.hash && !u.username && !/^\/v1(\/|$)/.test(u.pathname) && `${u.protocol}//${u.host}` === SITE_ORIGIN;
}

/** `https://connectripjapan.com` and `https://connectripjapan.com/` are the same page; other paths keep their form. */
export function sameUrl(a: string, b: string): boolean {
  try {
    const x = new URL(a, SITE_ORIGIN);
    const y = new URL(b, SITE_ORIGIN);
    const p = (u: URL) => (u.pathname === "/" ? "/" : u.pathname.replace(/\/$/, ""));
    return x.host === y.host && x.protocol === y.protocol && p(x) === p(y) && x.search === y.search;
  } catch {
    return false;
  }
}

export function parseSitemap(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decodeEntities(m[1]));
}

/** Result of reading one URL on the live site. */
export type Snapshot =
  | { kind: "indexable"; hash: string }
  | { kind: "noindex"; detail: string }
  | { kind: "redirect"; status: number; location: string }
  | { kind: "gone"; status: number }
  | { kind: "error"; detail: string };

/** Classify a response. `xRobots` is the X-Robots-Tag header. */
export function classify(url: string, status: number, html: string, xRobots: string | null, location: string | null): Snapshot {
  if (status >= 300 && status < 400) return { kind: "redirect", status, location: location ? new URL(location, url).toString() : "" };
  if (status === 404 || status === 410) return { kind: "gone", status };
  if (status !== 200) return { kind: "error", detail: `HTTP ${status}` };
  const c = extractContent(html);
  if (/noindex|none/.test(c.robots)) return { kind: "noindex", detail: `meta robots "${c.robots}"` };
  if (xRobots && /noindex|none/i.test(xRobots)) return { kind: "noindex", detail: `X-Robots-Tag "${xRobots}"` };
  if (c.canonical && !sameUrl(c.canonical, url)) return { kind: "noindex", detail: `canonical points to ${c.canonical}` };
  return { kind: "indexable", hash: fingerprint(c) };
}
