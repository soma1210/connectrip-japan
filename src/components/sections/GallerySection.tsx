import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Carousel } from "@/components/ui/Carousel";
import { GalleryCard } from "@/components/cards/GalleryCard";
import { galleryImages } from "@/data/images";

export function GallerySection() {
  const t = useTranslations("gallery");
  const items = t.raw("items") as { imageAlt: string }[];

  return (
    <section id="gallery" className="bg-navy scroll-mt-20 py-[60px] md:py-[100px]">
      <Container>
        <SectionHeading heading={t("heading")} />
        <Carousel>
          {items.map((item, index) => (
            <GalleryCard
              key={galleryImages[index]}
              image={galleryImages[index]}
              imageAlt={item.imageAlt}
            />
          ))}
        </Carousel>
      </Container>
    </section>
  );
}
