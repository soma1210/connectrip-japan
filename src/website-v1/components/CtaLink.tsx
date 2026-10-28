import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ctaDataAttributes, type CtaSpec } from "@/contracts";
import { cn } from "@/lib/cn";
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
 * Paired CTAs: a Primary and a Secondary that sit side by side get one fixed
 * box (same width, height and padding) so their size never follows the label
 * length. Colours, typography and hover stay those of each variant. Below
 * `sm` the buttons go full width (the parent stacks them).
 * `cn` does not resolve conflicting classes, so the pair box is built from
 * its own parts instead of being appended to `VARIANTS`.
 */
const PAIR_FRAME: Record<Exclude<Variant, "text">, string> = {
  primary: "border border-gold bg-red text-cream transition-colors hover:bg-red-hover",
  secondary: "border border-gold text-gold transition-colors hover:bg-gold hover:text-navy",
};
const PAIR_TYPE: Record<"md" | "sm", Record<Exclude<Variant, "text">, string>> = {
  md: { primary: "text-sm tracking-[0.08em]", secondary: "text-xs tracking-[0.1em]" },
  sm: { primary: "text-xs tracking-[0.08em]", secondary: "text-xs tracking-[0.1em]" },
};
const PAIR_BOX = {
  md: "inline-flex h-[3.375rem] w-full items-center justify-center whitespace-nowrap px-6 text-center sm:w-64",
  sm: "inline-flex h-[3.125rem] w-full items-center justify-center whitespace-nowrap px-6 text-center sm:w-56",
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
  /** Same fixed box as the CTA next to it (see PAIR_BOX). Ignored for `text`. */
  pair?: boolean;
  className?: string;
}) {
  const v = variant ?? (cta.emphasis === "primary" ? "primary" : "secondary");
  const box = size ?? "md";
  const classes =
    pair && v !== "text"
      ? cn(PAIR_BOX[box], PAIR_FRAME[v], PAIR_TYPE[box][v], className)
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
