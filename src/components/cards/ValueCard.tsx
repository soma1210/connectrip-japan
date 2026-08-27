import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { FadeIn } from "@/components/ui/FadeIn";

export function ValueCard({
  number,
  title,
  description,
  image,
  delay = 0,
}: {
  number: string;
  title: string;
  description: string;
  image: string;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay} className="relative aspect-[3/2] overflow-hidden border border-gold/30 @container">
      <PlaceholderImage src={image} alt={title} sizes="(min-width: 768px) 33vw, 100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/50 to-navy-dark/10" />
      <div className="absolute inset-x-0 bottom-0 p-3 @[300px]:p-6">
        <p className="font-medium text-gold text-[clamp(0.875rem,5.5cqw,1.375rem)]">
          <span className="text-red">{number}.</span> {title}
        </p>
        <p className="mt-3 leading-relaxed text-cream/80 text-[clamp(0.6875rem,3.6cqw,0.875rem)]">{description}</p>
      </div>
    </FadeIn>
  );
}
