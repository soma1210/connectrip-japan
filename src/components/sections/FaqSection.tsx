import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

export function FaqSection() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { question: string; answer: string }[];

  return (
    <section id="faq" className="bg-navy-dark scroll-mt-20 py-12 md:py-20">
      <Container>
        <SectionHeading heading={t("heading")} subheading={t("subheading")} />
        <FaqAccordion items={items} />
      </Container>
    </section>
  );
}
