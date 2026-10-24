import type { CtaSpec } from "./cta";
import type { FaqItem } from "./experience";
import type { PageViewModel } from "./pages";
import type { Tbd } from "./status";

/**
 * Two flows (Website v1 §6-7, WORKING_BASELINE). Step keys follow the
 * baseline outline; titles and descriptions are TBD copy.
 *
 * - Ready-made:    Choose → Date / Guests → Pay → Confirmed → Enjoy
 * - Private Guide: Inquiry → Plan Together → Confirm → Pay → Enjoy
 */
export type HowItWorksFlowKey = "ready_made" | "private_guide";

export type ReadyMadeStepKey = "choose" | "date_guests" | "pay" | "confirmed" | "enjoy";

export type PrivateGuideStepKey = "inquiry" | "plan_together" | "confirm" | "pay" | "enjoy";

type StepKeyFor<K extends HowItWorksFlowKey> = K extends "ready_made"
  ? ReadyMadeStepKey
  : PrivateGuideStepKey;

type FlowCtaFor<K extends HowItWorksFlowKey> = K extends "ready_made"
  ? CtaSpec<"experiences">
  : CtaSpec<"privateGuide" | "inquiry">;

export type HowItWorksStep<K extends HowItWorksFlowKey = HowItWorksFlowKey> = {
  key: StepKeyFor<K>;
  title: Tbd<string>;
  description?: Tbd<string>;
};

export type HowItWorksFlow<K extends HowItWorksFlowKey> = {
  key: K;
  title: Tbd<string>;
  summary?: Tbd<string>;
  /** In order. */
  steps: HowItWorksStep<K>[];
  /** e.g. Private Guide: "an inquiry is not a booking" (copy TBD). */
  note?: Tbd<string>;
  cta: FlowCtaFor<K>;
};

export type HowItWorksFlows = {
  readyMade: HowItWorksFlow<"ready_made">;
  privateGuide: HowItWorksFlow<"private_guide">;
};

export type HowItWorksContent = {
  intro: {
    headline: Tbd<string>;
    supporting: Tbd<string>;
  };
  flows: HowItWorksFlows;
  faq?: Tbd<FaqItem[]>;
};

export type HowItWorksViewModel = PageViewModel<"howItWorks", HowItWorksContent>;
