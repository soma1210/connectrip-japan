import type { ArticleBlock, TravelGuideArticleViewModel, TravelGuideListViewModel } from "@/contracts";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { PageIntro, Section, SectionTitle, TbdBlock } from "../components/Blocks";
import { ArticleCard, ExperienceCard } from "../components/Cards";
import { CtaLink } from "../components/CtaLink";
import { TbdImage, TbdMark, TbdText } from "../components/Tbd";

export function TravelGuideListView({ vm }: { vm: TravelGuideListViewModel }) {
  const c = vm.content;
  return (
    <>
      <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="Osaka Travel Guide" />
      <Section>
        {c.categories ? (
          <div className="mb-10">
            {c.categories.status === "TBD" ? (
              <TbdMark slot="Categories" note={c.categories.note} />
            ) : null}
          </div>
        ) : null}
        {c.articles.length === 0 ? (
          <TbdBlock value={{ status: "TBD", note: "No articles yet" }} slot="Articles" />
        ) : (
          <div className="grid gap-10 md:grid-cols-3">
            {c.articles.map((item, i) => (
              <ArticleCard key={item.id} item={item} delay={i * 0.1} />
            ))}
          </div>
        )}
        <div className="mt-14 flex flex-wrap gap-4 border-t border-dashed border-gold/20 pt-10">
          {c.experiencesCta ? <CtaLink cta={c.experiencesCta} /> : null}
          {c.privateGuideCta ? <CtaLink cta={c.privateGuideCta} /> : null}
        </div>
      </Section>
    </>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2 id={block.anchorId} className="mt-6 text-2xl text-gold">{block.text}</h2>
      ) : (
        <h3 id={block.anchorId} className="mt-4 text-xl text-gold">{block.text}</h3>
      );
    case "paragraph":
      return <p className="text-base leading-loose text-cream/85">{block.text}</p>;
    case "list":
      return block.ordered ? (
        <ol className="list-decimal pl-6 text-cream/85">{block.items.map((i) => <li key={i}>{i}</li>)}</ol>
      ) : (
        <ul className="list-disc pl-6 text-cream/85">{block.items.map((i) => <li key={i}>{i}</li>)}</ul>
      );
    case "image":
      return (
        <figure>
          <div className="relative aspect-[3/2] overflow-hidden border border-gold/30">
            <PlaceholderImage src={block.image.src} alt={block.image.alt} sizes="(min-width: 768px) 720px, 100vw" />
          </div>
          {block.caption ? <figcaption className="mt-2 text-xs text-cream/60">{block.caption}</figcaption> : null}
        </figure>
      );
    case "callout":
      return <p className="border-l-2 border-gold bg-navy-dark/60 px-5 py-4 text-sm text-cream/85">{block.text}</p>;
    case "experience":
      return <ExperienceCard item={block.experience} />;
    case "privateGuide":
      return <CtaLink cta={block.cta} />;
  }
}

export function ArticleView({ vm }: { vm: TravelGuideArticleViewModel }) {
  const a = vm.content;
  return (
    <>
      <div className="relative h-[42vh] min-h-[300px] overflow-hidden border-b border-gold/30">
        <TbdImage value={a.image} slot="Article photo" priority />
      </div>
      <Section>
        <article className="mx-auto max-w-3xl">
          <p className="font-heading-en text-xs tracking-[0.3em] text-gold/80">OSAKA TRAVEL GUIDE</p>
          <TbdText value={a.title} slot="Article title" as="h1" className="mt-4 font-heading-jp text-4xl leading-tight text-cream md:text-5xl" />
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-cream/60">
            {a.author ? (a.author.status === "TBD" ? <TbdMark slot="Author" note={a.author.note} /> : null) : null}
            {a.publishedAt.status === "TBD" ? <TbdMark slot="Published date" /> : <span>{a.publishedAt.value}</span>}
          </div>
          <div className="mt-10 flex flex-col gap-6">
            {a.body.status === "TBD" ? (
              <TbdBlock value={a.body} slot="Article body" className="min-h-60" />
            ) : (
              a.body.value.map((block, i) => <Block key={i} block={block} />)
            )}
          </div>
          <div className="mt-12 flex flex-wrap gap-4 border-t border-dashed border-gold/20 pt-8">
            <CtaLink cta={a.privateGuideCta} />
            {a.experiencesCta ? <CtaLink cta={a.experiencesCta} /> : null}
          </div>
        </article>
      </Section>

      {a.relatedExperiences.length > 0 ? (
        <Section tone="navy-dark">
          <SectionTitle heading={{ status: "PROPOSED", value: "Related Experiences" }} slot="Related Experiences" />
          <div className="grid gap-6 md:grid-cols-2">
            {a.relatedExperiences.map((item) => (
              <ExperienceCard key={item.id} item={item} />
            ))}
          </div>
        </Section>
      ) : null}

      {a.relatedArticles && a.relatedArticles.length > 0 ? (
        <Section>
          <SectionTitle heading={{ status: "PROPOSED", value: "Related articles" }} slot="Related articles" />
          <div className="grid gap-8 md:grid-cols-3">
            {a.relatedArticles.map((item) => (
              <ArticleCard key={item.id} item={item} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
