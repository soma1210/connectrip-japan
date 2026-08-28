import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { CtaButton } from "@/components/ui/CtaButton";
import { ValueCard } from "@/components/cards/ValueCard";
import { valueCardImages } from "@/data/images";

export function ValueSection() {
  const t = useTranslations("value");
  const cards = t.raw("cards") as {
    number: string;
    title: string;
    description: string;
  }[];

  return (
    <section id="value" className="bg-navy-dark scroll-mt-20 py-12 md:py-20">
      <Container>
        <SectionHeading heading={t("heading")} subheading={t("subheading")} />
        <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 min-[810px]:grid-cols-3">
          {cards.map((card, index) => (
            <ValueCard
              key={card.number}
              number={card.number}
              title={card.title}
              description={card.description}
              image={valueCardImages[index]}
              delay={(index % 3) * 0.08}
            />
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <CtaButton href="/reservation" ctaId="home_value_reserve" ctaPosition="section">
            {t("cta")}
          </CtaButton>
        </div>
      </Container>
    </section>
  );
}
