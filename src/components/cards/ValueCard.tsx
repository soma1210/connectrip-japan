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
      <div className="relative min-h-[220px] overflow-hidden border-l-2 border-gold bg-navy-light @container">
        <div className="absolute inset-0">
          <PlaceholderImage src={image} alt="" sizes="(min-width: 768px) 33vw, 100vw" className="opacity-25" />
        </div>
        <div className="absolute inset-0 bg-navy-light/85" />
        <div className="relative p-3 @[300px]:p-6">
          <p className="font-medium text-cream text-[clamp(0.75rem,4.6cqw,1.125rem)]">
            <span className="text-red">{number}.</span> {title}
          </p>
          <p className="mt-3 leading-relaxed text-cream/70 text-[clamp(0.6875rem,3.6cqw,0.875rem)]">{description}</p>
        </div>
      </div>
    </FadeIn>
  );
}
