import type { ReactNode } from "react";
import type { Tbd } from "@/contracts";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { TbdMark, TbdText } from "./Tbd";

/** Section shell with the current site's spacing and container. */
export function Section({
  id,
  children,
  className,
  tone = "navy",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "navy" | "navy-dark";
}) {
  return (
    <section id={id} className={cn("py-14 md:py-24", tone === "navy-dark" ? "bg-navy-dark" : "bg-navy", className)}>
      <Container>{children}</Container>
    </section>
  );
}

/**
 * Section title. Reuses the current site's `SectionHeading` when the heading
 * has a value, and shows a TBD placeholder in the same position otherwise.
 */
export function SectionTitle({
  heading,
  supporting,
  slot,
  as = "h2",
}: {
  heading: Tbd<string>;
  supporting?: Tbd<string>;
  slot: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8 md:mb-12">
      {heading.status === "TBD" ? (
        <FadeIn className="mt-6 md:mt-14">
          <TbdText value={heading} slot={`${slot} heading`} as={as} className="ml-6 md:ml-10" />
        </FadeIn>
      ) : (
        <SectionHeading heading={heading.value} headingLevel={as} className="mb-0! md:mb-0!" />
      )}
      {supporting ? (
        <FadeIn className="mt-4">
          <TbdText value={supporting} slot={`${slot} supporting copy`} as="p" className="max-w-2xl text-sm leading-relaxed text-cream/75 md:text-base" />
        </FadeIn>
      ) : null}
    </div>
  );
}

/** Top block of an inner page. */
export function PageIntro({ headline, supporting, slot }: { headline: Tbd<string>; supporting: Tbd<string>; slot: string }) {
  return (
    <div className="border-b border-dashed border-gold/20 bg-navy pt-6 pb-4 md:pt-10 md:pb-8">
      <Container>
        <SectionTitle heading={headline} supporting={supporting} slot={slot} as="h1" />
      </Container>
    </div>
  );
}

/** A whole list / block that is still TBD. */
export function TbdBlock({ value, slot, className }: { value: { status: "TBD"; note?: string }; slot: string; className?: string }) {
  return (
    <div className={cn("flex min-h-28 items-center justify-center border border-dashed border-gold/30 bg-navy-dark/40 p-6 text-center", className)}>
      <TbdMark slot={slot} note={value.note} />
    </div>
  );
}

/** Small key / value line used for experience facts. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-cream/15 pt-3">
      <span className="font-heading-en text-[11px] tracking-[0.15em] text-cream/50 italic">{label}</span>
      <span className="text-sm text-cream/85">{children}</span>
    </div>
  );
}
