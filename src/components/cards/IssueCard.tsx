import { Check } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { FadeIn } from "@/components/ui/FadeIn";

export function IssueCard({
  title,
  image,
  imageAlt,
  delay = 0,
}: {
  title: string;
  image: string;
  imageAlt: string;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay} className="relative aspect-[4/3] overflow-hidden border border-gold/30 @container">
      <PlaceholderImage src={image} alt={imageAlt} sizes="(min-width: 768px) 33vw, 100vw" />
      <div className="absolute inset-0 bg-navy-dark/55" />
      <div className="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-cream/60">
        <Check className="h-4 w-4 text-cream" />
      </div>
      <p className="absolute bottom-6 left-5 right-5 whitespace-pre-line font-medium text-cream text-[clamp(0.75rem,6cqw,1.25rem)] [text-shadow:0_2px_6px_rgba(0,0,0,0.65)]">
        {title}
      </p>
    </FadeIn>
  );
}
