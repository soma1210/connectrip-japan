import { Instrument_Sans } from "next/font/google";

/**
 * Home Hero title face (first view only; PENDING HUMAN VISUAL REVIEW).
 *
 * Reference: The Real Hotels sets its titles in Tartuffo (Tightype) and its text
 * in TWK Lausanne (Weltkern). Both are paid commercial fonts and Tartuffo is a
 * serif; the owner chose a gothic title with a free licence (2026-11-24).
 * Instrument Sans (SIL Open Font License 1.1, commercial use allowed) takes the
 * title role: a refined grotesque that holds up bold at display sizes.
 * Self-hosted by next/font with a metric-matched fallback, so no layout shift.
 * Imported by the Home view only, so other pages do not load it.
 */
export const heroDisplay = Instrument_Sans({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-hero-display",
});
