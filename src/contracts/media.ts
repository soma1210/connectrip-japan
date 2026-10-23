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
};
