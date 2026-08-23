import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { FadeIn } from "@/components/ui/FadeIn";

export function ServiceCard({
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
    <FadeIn delay={delay} className="relative aspect-[4/3] overflow-hidden">
      <PlaceholderImage src={image} alt={title} sizes="(min-width: 768px) 33vw, 100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/50 to-navy-dark/10" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="border-b border-red pb-1 text-base font-medium text-cream">
          <span className="text-red">{number}.</span>
          {title}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-cream/80">{description}</p>
      </div>
    </FadeIn>
  );
}
