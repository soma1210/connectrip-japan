import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { ReviewCard } from "@/components/cards/ReviewCard";
import { getReviews } from "@/lib/data/reviews";

type Review = {
  name: string;
  country: string;
  countryCode: string;
  date: string;
  rating: number;
  tag: string;
  quote: string;
};

export async function ReviewsSection() {
  const locale = await getLocale();
  const t = await getTranslations("reviews");
  const dbReviews = await getReviews();

  const items: Review[] =
    dbReviews.length > 0
      ? dbReviews.map((review) => ({
          name: review.name,
          country: review.country,
          countryCode: review.countryCode,
          date: review.reviewDate,
          rating: review.rating,
          tag: review.tag,
          quote: locale === "en" ? review.quoteEn || review.quoteJa : review.quoteJa,
        }))
      : (t.raw("items") as Review[]);

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
