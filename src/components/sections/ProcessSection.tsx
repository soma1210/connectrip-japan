import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { CtaButton } from "@/components/ui/CtaButton";
import { ProcessItem } from "@/components/cards/ProcessItem";
import { processImages } from "@/data/images";

export function ProcessSection() {
  const t = useTranslations("process");
  const steps = t.raw("steps") as {
    number: string;
    title: string;
    description: string;
    imageAlt: string;
  }[];

  return (
    <section id="process" className="bg-navy scroll-mt-20 py-[60px] md:py-[100px]">
      <Container>
        <SectionHeading heading={t("heading")} />
        <div className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <ProcessItem
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              image={processImages[index]}
              imageAlt={step.imageAlt}
              delay={index * 0.06}
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
