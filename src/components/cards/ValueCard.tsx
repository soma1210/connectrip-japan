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
    <FadeIn delay={delay}>
      <div className="relative min-h-[220px] overflow-hidden border-l-2 border-gold bg-navy-light">
        <div className="absolute inset-0">
          <PlaceholderImage src={image} alt="" sizes="(min-width: 768px) 33vw, 100vw" className="opacity-25" />
        </div>
        <div className="absolute inset-0 bg-navy-light/85" />
        <div className="relative p-6">
          <p className="text-base font-medium text-cream">
            <span className="text-red">{number}.</span> {title}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">{description}</p>
        </div>
      </div>
    </FadeIn>
  );
}
