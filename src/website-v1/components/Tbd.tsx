import { ImageOff } from "lucide-react";
import type { ElementType } from "react";
import type { ImageAsset, Tbd } from "@/contracts";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { cn } from "@/lib/cn";

type Tone = "dark" | "light";

/**
 * Visible placeholder for an undecided value. Shows the slot name, and the
 * reviewer note as a tooltip. Never shows invented copy.
 */
export function TbdMark({ slot, note, tone = "dark", className }: { slot: string; note?: string; tone?: Tone; className?: string }) {
  return (
    <span
      title={note}
      className={cn(
        "inline-block border border-dashed px-2.5 py-1 align-middle font-sans text-[11px] font-normal leading-snug tracking-[0.06em] normal-case",
        tone === "dark" ? "border-gold/50 bg-navy-dark/40 text-gold/80" : "border-navy/40 bg-cream-dark/60 text-navy/70",
        className,
      )}
    >
      TBD · {slot}
    </span>
  );
}

/** Renders a `Tbd<string>`: the value, or a TBD placeholder. */
export function TbdText({
  value,
  slot,
  as: Tag = "span",
  className,
  tone,
}: {
  value: Tbd<string>;
  slot: string;
  as?: ElementType;
  className?: string;
  tone?: Tone;
}) {
  if (value.status === "TBD") {
    return (
      <Tag className={className}>
        <TbdMark slot={slot} note={value.note} tone={tone} />
      </Tag>
    );
  }
  return <Tag className={className}>{value.value}</Tag>;
}

/** Plain string for attributes and metadata (alt, title). */
export function textOr(value: Tbd<string>, fallback: string): string {
  return value.status === "TBD" ? fallback : value.value;
}

/**
 * Fills its (relative, sized) parent with the image, or with a dashed TBD
 * box. Reuses the current site's `PlaceholderImage`.
 */
export function TbdImage({
  value,
  slot,
  sizes,
  priority,
  className,
}: {
  value: Tbd<ImageAsset>;
  slot: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (value.status === "TBD") {
    return (
      <div className={cn("absolute inset-0 flex items-center justify-center border border-dashed border-gold/30 bg-navy-light", className)}>
        <span className="flex flex-col items-center gap-2 px-4 text-center">
          <ImageOff className="h-5 w-5 text-gold/50" aria-hidden />
          <TbdMark slot={slot} note={value.note} />
        </span>
      </div>
    );
  }
  return (
    <PlaceholderImage src={value.value.src} alt={value.value.alt} sizes={sizes} priority={priority} className={className} />
  );
}
