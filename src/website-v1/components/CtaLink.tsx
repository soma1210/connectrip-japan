import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ctaDataAttributes, type CtaSpec } from "@/contracts";
import { cn } from "@/lib/cn";
import { V1_PREVIEW } from "../config";
import { isPublicHref } from "../routes";
import { TbdText } from "./Tbd";

type Variant = "primary" | "secondary" | "text";

// Class strings reused from the current site's CtaButton, header buttons and
// PlanCard "learn more" link.
const VARIANTS: Record<Variant, string> = {
  primary:
    "inline-flex items-center justify-center border border-gold bg-red px-8 py-4 text-center text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover",
  secondary:
    "inline-flex items-center justify-center whitespace-nowrap border border-gold px-6 py-3 text-center text-xs tracking-[0.1em] text-gold transition-colors hover:bg-gold hover:text-navy",
  text: "inline-flex items-center gap-2 border-b border-red pb-1 text-xs tracking-[0.1em] text-cream transition-colors hover:text-gold",
};

const SMALL = "px-6 py-2.5 text-xs";

/**
 * Paired CTAs ("Explore Experiences" / "Plan a Private Day", Human
 * instruction 2026-11-09): one fixed box for every page, so the size never
 * follows the label or the section. Change the size here only.
 * 240 x 56 px; on narrow screens the width shrinks to the parent.
 * Colours and hover stay those of each variant; type and focus are shared.
 * `cn` does not resolve conflicting classes, so the pair style is built from
 * its own parts instead of being appended to `VARIANTS`.
 */
const PAIR_FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const PAIR_BOX = `inline-flex h-14 w-60 max-w-full shrink-0 items-center justify-center whitespace-nowrap px-4 text-center text-sm tracking-[0.08em] transition-colors ${PAIR_FOCUS}`;
const PAIR_COLOR: Record<Exclude<Variant, "text">, string> = {
  primary: "border border-gold bg-red text-cream hover:bg-red-hover",
  secondary: "border border-gold text-gold hover:bg-gold hover:text-navy",
};

/**
 * Header version of the paired CTAs (Human instruction 2026-11-09): same
 * type and focus, 44 px high, width follows the one-line label. In the
 * header the secondary CTA is filled gold with navy text.
 */
const HEADER_BOX = `inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap px-5 text-center text-xs tracking-[0.1em] transition-colors ${PAIR_FOCUS}`;
const HEADER_COLOR: Record<Exclude<Variant, "text">, string> = {
  primary: PAIR_COLOR.primary,
  secondary: "border border-gold bg-gold text-navy hover:bg-gold/85",
};

/**
 * Renders a contract `CtaSpec`. The href comes from the Route Registry via
 * content; tracking hooks onto the data attributes, never called here.
 */
export function CtaLink({
  cta,
  variant,
  size,
  pair,
  className,
}: {
  cta: CtaSpec;
  variant?: Variant;
  size?: "sm";
  /** Shared box for the paired CTAs: `true` = 240 x 56 (PAIR_BOX), `"header"` = compact (HEADER_BOX). Ignored for `text`. */
  pair?: boolean | "header";
  className?: string;
}) {
  // Public mode: no link to a page outside the launch scope, no unlabelled or disabled button.
  if (!V1_PREVIEW && (!isPublicHref(cta.href) || cta.disabled || cta.label.status === "TBD")) return null;
  const v = variant ?? (cta.emphasis === "primary" ? "primary" : "secondary");
  const classes =
    pair && v !== "text"
      ? pair === "header"
        ? cn(HEADER_BOX, HEADER_COLOR[v], className)
        : cn(PAIR_BOX, PAIR_COLOR[v], className)
      : cn(VARIANTS[v], size === "sm" && v !== "text" && SMALL, className);
  const label = (
    <>
      <TbdText value={cta.label} slot="CTA copy" />
      {v === "text" ? <ArrowRight className="h-3.5 w-3.5" aria-hidden /> : null}
    </>
  );

  if (cta.disabled) {
    return (
      <span
        {...ctaDataAttributes(cta)}
        aria-disabled="true"
        title="Not available in the preview (TBD)"
        className={cn(classes, "cursor-not-allowed opacity-45 hover:bg-transparent")}
      >
        {label}
      </span>
    );
  }

  return (
    <Link href={cta.href} {...ctaDataAttributes(cta)} className={classes}>
      {label}
    </Link>
  );
}
