import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Carousel } from "@/components/ui/Carousel";
import { BlogCard } from "@/components/cards/BlogCard";
import { vlogImages } from "@/data/images";

export function VlogSection() {
  const t = useTranslations("vlog");
  const posts = t.raw("posts") as {
    title: string;
    description: string;
    imageAlt: string;
  }[];

  return (
    <section className="bg-navy py-[60px] md:py-[100px]">
      <Container>
        <SectionHeading heading={t("heading")} />
        <Carousel>
          {posts.map((post, index) => (
            <BlogCard
              key={post.title}
              title={post.title}
              description={post.description}
              image={vlogImages[index]}
              imageAlt={post.imageAlt}
              readMore={t("readMore")}
            />
          ))}
        </Carousel>
      </Container>
    </section>
  );
}
