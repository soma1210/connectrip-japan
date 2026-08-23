import { FadeIn } from "./FadeIn";

export function LegalPageHeader({
  heading,
  subheading,
}: {
  heading: string;
  subheading: string;
}) {
  return (
    <FadeIn className="mb-14 md:mb-20">
      <div className="flex items-center gap-4">
        <span className="h-8 w-[3px] bg-navy" aria-hidden />
        <h1 className="font-heading-jp text-3xl text-navy md:text-4xl">
          {heading}
        </h1>
      </div>
      <p className="mt-3 pl-[1.75rem] text-xs tracking-[0.25em] text-navy/40">
        {subheading}
      </p>
    </FadeIn>
  );
}
