import { cn } from "@/lib/cn";
import { FadeIn } from "./FadeIn";

export function SectionHeading({
  heading,
  subheading,
  align = "left",
  className,
}: {
  heading: string;
  subheading?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <FadeIn
      className={cn(
        "mb-10 md:mb-14",
        align === "center" && "text-center",
        className,
      )}
    >
      <h2 className="font-heading-en text-4xl tracking-[0.08em] text-gold md:text-5xl">
        {heading}
      </h2>
      {subheading ? (
        <p className="mt-4 text-sm text-cream/70 md:text-base">{subheading}</p>
      ) : null}
    </FadeIn>
  );
}
