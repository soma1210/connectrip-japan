import { ArrowRight } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

export function BlogCard({
  title,
  description,
  image,
  imageAlt,
  href = "#gallery",
  readMore,
}: {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  href?: string;
  readMore: string;
}) {
  return (
    <div className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[calc(33.333%-11px)]">
      <div className="relative aspect-[3/2] overflow-hidden border border-gold/30">
        <PlaceholderImage src={image} alt={imageAlt} sizes="(min-width: 1024px) 33vw, 80vw" />
      </div>
      <div className="mt-4">
        <p className="text-base font-medium text-cream">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-cream/70">{description}</p>
        <div className="mt-4 border-t border-cream/15 pt-3">
          <a
            href={href}
            className="inline-flex items-center gap-2 text-xs tracking-[0.08em] text-red transition-colors hover:text-gold"
          >
            {readMore} <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
