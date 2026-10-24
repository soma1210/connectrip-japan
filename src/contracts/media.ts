/**
 * Image rights and people's consent are tracked per asset. Only assets whose
 * checks are CONFIRMED_BY_HUMAN may ship (Website Foundation §7).
 */
export type AssetCheck = "CONFIRMED_BY_HUMAN" | "NOT_VERIFIED";

export type ImageAsset = {
  src: string;
  /** Required. Empty string only for purely decorative images. */
  alt: string;
  width: number;
  height: number;
  rights: AssetCheck;
  /** Consent of identifiable people (incl. children) in the image. */
  consent: AssetCheck | "NOT_APPLICABLE";
  /** Where the asset comes from and how its use is cleared (W1-D10 K-5). */
  assetRights?: AssetRights;
};

/**
 * W1-D10 K-5. Own photos first, then licensed official / press material, then
 * other material with confirmed commercial rights. `development_placeholder`
 * (incl. watermarked stock previews) never ships.
 */
export type AssetSource =
  | "connectrip_original"
  | "official_licensed"
  | "press_media"
  | "other_licensed"
  | "development_placeholder";

export type AssetRights = {
  source: AssetSource;
  /** e.g. own work, official usage permission, press kit terms. */
  rightsType: string;
  /** Credit line when the licence requires one. */
  credit?: string;
  rightsVerified: boolean;
  /** ISO date (YYYY-MM-DD). */
  rightsVerifiedAt?: string;
  /** Internal staff id. Never rendered. */
  rightsVerifiedBy?: string;
  /** Usage conditions, expiry. */
  licenseNote?: string;
  /** Watermarked previews (e.g. Adobe Stock comps) are never production assets. */
  watermarked: boolean;
};
