import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { IssueCard } from "@/components/cards/IssueCard";
import { issueImages } from "@/data/images";

export function IssuesSection() {
  const t = useTranslations("issues");
  const items = t.raw("items") as { title: string; imageAlt: string }[];

  return (
    <section className="bg-navy-dark py-12 md:py-20">
      <Container>
        <SectionHeading heading={t("heading")} subheading={t("subheading")} />
        <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 min-[810px]:grid-cols-3">
          {items.map((item, index) => (
            <IssueCard
              key={item.title}
              title={item.title}
              image={issueImages[index]}
              imageAlt={item.imageAlt}
              delay={(index % 3) * 0.08}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
