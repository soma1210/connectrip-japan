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
        "mt-6 mb-8 md:mt-14 md:mb-12",
        align === "center" && "text-center",
        className,
      )}
    >
      <h2 className="ml-6 font-heading-en text-5xl font-bold tracking-[0.08em] text-gold md:ml-10 md:text-6xl">
        {heading}
      </h2>
      {subheading ? (
        <p className="mt-4 text-sm text-cream/70 md:text-base">{subheading}</p>
      ) : null}
    </FadeIn>
  );
}
