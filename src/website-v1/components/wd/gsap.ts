"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * GSAP + ScrollTrigger for the White Desert–style motion layer (components/wd).
 * Registered once on the client. `ignoreMobileResize` keeps triggers from
 * re-measuring when the mobile address bar shows / hides.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/** Wide screens with a mouse, motion allowed: the full scroll choreography. */
export const MQ_DESKTOP_MOTION = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
/** Any screen, motion allowed. */
export const MQ_MOTION = "(prefers-reduced-motion: no-preference)";

/** The house ease of the motion layer (slow, editorial settle). */
export const EASE_OUT = "expo.out";

export { gsap, ScrollTrigger };
