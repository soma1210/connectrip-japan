import { cn } from "@/lib/cn";
import { FadeIn } from "./FadeIn";

export function SectionHeading({
  heading,
  subheading,
  align = "left",
  className,
  subheadingClassName,
  headingLevel = "h2",
}: {
  heading: string;
  subheading?: string;
  align?: "left" | "center";
  className?: string;
  subheadingClassName?: string;
  /** Use "h1" when this is the page's own top-level heading (e.g. a
   * standalone form page), rather than a section within a longer page. */
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;

  return (
    <FadeIn
      className={cn(
        "mt-6 mb-8 md:mt-14 md:mb-12",
        align === "center" && "text-center",
        className,
      )}
    >
      <Heading className="ml-6 font-heading-en text-5xl font-bold tracking-[0.08em] text-gold md:ml-10 md:text-6xl">
        {heading}
      </Heading>
      {subheading ? (
        <p className={subheadingClassName ?? "mt-4 text-sm text-cream/70 md:text-base"}>
          {subheading}
        </p>
      ) : null}
    </FadeIn>
  );
}
