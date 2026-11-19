import type { ExperienceId } from "./experience";
import type { ImageAsset } from "./media";
import type { SocialLink, SocialPlatform } from "./navigation";
import type { Tbd } from "./status";

/**
 * Social Proof (Website v1 §6-9): real photos, real SNS results, real reviews
 * only. Fabricated or unverified content cannot be typed in: every review
 * and metric carries its source and a human verification. Images keep the
 * rights / consent rules from `ImageAsset`.
 */
export type HumanVerification = {
  status: "VERIFIED_BY_HUMAN";
  /** Who checked it against the source. */
  verifiedBy: string;
  /** ISO date. */
  verifiedAt: string;
  note?: string;
};

export type ReviewPlatform =
  | "google"
  | "tripadvisor"
  | "getyourguide"
  | "viator"
  | "klook"
  | "direct"
  | "other";

export type ReviewSource = {
  platform: ReviewPlatform;
  /** Public URL of the review, when one exists. */
  url?: string;
  /** ISO date the review was captured from the source. */
  capturedAt: string;
};

export type VerifiedReview = {
  id: string;
  source: ReviewSource;
  verification: HumanVerification;
  author: {
    /** As shown on the source. */
    displayName: string;
    country?: string;
  };
  rating?: { value: number; scale: 5 };
  /** Verbatim from the source. Never edited or translated without a note. */
  quote: string;
  /** BCP 47 tag of `quote`. */
  language?: string;
  /** ISO date of the review on the source. */
  reviewDate?: string;
  experienceId?: ExperienceId;
  photo?: ImageAsset;
};

/** A public SNS number (e.g. followers). Verified against the source. */
export type SocialMetric = {
  platform: SocialPlatform;
  metric: "followers" | "views" | "likes" | "posts";
  value: number;
  /** ISO date of the number. */
  asOf: string;
  sourceUrl: string;
  verification: HumanVerification;
  label: Tbd<string>;
};

export type SocialProofContent = {
  heading: Tbd<string>;
  reviews: Tbd<VerifiedReview[]>;
  /** Real photos; ship only with rights / consent CONFIRMED_BY_HUMAN. */
  photos: Tbd<ImageAsset[]>;
  /** Account status NOT_VERIFIED until confirmed. */
  social: Tbd<SocialLink[]>;
  metrics?: Tbd<SocialMetric[]>;
};
