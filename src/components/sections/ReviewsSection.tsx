import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { ReviewCard } from "@/components/cards/ReviewCard";

type Review = {
  name: string;
  country: string;
  countryCode: string;
  date: string;
  rating: number;
  tag: string;
  quote: string;
};

export function ReviewsSection() {
  const t = useTranslations("reviews");
  const items = t.raw("items") as Review[];

  return (
    <section className="bg-navy-dark py-[60px] md:py-[100px]">
      <Container>
        <SectionHeading heading={t("heading")} />
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item, index) => (
            <ReviewCard key={item.name} {...item} delay={index * 0.08} />
          ))}
        </div>
      </Container>
    </section>
  );
}
