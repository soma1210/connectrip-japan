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
    <section id="value" className="bg-navy-dark scroll-mt-20 py-[60px] md:py-[100px]">
      <Container>
        <SectionHeading heading={t("heading")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-14 flex justify-center">
          <CtaButton href="#contact">{t("cta")}</CtaButton>
        </div>
      </Container>
    </section>
  );
}
