import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { FadeIn } from "@/components/ui/FadeIn";

export function ProcessItem({
  number,
  title,
  description,
  image,
  imageAlt,
  delay = 0,
}: {
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay} className="relative overflow-hidden border border-gold/30">
      <PlaceholderImage src={image} alt={imageAlt} sizes="100vw" />
      <div className="absolute inset-0 bg-navy-dark/70" />
      <div className="relative flex flex-col gap-3 p-6 md:flex-row md:items-center md:gap-10 md:p-10">
        <p className="shrink-0 text-lg font-medium text-gold md:w-72">
          <span className="text-red">{number}.</span> {title}
        </p>
        <p className="text-sm leading-relaxed text-cream/75 md:text-base">
          {description}
        </p>
      </div>
    </FadeIn>
  );
}
