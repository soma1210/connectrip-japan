import type { CSSProperties } from "react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { cn } from "@/lib/cn";

/**
 * OUR VALUE card (Website V1 Home, final design 2026-11-15). The words sit
 * inside the photo, at its bottom: number → title → description, left-aligned.
 * Number and title share a fixed slot (number line + two title lines) filled
 * from the bottom, so every description starts at the same height and every
 * text block ends at the same bottom margin (the descriptions are one line at
 * every card width; two at most, clamped).
 *
 * Motion: the entrance is the caller's (Home reveal group, once). Hover, on
 * devices that can hover only (Tailwind v4 `group-hover`): the photo alone
 * zooms to 1.03 over 0.6 s; the words, the frame and the card stay still.
 */
export function ValueCard({
  number,
  title,
  description,
  image,
  alt,
  className,
  style,
  ...rest
}: {
  number: string;
  title: string;
  description: string;
  image: string;
  /** Defaults to the title. */
  alt?: string;
  className?: string;
  style?: CSSProperties;
  "data-reveal-item"?: "";
}) {
  return (
    <article className={cn("group relative aspect-[3/2] overflow-hidden border border-gold/30 @container", className)} style={style} {...rest}>
      <div className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
        <PlaceholderImage src={image} alt={alt ?? title} sizes="(min-width: 900px) 33vw, (min-width: 640px) 50vw, 100vw" />
      </div>
      {/* The top of the photo stays bright; navy rises from the bottom, with a touch of black under the words. */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 via-38% to-transparent to-72%" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent to-45%" />
      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 @[300px]:px-6 @[300px]:pb-5">
        {/* Number and title share a fixed two-line slot, filled from the bottom: one-line titles sit low, and every description starts at the same height. */}
        <div className="flex min-h-[calc(1.25rem+2lh)] flex-col justify-end text-[clamp(1rem,6cqw,1.375rem)] leading-snug">
          <p className="font-heading-en text-xs tracking-[0.24em] text-gold/75">{number}</p>
          <h3 className="mt-1 line-clamp-2 font-heading-en text-gold">{title}</h3>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[clamp(0.75rem,4cqw,0.9375rem)] leading-relaxed text-cream/90">{description}</p>
      </div>
    </article>
  );
}
