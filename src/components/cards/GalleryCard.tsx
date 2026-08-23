import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

export function GalleryCard({ image, imageAlt }: { image: string; imageAlt: string }) {
  return (
    <div className="relative aspect-[4/3] w-[85%] shrink-0 snap-start overflow-hidden sm:w-[45%] lg:w-[calc(33.333%-11px)]">
      <PlaceholderImage src={image} alt={imageAlt} sizes="(min-width: 1024px) 33vw, 80vw" />
    </div>
  );
}
