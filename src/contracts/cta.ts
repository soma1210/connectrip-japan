import type { RouteKey } from "./routes";
import type { Tbd } from "./status";

/** Where a CTA may lead. Every CTA points to an internal page. */
export type CtaDestination = Exclude<RouteKey, "privacy" | "terms">;

export type CtaPosition =
  | "header"
  | "mobile_menu"
  | "hero"
  | "section"
  | "card"
  | "footer"
  | "inline";

export type CtaSpec<D extends CtaDestination = CtaDestination> = {
  /** Stable id, also used as the analytics key. */
  id: string;
  destination: D;
  /** Resolved by the routing layer. Render as-is. */
  href: string;
  /** CTA copy is TBD until a human decides it (Website Brain §9). */
  label: Tbd<string>;
  position: CtaPosition;
  emphasis: "primary" | "secondary";
  /** Set when the CTA carries a selected experience (Detail, Booking). */
  experienceId?: string;
  /**
   * Set when the CTA cannot be used yet (e.g. booking is not open for a
   * product). Render a disabled state; do not hide the CTA.
   */
  disabled?: boolean;
};

/**
 * Attributes UI components spread onto the rendered CTA element. Click
 * tracking is attached by the integration layer through these attributes,
 * so presentation components never call analytics themselves.
 */
export function ctaDataAttributes(cta: CtaSpec) {
  return {
    "data-cta-id": cta.id,
    "data-cta-destination": cta.destination,
    "data-cta-position": cta.position,
    ...(cta.experienceId ? { "data-experience-id": cta.experienceId } : {}),
  };
}
