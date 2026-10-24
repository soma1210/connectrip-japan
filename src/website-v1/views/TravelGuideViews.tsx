import type { ArticleBlock, TravelGuideArticleViewModel, TravelGuideListViewModel } from "@/contracts";
import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { PageIntro, Section, SectionTitle, TbdBlock } from "../components/Blocks";
import { ArticleCard, ExperienceCard } from "../components/Cards";
import { ArticleGroup } from "../components/guide/ArticleGroup";
import { CtaLink } from "../components/CtaLink";
import {
  Breadcrumb,
  Byline,
  EventCard,
  Faq,
  LocalInsightCard,
  PreviewNotice,
  QuickAnswer,
  RecentlyEnded,
  Sources,
  SpotCard,
  StatusBanner,
  Toc,
} from "../components/guide/GuideParts";
import { TbdImage, TbdMark, TbdText } from "../components/Tbd";

/** Osaka Travel Guide hub: Latest in Osaka (fresh) and Explore Osaka (evergreen). */
export function TravelGuideListView({ vm }: { vm: TravelGuideListViewModel }) {
  const c = vm.content;
  const groups = c.groups ?? [];
  return (
    <>
      <div className="bg-navy pt-6">
        <Container>
          <Breadcrumb items={vm.seo.breadcrumb} />
        </Container>
      </div>
      <PageIntro headline={c.intro.headline} supporting={c.intro.supporting} slot="Osaka Travel Guide" />
      <Section>
        <div className="flex flex-col gap-14 md:gap-20">
          {groups.length === 0 ? <TbdBlock value={{ status: "TBD", note: "No articles yet" }} slot="Articles" /> : null}
          {groups.map((group) => (
            // Latest / Explore always show (with an empty note); preview-only only when it has items.
            <ArticleGroup key={group.key} group={group} showEmpty={group.key !== "previewOnly"} />
          ))}
        </div>
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
        <h2 id={block.anchorId} className="mt-6 scroll-mt-28 text-2xl text-gold">{block.text}</h2>
      ) : (
        <h3 id={block.anchorId} className="mt-4 scroll-mt-28 text-xl text-gold">{block.text}</h3>
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
          {block.caption || block.image.assetRights?.credit ? (
            <figcaption className="mt-2 text-xs text-cream/60">
              {[block.caption, block.image.assetRights?.credit].filter(Boolean).join(" · ")}
            </figcaption>
          ) : null}
        </figure>
      );
    case "callout":
      return <p className="border-l-2 border-gold bg-navy-dark/60 px-5 py-4 text-sm text-cream/85">{block.text}</p>;
    case "experience":
      return <ExperienceCard item={block.experience} />;
    case "privateGuide":
      return <CtaLink cta={block.cta} />;
    case "event":
      return <EventCard block={block} />;
    case "spot":
      return <SpotCard block={block} />;
    case "localInsight":
      return <LocalInsightCard block={block} />;
  }
}

/** Private Guide at the end of the article: soft (one line) or standard (panel). */
function PrivateGuideNext({ vm }: { vm: TravelGuideArticleViewModel }) {
  const a = vm.content;
  const intensity = a.guide?.privateGuide.intensity ?? "standard";
  const angle = a.guide?.privateGuide.angle;
  if (intensity === "soft") {
    return (
      <Section tone="navy-dark" className="py-10! md:py-14!">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          {angle ? <p className="text-sm leading-relaxed text-cream/80 md:text-base">{angle}</p> : <TbdMark slot="Private Guide line" />}
          <CtaLink cta={a.privateGuideCta} variant="text" className="shrink-0" />
        </div>
      </Section>
    );
  }
  return (
    <Section tone="navy-dark">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 border border-gold/40 p-6 md:p-10">
        {angle ? <p className="text-lg leading-relaxed text-cream">{angle}</p> : <TbdMark slot="Private Guide copy" />}
        <div className="flex flex-wrap gap-4">
          <CtaLink cta={a.privateGuideCta} />
          {a.experiencesCta ? <CtaLink cta={a.experiencesCta} /> : null}
        </div>
      </div>
    </Section>
  );
}

/**
 * Article template (Content Platform §4.1): breadcrumb → H1 → quick answer →
 * byline → period banner → hero → contents → body → recently ended → FAQ →
 * sources → related articles (other pillar first) → related experiences →
 * Private Guide.
 */
export function ArticleView({ vm }: { vm: TravelGuideArticleViewModel }) {
  const a = vm.content;
  const g = a.guide;
  const readingMinutes = a.readingMinutes && a.readingMinutes.status !== "TBD" ? a.readingMinutes.value : undefined;
  const category = a.category && a.category.status !== "TBD" && a.category.value.label.status !== "TBD" ? a.category.value.label.value : undefined;

  return (
    <>
      <Section className="pt-8! md:pt-12!">
        <article className="mx-auto flex max-w-3xl flex-col gap-8">
          <header className="flex flex-col gap-5">
            <Breadcrumb items={vm.seo.breadcrumb} />
            {g ? <PreviewNotice guide={g} flags={a.previewFlags} /> : null}
            <p className="font-heading-en text-xs tracking-[0.3em] text-gold/80">
              OSAKA TRAVEL GUIDE{category ? ` · ${category.toUpperCase()}` : ""}
            </p>
            <TbdText value={a.title} slot="Article title" as="h1" className="font-heading-jp text-3xl leading-tight text-cream md:text-5xl" />
            {g ? <QuickAnswer text={g.quickAnswer} /> : null}
            {g ? (
              <Byline guide={g} readingMinutes={readingMinutes} />
            ) : a.publishedAt.status === "TBD" ? (
              <TbdMark slot="Published date" />
            ) : (
              <span className="text-xs text-cream/60">{a.publishedAt.value}</span>
            )}
            {g ? <StatusBanner guide={g} /> : null}
          </header>

          <figure>
            <div className="relative aspect-[16/9] overflow-hidden border border-gold/30">
              <TbdImage value={a.image} slot="Article photo" priority sizes="(min-width: 768px) 768px, 100vw" />
            </div>
            {g?.heroCredit ? <figcaption className="mt-2 text-xs text-cream/55">{g.heroCredit}</figcaption> : null}
          </figure>

          {g ? <Toc items={g.toc} /> : null}

          <div className="flex flex-col gap-6">
            {a.body.status === "TBD" ? (
              <TbdBlock value={a.body} slot="Article body" className="min-h-60" />
            ) : (
              a.body.value.map((block, i) => <Block key={i} block={block} />)
            )}
          </div>

          {g ? (
            <>
              <RecentlyEnded events={g.endedEvents} />
              <Faq items={g.faq} />
              <Sources sources={g.sources} />
            </>
          ) : null}
        </article>
      </Section>

      {/* Related articles across both pillars, then products, then Private Guide. */}
      {g && g.relatedGroups.length > 0 ? (
        <Section>
          <div className="flex flex-col gap-12">
            {g.relatedGroups.map((group) => (
              <ArticleGroup key={group.key} group={group} />
            ))}
          </div>
        </Section>
      ) : a.relatedArticles && a.relatedArticles.length > 0 ? (
        <Section>
          <SectionTitle heading={{ status: "PROPOSED", value: "Related guides" }} slot="Related guides" />
          <div className="grid gap-8 md:grid-cols-3">
            {a.relatedArticles.map((item) => (
              <ArticleCard key={item.id} item={item} />
            ))}
          </div>
        </Section>
      ) : null}

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

      <PrivateGuideNext vm={vm} />
    </>
  );
}
