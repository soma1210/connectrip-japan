import { Star } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { countryFlag } from "@/lib/flag";

export function ReviewCard({
  name,
  country,
  countryCode,
  date,
  rating,
  tag,
  quote,
  delay = 0,
}: {
  name: string;
  country: string;
  countryCode: string;
  date: string;
  rating: number;
  tag: string;
  quote: string;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay} className="flex h-full flex-col bg-cream p-6 text-navy">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 text-gold">
          {Array.from({ length: rating }).map((_, index) => (
            <Star key={index} className="h-4 w-4 fill-gold" />
          ))}
        </div>
        <span className="bg-cream-dark px-3 py-1 text-xs text-navy/60">{date}</span>
      </div>

      <p className="mt-6 flex-1 text-sm leading-relaxed text-navy/80">
        &ldquo;{quote}&rdquo;
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-navy/10 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy/10 font-heading-en text-navy">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium">
            {name} <span aria-hidden>{countryFlag(countryCode)}</span>
          </p>
          <p className="text-xs text-navy/50">{country}</p>
        </div>
      </div>
      <span className="mt-4 inline-block w-fit bg-red/10 px-3 py-1 text-[11px] tracking-wide text-red">
        {tag}
      </span>
    </FadeIn>
  );
}
