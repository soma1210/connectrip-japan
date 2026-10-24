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
 * Renders a contract `CtaSpec`. The href comes from the Route Registry via
 * content; tracking hooks onto the data attributes, never called here.
 */
export function CtaLink({
  cta,
  variant,
  size,
  className,
}: {
  cta: CtaSpec;
  variant?: Variant;
  size?: "sm";
  className?: string;
}) {
  const v = variant ?? (cta.emphasis === "primary" ? "primary" : "secondary");
  const classes = cn(VARIANTS[v], size === "sm" && v !== "text" && SMALL, className);
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
