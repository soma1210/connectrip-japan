import type { ImageAsset, StaffRef } from "@/contracts";
import { jstToday } from "./freshness";

/**
 * Shared parts of DEMO / PLACEHOLDER / NOT FOR PRODUCTION records. They exist
 * to exercise the templates; nothing here is real. Records using them set
 * `demo: true`, which the publish gate always rejects.
 */
export const DEMO_STAFF: StaffRef = { id: "demo-staff-not-real" };

/** Demo dates are relative to today (Japan) so every state stays reviewable. */
export const demoToday = jstToday();

export function demoImage(file: string, alt: string, width: number, height: number, watermarked = false): ImageAsset {
  return {
    src: `/images/v1/hero/osaka/${file}`,
    alt: `${alt} (placeholder photo)`,
    width,
    height,
    rights: "NOT_VERIFIED",
    consent: "NOT_VERIFIED",
    assetRights: {
      source: "development_placeholder",
      rightsType: watermarked ? "Watermarked stock preview, not licensed" : "Development image, licence not verified",
      rightsVerified: false,
      watermarked,
    },
  };
}
