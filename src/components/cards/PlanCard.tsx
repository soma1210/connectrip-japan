import { ArrowRight } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { FadeIn } from "@/components/ui/FadeIn";

export function PlanCard({
  title,
  description,
  image,
  imageAlt,
  learnMore,
  delay = 0,
}: {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  learnMore: string;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay} className="relative aspect-[3/4] overflow-hidden">
      <PlaceholderImage src={image} alt={imageAlt} sizes="(min-width: 768px) 33vw, 100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 to-navy-dark/10" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="font-heading-en text-xl tracking-wide text-gold">
          {title}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-cream/80">{description}</p>
        <a
          href="#contact"
          className="mt-5 inline-flex items-center gap-2 border-b border-red pb-1 text-xs tracking-[0.1em] text-cream transition-colors hover:text-gold"
        >
          {learnMore} <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </FadeIn>
  );
}
