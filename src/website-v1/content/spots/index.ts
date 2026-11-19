import type { ImageAsset } from "@/contracts";
import { V1_PREVIEW } from "../../config";
import { OSAKA_SPOTS, spotPhoto, type OsakaSpot } from "./osaka";

/**
 * All spot masters, one file per area (osaka.ts today; kyoto.ts, nara.ts,
 * kobe.ts follow the same shape). Articles refer to spots by id only.
 */
export type Spot = OsakaSpot;
export const ALL_SPOTS: Spot[] = [...OSAKA_SPOTS];

export function spotById(id: string): Spot {
  const spot = ALL_SPOTS.find((s) => s.id === id);
  if (!spot) throw new Error(`Unknown spot "${id}" (add it to a spot master in content/spots/)`);
  return spot;
}

export { spotPhoto };

/**
 * Rights state of a spot's photo, for the editorial list and the publish gate.
 * - confirmed: own photo or rights confirmed by a person (may be published)
 * - unverified: a file exists but its rights are not confirmed (preview only)
 * - missing: no photo yet
 */
export type PhotoRights = "confirmed" | "unverified" | "missing";

export function photoRights(spot: Spot): PhotoRights {
  const photo = spotPhoto(spot);
  if (!photo) return "missing";
  return photo.rights === "CONFIRMED_BY_HUMAN" ? "confirmed" : "unverified";
}

/** The photo to render: rights-confirmed photos anywhere; unverified ones in the preview only. */
export function displayPhoto(spot: Spot): (ImageAsset & { unverified: boolean }) | null {
  const photo = spotPhoto(spot);
  if (!photo) return null;
  const unverified = photo.rights !== "CONFIRMED_BY_HUMAN";
  return unverified && !V1_PREVIEW ? null : { ...photo, unverified };
}
