import type { SocialProofContent } from "../socialProof";
import { tbd } from "../status";
import { fixtureText } from "./shared";

/**
 * Social Proof fixture. Deliberately has NO reviews and NO metrics: fixtures
 * must not contain reviews that were not verified against a real source.
 * Design the review card from `VerifiedReview` and the empty state from this.
 */
export const socialProofFixture = {
  heading: fixtureText("Social proof heading"),
  reviews: tbd("No human-verified reviews yet"),
  photos: tbd("Real photos with confirmed rights / consent needed"),
  social: tbd("SNS accounts NOT_VERIFIED"),
  metrics: tbd("No verified SNS metrics yet"),
} satisfies SocialProofContent;
