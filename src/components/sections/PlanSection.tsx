import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { CtaButton } from "@/components/ui/CtaButton";
import { PlanCard } from "@/components/cards/PlanCard";
import { planImages } from "@/data/images";

export function PlanSection() {
  const t = useTranslations("plan");
  const cards = t.raw("cards") as {
    title: string;
    description: string;
    imageAlt: string;
  }[];

  return (
    <section id="plan" className="bg-navy scroll-mt-20 py-12 md:py-20">
      <Container>
        <SectionHeading heading={t("heading")} subheading={t("subheading")} />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => (
            <PlanCard
              key={card.title}
              title={card.title}
              description={card.description}
              image={planImages[index]}
              imageAlt={card.imageAlt}
              learnMore={t("learnMore")}
              delay={index * 0.08}
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
