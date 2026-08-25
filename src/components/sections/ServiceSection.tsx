import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { CtaButton } from "@/components/ui/CtaButton";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { FadeIn } from "@/components/ui/FadeIn";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { serviceImage, serviceCardImages } from "@/data/images";

export function ServiceSection() {
  const t = useTranslations("service");
  const cards = t.raw("cards") as {
    number: string;
    title: string;
    description: string;
  }[];

  return (
    <section id="service" className="bg-navy scroll-mt-20 py-[60px] md:py-[100px]">
      <Container>
        <SectionHeading heading={t("heading")} />

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <FadeIn direction="none">
            <p className="whitespace-pre-line text-sm leading-loose text-cream/80">
              {t("description")}
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="relative aspect-[4/3] overflow-hidden border border-gold/30">
            <PlaceholderImage src={serviceImage} alt={t("imageAlt")} sizes="(min-width: 1024px) 50vw, 100vw" />
          </FadeIn>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 min-[810px]:grid-cols-3">
          {cards.map((card, index) => (
            <ServiceCard
              key={card.number}
              number={card.number}
              title={card.title}
              description={card.description}
              image={serviceCardImages[index]}
              delay={(index % 3) * 0.08}
            />
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <CtaButton href="/reservation">{t("cta")}</CtaButton>
        </div>
      </Container>
    </section>
  );
}
