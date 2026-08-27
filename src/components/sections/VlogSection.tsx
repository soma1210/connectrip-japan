import { getLocale, getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Carousel } from "@/components/ui/Carousel";
import { BlogCard } from "@/components/cards/BlogCard";
import { vlogImages } from "@/data/images";
import { getVlogPosts } from "@/lib/data/vlog";

export async function VlogSection() {
  const locale = await getLocale();
  const t = await getTranslations("vlog");
  const dbPosts = await getVlogPosts();

  const posts =
    dbPosts.length > 0
      ? dbPosts.map((post) => ({
          key: String(post.id),
          title: locale === "en" ? post.titleEn || post.titleJa : post.titleJa,
          description:
            locale === "en" ? post.descriptionEn || post.descriptionJa : post.descriptionJa,
          image: post.imageUrl,
          imageAlt: locale === "en" ? post.altEn || post.altJa : post.altJa,
          href: post.linkUrl || "#gallery",
        }))
      : (
          t.raw("posts") as { title: string; description: string; imageAlt: string }[]
        ).map((post, index) => ({
          key: post.title,
          title: post.title,
          description: post.description,
          image: vlogImages[index],
          imageAlt: post.imageAlt,
          href: "#gallery",
        }));

  return (
    <section className="bg-navy py-[60px] md:py-[100px]">
      <Container>
        <SectionHeading heading={t("heading")} />
        <Carousel>
          {posts.map((post) => (
            <BlogCard
              key={post.key}
              title={post.title}
              description={post.description}
              image={post.image}
              imageAlt={post.imageAlt}
              href={post.href}
              readMore={t("readMore")}
            />
          ))}
        </Carousel>
      </Container>
    </section>
  );
}
