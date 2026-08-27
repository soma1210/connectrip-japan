import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { CtaButton } from "@/components/ui/CtaButton";
import { FadeIn } from "@/components/ui/FadeIn";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { serviceCardImages } from "@/data/images";

export function ServiceSection() {
  const t = useTranslations("service");
  const cards = t.raw("cards") as {
    number: string;
    title: string;
    description: string;
  }[];

  return (
    <section id="service" className="bg-navy scroll-mt-20 py-12 md:py-20">
      <Container>
        <SectionHeading heading={t("heading")} />

        <FadeIn direction="none">
          <p className="whitespace-pre-line text-sm leading-loose text-cream/80">
            {t("description")}
          </p>
        </FadeIn>

        <div className="mt-14 grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 min-[810px]:grid-cols-3">
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

        <div className="mt-12 flex justify-center">
          <CtaButton href="/reservation">{t("cta")}</CtaButton>
        </div>
      </Container>
    </section>
  );
}
