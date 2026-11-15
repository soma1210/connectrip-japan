import type { CSSProperties } from "react";
import styles from "./Reveal.module.css";

export type RevealKind = "up" | "fade" | "maskFromLeft" | "maskFromRight" | "iris" | "title" | "upMobile";

/**
 * Props for an element that reveals on scroll (see Reveal.module.css).
 * `delay` in seconds staggers it inside its group. Spread onto the element and
 * pass its own classes as `className`:
 *
 *   <p {...reveal("up", 0.15, "mt-4 text-sm")}>…</p>
 *
 * Works only where <RevealObserver /> is mounted (Home). Elsewhere the element
 * is simply visible.
 */
export function reveal(kind: RevealKind, delay = 0, className = ""): { className: string; style?: CSSProperties; "data-reveal-item": "" } {
  return {
    className: `${styles.item} ${styles[kind]} ${className}`.trim(),
    style: delay ? ({ "--d": `${delay}s` } as CSSProperties) : undefined,
    "data-reveal-item": "",
  };
}

/** Put on a container so all reveal items inside it start together when the container scrolls in. */
export const revealGroup = { "data-reveal-group": "" } as const;

/** Same, but the group waits until it is well inside the screen (text that follows a scroll-linked photo). */
export const revealGroupLate = { "data-reveal-group": "late" } as const;

/**
 * Scroll-linked scene (wide screens): RevealObserver writes `--p` (0 → 1 as the
 * enclosing <section> scrolls into place) on this element. `span` = how much of
 * the screen height the scene needs to finish (default 0.85).
 */
export const sceneProgress = (span = 0.85) => ({ "data-progress": String(span) }) as const;

/** Parallax layer: `--py` in px, `factor` of the distance between the section's centre and the screen's centre. */
export const parallax = (factor: number) => ({ "data-parallax": String(factor) }) as const;

export const revealStyles = styles;
