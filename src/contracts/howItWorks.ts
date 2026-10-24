import type { CtaSpec } from "./cta";
import type { FaqItem } from "./experience";
import type { PageViewModel } from "./pages";
import type { Tbd } from "./status";

/**
 * Two flows, four steps each (T-05 Home Working Baseline, W1-D05). Step keys
 * follow the baseline outline; wording is Working Baseline copy.
 *
 * - Ready-made:    Find an Experience → Choose Your Date → Book → Explore Osaka
 * - Private Guide: Tell Us What You Want → We Plan Together → Confirm Your Day → Explore Kansai
 */
export type HowItWorksFlowKey = "ready_made" | "private_guide";

export type ReadyMadeStepKey = "find" | "choose_date" | "book" | "explore";

export type PrivateGuideStepKey = "tell_us" | "plan_together" | "confirm" | "explore";

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
