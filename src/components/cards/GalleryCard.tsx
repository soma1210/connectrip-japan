import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

export function GalleryCard({ image, imageAlt }: { image: string; imageAlt: string }) {
  return (
    <div className="relative aspect-[4/3] w-64 shrink-0 overflow-hidden border border-gold/30 sm:w-80 lg:w-96">
      <PlaceholderImage src={image} alt={imageAlt} sizes="384px" />
    </div>
  );
}
