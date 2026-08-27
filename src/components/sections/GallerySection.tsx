import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Carousel } from "@/components/ui/Carousel";
import { GalleryCard } from "@/components/cards/GalleryCard";
import { galleryImages } from "@/data/images";
import { getGalleryItems } from "@/lib/data/gallery";

export async function GallerySection() {
  const locale = await getLocale();
  const t = await getTranslations("gallery");
  const dbItems = await getGalleryItems();

  const items =
    dbItems.length > 0
      ? dbItems.map((item) => ({
          image: item.imageUrl,
          imageAlt: locale === "en" ? item.altEn || item.altJa : item.altJa,
        }))
      : (t.raw("items") as { imageAlt: string }[]).map((item, index) => ({
          image: galleryImages[index],
          imageAlt: item.imageAlt,
        }));

  return (
    <section id="gallery" className="bg-navy scroll-mt-20 py-12 md:py-20">
      <Container>
        <SectionHeading heading={t("heading")} />
        <Carousel>
          {items.map((item) => (
            <GalleryCard key={item.image} image={item.image} imageAlt={item.imageAlt} />
          ))}
        </Carousel>
      </Container>
    </section>
  );
}
