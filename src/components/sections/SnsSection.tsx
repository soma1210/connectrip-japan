import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { SnsCard } from "@/components/cards/SnsCard";

type SnsItem = {
  platform: "tiktok" | "instagram" | "facebook" | "whatsapp";
  label: string;
  handle: string;
};

export function SnsSection() {
  const t = useTranslations("sns");
  const items = t.raw("items") as SnsItem[];

  return (
    <section className="bg-navy-dark py-[60px] md:py-[100px]">
      <Container>
        <SectionHeading heading={t("heading")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <SnsCard
              key={item.platform}
              platform={item.platform}
              label={item.label}
              handle={item.handle}
              follow={t("follow")}
              delay={index * 0.06}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
