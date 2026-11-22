import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Camera, ChevronDown, ExternalLink, MapPin } from "lucide-react";
import { businessInfo } from "@/data/business-info";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import type { SelectMapContent } from "@/contracts";
import { CtaLink } from "../components/CtaLink";
import { formatIsoDate } from "../components/format";
import { LazySelectMap } from "../components/select/LazySelectMap";
import { V1_PREVIEW } from "../config";
import {
  AREA_INFO,
  EXPLORE_AREAS,
  EXPLORE_COPY,
  FEATURED_TOUR_SPOTS,
  STATUS_LABEL,
  areaName,
  articleHref,
  articleSpotIds,
  categoryOf,
  currencyOf,
  isReviewOverdue,
  publishProblems,
  relatedArticles,
  selectSpotSectionHref,
  type CtaTarget,
  type EditorialRow,
  type ExploreArea,
  type ExploreArticle,
  type GuideImage,
  type GuidePlace,
  type SelectArticle,
  type SelectSpotText,
  type Source,
  type UpdateArticle,
} from "../content/explore";
import { itineraryWithSpot } from "../content/explore/links";
import { FEATURED_TOUR_SLUG } from "../content/featuredTour";
import { getArticleMapContent } from "../content/select/osaka";
import { cta, proposed } from "../content/shared";
import { displayPhoto, spotById, type Spot } from "../content/spots";
import { articleSources, type Crumb } from "../exploreSeo";
import { exploreAreaHref, exploreEditorialPolicyHref, exploreHref, exploreSelectHref, exploreUpdatesHref, experienceHref, routeHref } from "../routes";

/**
 * Explore Kansai screens (preview only). Navy and gold like the rest of v1;
 * long text at 16–17 px with relaxed leading, a 3xl reading column, and a
 * sticky contents list beside it on large screens. Select articles wear a
 * solid gold label, Travel Updates an outlined one.
 */

const COPY_SOURCE = "Explore Kansai brief 2026-11-14";
const PRIVATE_GUIDE_CTA = cta("v1_explore_private_guide", "privateGuide", routeHref("privateGuide"), "section", "primary", proposed(EXPLORE_COPY.cta.label, COPY_SOURCE));
const TOUR_CTA = cta("v1_explore_featured_tour", "experiences", experienceHref(FEATURED_TOUR_SLUG), "section", "primary", proposed(EXPLORE_COPY.tourCta.label, COPY_SOURCE));
const PRIVATE_GUIDE_TEXT_CTA = cta("v1_explore_private_guide_alt", "privateGuide", routeHref("privateGuide"), "section", "secondary", proposed("Or plan a private day with a guide", COPY_SOURCE));
const mapHref = (spot?: Spot) => (spot ? `${routeHref("connectripSelect")}?spot=${spot.slug}` : routeHref("connectripSelect"));

const LINK = "text-cream/80 underline decoration-gold/50 underline-offset-4 hover:text-gold";
const H2 = "font-heading-en text-2xl text-cream md:text-3xl";
const BODY = "text-base leading-relaxed text-cream/85 md:text-[17px]";

// --- Shared pieces ---------------------------------------------------------------

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-cream/55">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex min-w-0 items-center gap-2">
            {i > 0 ? (
              <span aria-hidden className="text-gold/50">
                ›
              </span>
            ) : null}
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="line-clamp-1 text-cream/80">
                {c.name}
              </span>
            ) : (
              <Link href={c.href} className="hover:text-gold">
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SeriesLabel({ article }: { article: ExploreArticle }) {
  if (article.kind === "select") {
    return <span className="inline-block bg-gold px-2.5 py-1 font-heading-en text-[10px] tracking-[0.18em] text-navy uppercase">{EXPLORE_COPY.select.label}</span>;
  }
  return <span className="inline-block border border-cream/50 px-2.5 py-1 font-heading-en text-[10px] tracking-[0.18em] text-cream uppercase">Travel Update</span>;
}

/** Series · category · area (and "Past information" for an update that is no longer current). */
function ArticleLabels({ article }: { article: ExploreArticle }) {
  const past = article.kind === "update" && currencyOf(article) !== "current";
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <SeriesLabel article={article} />
      <span className="font-heading-en text-[11px] tracking-[0.16em] text-gold/90 uppercase">{categoryOf(article)}</span>
      <span className="inline-flex items-center gap-1 text-[11px] tracking-[0.12em] text-cream/60 uppercase">
        <MapPin className="h-3 w-3" aria-hidden />
        {article.kind === "select" && article.areaLabel ? article.areaLabel : areaName(article.area)}
      </span>
      {past ? <span className="bg-cream/15 px-2.5 py-1 font-heading-en text-[10px] tracking-[0.18em] text-cream/80 uppercase">Past information</span> : null}
    </span>
  );
}

/** Reviewers only: editorial state, what blocks publication, review deadline, open items. */
function PreviewEditorialNote({ article }: { article: ExploreArticle }) {
  if (!V1_PREVIEW) return null;
  const problems = publishProblems(article);
  const notes = article.kind === "select" ? article.editorialNotes : [];
  const overdue = article.kind === "select" && isReviewOverdue(article);
  return (
    <aside className="mt-6 border border-dashed border-gold/50 bg-navy-dark/60 px-4 py-3 text-xs leading-relaxed text-gold/85">
      <p className="font-heading-en tracking-[0.12em] uppercase">
        Preview only · {STATUS_LABEL[article.status]}
        {article.status === "published" ? "" : " · not published"}
      </p>
      {article.kind === "select" ? (
        <p className={overdue ? "mt-1 text-red-300" : "mt-1 text-cream/60"}>
          Last reviewed {formatIsoDate(article.lastReviewedAt)} · next review due {formatIsoDate(article.nextReviewDue)}
          {overdue ? " · REVIEW OVERDUE" : ""}
        </p>
      ) : null}
      {problems.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-cream/70">{problems.length} item(s) block publication</summary>
          <ul className="mt-1 list-disc pl-4 text-cream/70">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </details>
      ) : null}
      {notes.length > 0 ? (
        <ul className="mt-2 list-disc pl-4 text-cream/60">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function Dates({ article }: { article: ExploreArticle }) {
  const rows: [string, string | undefined][] = [
    ["Published", article.publishedAt],
    ["Updated", article.publishedAt || V1_PREVIEW ? article.updatedAt : undefined],
    [article.kind === "update" ? "Last verified" : "Information checked", article.verifiedAt],
  ];
  if (article.kind === "update" && article.validity) {
    if (article.validity.validFrom) rows.push(["Valid from", article.validity.validFrom]);
    if (article.validity.type === "until") rows.push(["Valid until", article.validity.validUntil]);
  }
  const shown = rows.filter((r): r is [string, string] => Boolean(r[1]));
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-gold/25 pb-6 text-sm text-cream/60">
      <span>
        By{" "}
        <a href="#about-this-guide" className="text-cream/85 hover:text-gold">
          {EXPLORE_COPY.author.name}
        </a>
      </span>
      {shown.length > 0 ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-1">
          {shown.map(([label, date]) => (
            <div key={label} className="flex gap-1.5">
              <dt>{label}</dt>
              <dd className="text-cream/85">
                <time dateTime={date}>{formatIsoDate(date)}</time>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function SourceLink({ name, url }: Source) {
  return (
    <a href={url} target="_blank" rel="noreferrer noopener" className={cn("inline-flex items-center gap-1.5", LINK)}>
      {name}
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
    </a>
  );
}

/**
 * A "guide" article photo, under the same rules as SpotPhoto: rights-confirmed
 * photos anywhere, unverified ones in the preview only (marked), a quiet
 * placeholder in the preview when there is none.
 */
function GuidePhoto({ image, label, priority, sizes = "(min-width: 768px) 768px, 100vw", className }: { image?: GuideImage; label: string; priority?: boolean; sizes?: string; className?: string }) {
  if (image && (image.rightsConfirmed || V1_PREVIEW)) {
    return (
      <figure className={cn("relative overflow-hidden rounded-lg border border-gold/20 bg-navy", className)}>
        <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} className="object-cover" style={image.position ? { objectPosition: image.position } : undefined} />
        {!image.rightsConfirmed ? <figcaption className="absolute top-2 left-2 bg-navy-dark/85 px-2 py-0.5 text-[10px] tracking-wide text-gold/90">Preview · rights not verified</figcaption> : null}
      </figure>
    );
  }
  if (!V1_PREVIEW) return null;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gold/35 bg-[linear-gradient(135deg,rgba(201,164,92,0.10),rgba(10,10,10,0.0))] px-6 text-center", className)}>
      <Camera className="h-5 w-5 text-gold/70" aria-hidden />
      <p className="font-heading-en text-sm text-cream/75">{label}</p>
      <p className="text-[11px] tracking-wide text-gold/75">Preview · photo to come (own or rights-cleared)</p>
    </div>
  );
}

/**
 * A spot photo. Rights-confirmed photos anywhere; unverified ones in the
 * preview only, marked. No photo: a quiet placeholder in the preview, nothing
 * in public mode.
 */
function SpotPhoto({ spot, priority, sizes = "(min-width: 768px) 768px, 100vw", className, allowNatural }: { spot: Spot; priority?: boolean; sizes?: string; className?: string; allowNatural?: boolean }) {
  const photo = displayPhoto(spot);
  if (photo) {
    // Portrait photos marked `frame: "natural"`: the whole picture at its own ratio, centred, at most 440px wide.
    const natural = allowNatural && photo.frame === "natural";
    return (
      <figure
        className={cn("relative overflow-hidden rounded-lg border border-gold/20 bg-navy", className, natural && "mx-auto w-full max-w-[440px]")}
        style={natural ? { aspectRatio: `${photo.width} / ${photo.height}` } : undefined}
      >
        <Image src={photo.src} alt={photo.alt} fill sizes={natural ? "(min-width: 480px) 440px, 100vw" : sizes} priority={priority} className="object-cover" style={photo.position ? { objectPosition: photo.position } : undefined} />
        {photo.unverified ? <figcaption className="absolute top-2 left-2 bg-navy-dark/85 px-2 py-0.5 text-[10px] tracking-wide text-gold/90">Preview · rights not verified</figcaption> : null}
      </figure>
    );
  }
  if (!V1_PREVIEW) return null;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gold/35 bg-[linear-gradient(135deg,rgba(201,164,92,0.10),rgba(10,10,10,0.0))] px-6 text-center", className)}>
      <Camera className="h-5 w-5 text-gold/70" aria-hidden />
      <p className="font-heading-en text-sm text-cream/75">{spot.name}</p>
      <p className="text-[11px] tracking-wide text-gold/75">Preview · photo to come (own or rights-cleared)</p>
    </div>
  );
}

// --- Cards and lists ---------------------------------------------------------------

function cardDate(a: ExploreArticle): string | null {
  if (a.publishedAt) return formatIsoDate(a.publishedAt);
  return V1_PREVIEW ? `${STATUS_LABEL[a.status]} · updated ${formatIsoDate(a.updatedAt ?? "")}` : null;
}

function cardSpot(a: ExploreArticle): Spot | undefined {
  if (a.kind !== "select") return undefined;
  const ids = articleSpotIds(a);
  if (ids.length === 0) return undefined;
  return ids.map(spotById).find((s) => displayPhoto(s)) ?? spotById(ids[0]);
}

/** One count line under the title: "10 places" / "4 stops". */
function cardCount(a: ExploreArticle): string | null {
  if (a.kind !== "select") return null;
  if (a.content.type === "guide") return `${a.content.places.length} places`;
  const n = articleSpotIds(a).length;
  return a.content.type === "spots" ? `${n} places` : `${n} stops`;
}

export function ArticleCard({ article, headingLevel = "h3" }: { article: ExploreArticle; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  const date = cardDate(article);
  const spot = cardSpot(article);
  const count = cardCount(article);
  return (
    <li className="flex">
      <Link
        href={articleHref(article)}
        className="group flex w-full flex-col overflow-hidden rounded-xl border border-gold/30 bg-navy-dark/50 transition-colors hover:border-gold/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {spot ? <SpotPhoto spot={spot} sizes="(min-width: 768px) 480px, 100vw" className="aspect-[16/9] rounded-none border-0 border-b border-gold/20" /> : null}
        {article.kind === "select" && article.content.type === "guide" ? (
          <GuidePhoto image={article.content.hero} label={article.title} sizes="(min-width: 768px) 480px, 100vw" className="aspect-[16/9] rounded-none border-0 border-b border-gold/20" />
        ) : null}
        <span className="flex flex-1 flex-col gap-3 p-6 md:p-7">
          <ArticleLabels article={article} />
          <H className="font-heading-en text-xl leading-snug text-cream group-hover:text-gold md:text-2xl">{article.title}</H>
          <p className="text-sm leading-relaxed text-cream/75">{article.summary}</p>
          <span className="mt-auto flex items-center justify-between gap-3 pt-2 text-xs text-cream/50">
            <span>{[count, date].filter(Boolean).join(" · ")}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-gold transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </Link>
    </li>
  );
}

function MapCard({ area = "osaka" }: { area?: ExploreArea }) {
  const href = AREA_INFO[area].mapHref;
  if (!href) return null;
  return (
    <li className="flex">
      <Link
        href={href}
        className="group flex w-full flex-col gap-3 rounded-xl border border-gold/30 bg-navy-dark/50 p-6 transition-colors hover:border-gold/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:p-7"
      >
        <span className="inline-flex w-fit items-center gap-1.5 bg-gold px-2.5 py-1 font-heading-en text-[10px] tracking-[0.18em] text-navy uppercase">
          <MapPin className="h-3 w-3" aria-hidden /> Map
        </span>
        <h3 className="font-heading-en text-xl leading-snug text-cream group-hover:text-gold md:text-2xl">{EXPLORE_COPY.map.label}</h3>
        <p className="text-sm leading-relaxed text-cream/75">{EXPLORE_COPY.map.description}</p>
        <span className="mt-auto flex justify-end pt-2">
          <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>
    </li>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-cream/15 px-6 py-8 text-center text-sm leading-relaxed text-cream/70">{children}</p>;
}

function GuideCta() {
  return (
    <section aria-label={EXPLORE_COPY.cta.label} className="mt-14 rounded-xl border border-gold/40 bg-navy px-6 py-8 text-center md:px-10">
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-cream/80">{EXPLORE_COPY.cta.supporting}</p>
      <div className="mt-5 flex justify-center">
        <CtaLink cta={PRIVATE_GUIDE_CTA} />
      </div>
    </section>
  );
}

/** Booking CTA chosen by the article (links only; booking itself is unchanged). */
function ArticleCta({ target }: { target: CtaTarget }) {
  if (target === "privateGuide") return <GuideCta />;
  const t = EXPLORE_COPY.tourCta;
  return (
    <section aria-label={t.label} className="mt-14 rounded-xl border border-gold/40 bg-navy px-6 py-8 text-center md:px-10">
      <p className="font-heading-en text-[11px] tracking-[0.2em] text-gold uppercase">{t.eyebrow}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-cream/80">{t.supporting}</p>
      <div className="mt-5 flex flex-col items-center gap-4">
        <CtaLink cta={TOUR_CTA} />
        <CtaLink cta={PRIVATE_GUIDE_TEXT_CTA} variant="text" />
      </div>
    </section>
  );
}

function PageShell({ children, crumbs }: { children: ReactNode; crumbs: Crumb[] }) {
  return (
    <div className="bg-navy-dark py-10 text-cream md:py-14">
      <Container className="max-w-5xl">
        <Breadcrumbs crumbs={crumbs} />
        {children}
      </Container>
    </div>
  );
}

function PageHeader({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro: string; children?: ReactNode }) {
  return (
    <header className="mt-8 max-w-3xl">
      {eyebrow ? <p className="font-heading-en text-xs tracking-[0.25em] text-gold/80 uppercase">{eyebrow}</p> : null}
      <h1 className={cn("font-heading-en text-4xl text-cream md:text-5xl", eyebrow && "mt-2")}>{title}</h1>
      <p className="mt-4 text-base leading-relaxed text-cream/80 md:text-lg">{intro}</p>
      {children}
    </header>
  );
}

function SectionHead({ id, title, description, href, linkLabel }: { id: string; title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-col gap-3 border-b border-gold/25 pb-5 md:flex-row md:items-end md:justify-between md:gap-10">
      <div className="max-w-2xl">
        <h2 id={id} className={H2}>
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm leading-relaxed text-cream/70">{description}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link href={href} className="inline-flex shrink-0 items-center gap-2 text-sm text-gold hover:text-cream">
          {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function CardGrid({ articles, headingLevel, extra }: { articles: ExploreArticle[]; headingLevel?: "h2" | "h3"; extra?: ReactNode }) {
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {articles.map((a) => (
        <ArticleCard key={a.slug} article={a} headingLevel={headingLevel} />
      ))}
      {extra}
    </ul>
  );
}

function PastUpdates({ past }: { past: UpdateArticle[] }) {
  if (past.length === 0) return null;
  return (
    <section aria-labelledby="past-updates" className="mt-14">
      <h2 id="past-updates" className="font-heading-en text-xl text-cream/80">
        {EXPLORE_COPY.updates.pastLabel}
      </h2>
      <p className="mt-2 text-sm text-cream/60">{EXPLORE_COPY.updates.pastNotice}</p>
      <div className="mt-5 opacity-80">
        <CardGrid articles={past} />
      </div>
    </section>
  );
}

// --- Filters ---------------------------------------------------------------------------

export type FilterGroup = { label: string; param: string; current?: string; options: { value: string; label: string }[] };

/**
 * Filter chips as plain links (`?area=kyoto&topic=…`): they work without
 * JavaScript, keep the other filter, and the list keeps one canonical URL.
 * Area pages (/explore/area/…) are the indexable per-area views.
 */
function FilterBar({ baseHref, groups }: { baseHref: string; groups: FilterGroup[] }) {
  const hrefWith = (param: string, value?: string) => {
    const q = new URLSearchParams();
    for (const g of groups) {
      const v = g.param === param ? value : g.current;
      if (v) q.set(g.param, v);
    }
    const s = q.toString();
    return s ? `${baseHref}?${s}` : baseHref;
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-9 items-center border px-3.5 py-1.5 text-xs tracking-wide whitespace-nowrap transition-colors",
      active ? "border-gold bg-gold text-navy" : "border-cream/25 text-cream/75 hover:border-gold/70 hover:text-gold",
    );
  return (
    <div className="mt-8 flex flex-col gap-4 border-y border-gold/20 py-5">
      {groups.map((g) => (
        <nav key={g.param} aria-label={`Filter by ${g.label.toLowerCase()}`} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="w-20 shrink-0 font-heading-en text-[11px] tracking-[0.2em] text-cream/50 uppercase">{g.label}</span>
          <ul className="flex min-w-0 flex-wrap gap-2">
            <li>
              <Link href={hrefWith(g.param)} className={chip(!g.current)} aria-current={!g.current ? "true" : undefined} scroll={false}>
                All
              </Link>
            </li>
            {g.options.map((o) => (
              <li key={o.value}>
                <Link href={hrefWith(g.param, o.value)} className={chip(g.current === o.value)} aria-current={g.current === o.value ? "true" : undefined} scroll={false}>
                  {o.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}

export const AREA_OPTIONS = EXPLORE_AREAS.map((a) => ({ value: a, label: AREA_INFO[a].name }));

function ResultCount({ shown, total }: { shown: number; total: number }) {
  return (
    <p className="mt-6 text-xs text-cream/50" aria-live="polite">
      {shown === total ? `${total} ${total === 1 ? "article" : "articles"}` : `${shown} of ${total} articles`}
    </p>
  );
}

// --- Hub, lists and area pages -----------------------------------------------------

function AreaNav({ counts, current }: { counts: Record<ExploreArea, number>; current?: ExploreArea }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {EXPLORE_AREAS.filter((a) => a !== current).map((a) => (
        <li key={a} className="flex">
          <Link href={exploreAreaHref(a)} className="group flex w-full flex-col gap-1 rounded-xl border border-gold/25 px-5 py-4 transition-colors hover:border-gold/70">
            <span className="font-heading-en text-lg text-cream group-hover:text-gold">{AREA_INFO[a].name}</span>
            <span className="text-xs text-cream/55">{counts[a] > 0 ? `${counts[a]} ${counts[a] === 1 ? "guide" : "guides"}` : "Guides coming soon"}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ExploreHubView({
  crumbs,
  select,
  updates,
  areaCounts,
}: {
  crumbs: Crumb[];
  select: SelectArticle[];
  updates: { current: UpdateArticle[]; past: UpdateArticle[] };
  areaCounts: Record<ExploreArea, number>;
}) {
  return (
    <PageShell crumbs={crumbs}>
      <PageHeader title={EXPLORE_COPY.title} intro={EXPLORE_COPY.intro} />

      <section aria-labelledby="explore-areas" className="mt-12">
        <h2 id="explore-areas" className="font-heading-en text-sm tracking-[0.2em] text-gold uppercase">
          Explore by area
        </h2>
        <div className="mt-4">
          <AreaNav counts={areaCounts} />
        </div>
      </section>

      <section aria-labelledby="explore-select" className="mt-14">
        <SectionHead id="explore-select" title={EXPLORE_COPY.select.label} description={EXPLORE_COPY.select.description} href={exploreSelectHref()} linkLabel="All Select guides" />
        <div className="mt-6">
          <CardGrid articles={select.slice(0, 4)} extra={<MapCard />} />
        </div>
      </section>

      <section aria-labelledby="explore-updates" className="mt-16">
        <SectionHead id="explore-updates" title={EXPLORE_COPY.updates.label} description={EXPLORE_COPY.updates.description} href={exploreUpdatesHref()} linkLabel="All travel updates" />
        <div className="mt-6">{updates.current.length > 0 ? <CardGrid articles={updates.current.slice(0, 4)} /> : <EmptyText>{EXPLORE_COPY.updates.empty}</EmptyText>}</div>
      </section>

      <GuideCta />
    </PageShell>
  );
}

export function SelectListView({ crumbs, articles, total, filters }: { crumbs: Crumb[]; articles: SelectArticle[]; total: number; filters: FilterGroup[] }) {
  const filtered = filters.some((f) => f.current);
  return (
    <PageShell crumbs={crumbs}>
      <PageHeader title={EXPLORE_COPY.select.label} intro={EXPLORE_COPY.select.description} />
      <FilterBar baseHref={exploreSelectHref()} groups={filters} />
      <ResultCount shown={articles.length} total={total} />
      <div className="mt-4">
        {articles.length > 0 ? (
          <CardGrid articles={articles} headingLevel="h2" extra={filtered ? null : <MapCard />} />
        ) : (
          <EmptyText>
            No guides here yet. We are working on more of Kansai: in the meantime, see{" "}
            <Link href={exploreSelectHref()} className={LINK}>
              all Select guides
            </Link>
            .
          </EmptyText>
        )}
      </div>
      <GuideCta />
    </PageShell>
  );
}

export function UpdatesListView({ crumbs, current, past, total, filters }: { crumbs: Crumb[]; current: UpdateArticle[]; past: UpdateArticle[]; total: number; filters: FilterGroup[] }) {
  return (
    <PageShell crumbs={crumbs}>
      <PageHeader title={EXPLORE_COPY.updates.label} intro={EXPLORE_COPY.updates.description} />
      <FilterBar baseHref={exploreUpdatesHref()} groups={filters} />
      {total > 0 ? <ResultCount shown={current.length} total={total} /> : null}
      <div className="mt-4">{current.length > 0 ? <CardGrid articles={current} headingLevel="h2" /> : <EmptyText>{EXPLORE_COPY.updates.empty}</EmptyText>}</div>
      <PastUpdates past={past} />
      <GuideCta />
    </PageShell>
  );
}

export function ExploreAreaView({
  crumbs,
  area,
  select,
  updates,
  areaCounts,
}: {
  crumbs: Crumb[];
  area: ExploreArea;
  select: SelectArticle[];
  updates: UpdateArticle[];
  areaCounts: Record<ExploreArea, number>;
}) {
  const info = AREA_INFO[area];
  return (
    <PageShell crumbs={crumbs}>
      <PageHeader eyebrow={EXPLORE_COPY.title} title={`${info.name} Travel Guides`} intro={info.intro} />

      <section aria-labelledby="area-select" className="mt-12">
        <SectionHead id="area-select" title={EXPLORE_COPY.select.label} href={`${exploreSelectHref()}?area=${area}`} linkLabel={`Select guides for ${info.name}`} />
        <div className="mt-6">
          {select.length > 0 ? (
            <CardGrid articles={select} extra={<MapCard area={area} />} />
          ) : (
            <EmptyText>Our {info.name} guides are on the way. Every guide is checked against official sources before we publish it.</EmptyText>
          )}
        </div>
      </section>

      <section aria-labelledby="area-updates" className="mt-14">
        <SectionHead id="area-updates" title={EXPLORE_COPY.updates.label} href={`${exploreUpdatesHref()}?area=${area}`} linkLabel={`Updates for ${info.name}`} />
        <div className="mt-6">{updates.length > 0 ? <CardGrid articles={updates} /> : <EmptyText>{EXPLORE_COPY.updates.empty}</EmptyText>}</div>
      </section>

      <section aria-labelledby="other-areas" className="mt-14">
        <h2 id="other-areas" className="font-heading-en text-sm tracking-[0.2em] text-gold uppercase">
          More of Kansai
        </h2>
        <div className="mt-4">
          <AreaNav counts={areaCounts} current={area} />
        </div>
      </section>

      <GuideCta />
    </PageShell>
  );
}

// --- Map -----------------------------------------------------------------------------

/** The places on the map as a plain list: works without the map and gives every pin a text link. */
function SpotList({ spots }: { spots: SelectMapContent["spots"] }) {
  return (
    <section aria-labelledby="map-places" className="mt-12">
      <h2 id="map-places" className={H2}>
        Places on this map
      </h2>
      <ul className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {spots.map((s) => (
          <li key={s.id} className="border-t border-cream/10 pt-3">
            <span className="text-cream">{s.name}</span>{" "}
            <span className="text-cream/45" lang="ja">
              {s.nameJa}
            </span>
            {s.guide ? (
              <Link href={s.guide.href} className="mt-1 block text-xs text-gold/85 hover:text-gold">
                {s.guide.label}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ExploreMapView({ crumbs, content }: { crumbs: Crumb[]; content: SelectMapContent }) {
  return (
    <PageShell crumbs={crumbs}>
      <PageHeader eyebrow={EXPLORE_COPY.select.label} title={EXPLORE_COPY.map.label} intro={content.description.status === "TBD" ? EXPLORE_COPY.map.description : content.description.value} />
      <div className="mt-8">
        <LazySelectMap content={content} />
      </div>
      <SpotList spots={content.spots} />
      <GuideCta />
    </PageShell>
  );
}

// --- Article building blocks ---------------------------------------------------------

type OutlineItem = { id: string; label: string };

/** Contents list, built from the same data as the sections (ids match the section anchors). */
export function articleOutline(a: ExploreArticle): OutlineItem[] {
  if (a.kind === "select") return selectOutline(a);
  const items: OutlineItem[] = [{ id: "quick-answer", label: "Quick answer" }];
  const c = a.content;
  if (c.whatsChanged.length > 0) items.push({ id: "whats-changed", label: "What's changed" });
  if (c.whoIsAffected.length > 0) items.push({ id: "who-is-affected", label: "Who is affected" });
  if (c.whatTravelersShouldDo.length > 0) items.push({ id: "what-to-do", label: "What travelers should do" });
  if ((a.faq ?? []).length > 0) items.push({ id: "faq", label: "FAQ" });
  items.push({ id: "sources", label: "Sources" }, { id: "about-this-guide", label: "About this guide" });
  return items;
}

function OutlineList({ items }: { items: OutlineItem[] }) {
  return (
    <ol className="flex flex-col gap-1.5 text-sm">
      {items.map((i) => (
        <li key={i.id}>
          <a href={`#${i.id}`} className="block py-0.5 text-cream/70 hover:text-gold">
            {i.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Mobile / tablet: a folding contents box under the quick answer. */
function MobileContents({ items }: { items: OutlineItem[] }) {
  return (
    <details className="group mt-8 rounded-xl border border-gold/25 px-5 py-4 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between font-heading-en text-sm tracking-[0.15em] text-gold uppercase">
        In this guide
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <nav aria-label="In this guide" className="mt-4">
        <OutlineList items={items} />
      </nav>
    </details>
  );
}

/** Large screens: sticky contents beside the reading column. */
function SideContents({ items }: { items: OutlineItem[] }) {
  return (
    <aside className="hidden lg:block">
      <nav aria-label="In this guide" className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pl-5">
        <p className="mb-3 font-heading-en text-xs tracking-[0.2em] text-gold uppercase">In this guide</p>
        <OutlineList items={items} />
      </nav>
    </aside>
  );
}

function QuickAnswer({ article }: { article: ExploreArticle }) {
  const facts = article.kind === "select" ? article.keyFacts : [];
  return (
    <section id="quick-answer" aria-labelledby="quick-answer-h" className="mt-8 scroll-mt-28 rounded-xl border border-gold/40 bg-navy px-6 py-6 md:px-8">
      <h2 id="quick-answer-h" className="font-heading-en text-xs tracking-[0.22em] text-gold uppercase">
        Quick answer
      </h2>
      <p className="mt-3 text-base leading-relaxed text-cream md:text-lg">{article.quickAnswer}</p>
      {facts.length > 0 ? (
        <dl className="mt-5 grid gap-x-8 gap-y-3 border-t border-gold/20 pt-5 text-sm sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-[11px] tracking-[0.14em] text-cream/50 uppercase">{f.label}</dt>
              <dd className="mt-0.5 text-cream/90">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function Faq({ article }: { article: ExploreArticle }) {
  const faq = article.faq ?? [];
  if (faq.length === 0) return null;
  return (
    <section id="faq" aria-labelledby="faq-h" className="mt-14 scroll-mt-28 border-t border-gold/20 pt-10">
      <h2 id="faq-h" className={H2}>
        Frequently asked questions
      </h2>
      <div className="mt-6 flex flex-col divide-y divide-cream/10">
        {faq.map((f) => (
          <div key={f.question} className="py-5 first:pt-0">
            <h3 className="text-base text-gold md:text-lg">{f.question}</h3>
            <p className={cn("mt-2", BODY, "text-cream/80")}>{f.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Sources({ article }: { article: ExploreArticle }) {
  const sources = articleSources(article);
  return (
    <section id="sources" aria-labelledby="sources-h" className="mt-14 scroll-mt-28 border-t border-gold/20 pt-8">
      <h2 id="sources-h" className="font-heading-en text-sm tracking-[0.15em] text-gold uppercase">
        {article.kind === "update" ? "Official source" : "Sources"}
      </h2>
      <p className="mt-2 text-sm text-cream/60">
        {article.kind === "update" ? "This update was checked against:" : "Facts in this guide were checked against these official pages. Hours, fees and access can change: please check them before you go."}
      </p>
      {sources.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {sources.map((s) => (
            <li key={s.url}>
              <SourceLink {...s} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function AboutThisGuide() {
  const a = EXPLORE_COPY.author;
  return (
    <section id="about-this-guide" aria-labelledby="about-h" className="mt-14 flex scroll-mt-28 gap-4 rounded-xl border border-cream/15 px-6 py-6">
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/60 font-heading-en text-sm text-gold">
        CJ
      </span>
      <div>
        <h2 id="about-h" className="text-[11px] tracking-[0.18em] text-cream/50 uppercase">
          About this guide
        </h2>
        <p className="mt-1 font-heading-en text-lg text-cream">{a.name}</p>
        <p className="mt-2 text-sm leading-relaxed text-cream/70">{a.bio}</p>
        <Link href={exploreEditorialPolicyHref()} className="mt-3 inline-flex items-center gap-1.5 text-sm text-gold hover:text-cream">
          {a.policyLabel} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function Related({ article }: { article: ExploreArticle }) {
  const items = relatedArticles(article);
  return (
    <section aria-labelledby="related" className="mt-14 border-t border-gold/25 pt-8">
      <h2 id="related" className="font-heading-en text-sm tracking-[0.15em] text-gold uppercase">
        Keep exploring
      </h2>
      {items.length > 0 ? (
        <div className="mt-5">
          <CardGrid articles={items} />
        </div>
      ) : null}
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {article.area !== "kansai" ? (
          <Link href={exploreAreaHref(article.area)} className={LINK}>
            More {areaName(article.area)} guides
          </Link>
        ) : null}
        <Link href={exploreHref()} className={LINK}>
          {EXPLORE_COPY.title} home
        </Link>
      </p>
    </section>
  );
}

function ArticleLayout({ article, crumbs, children }: { article: ExploreArticle; crumbs: Crumb[]; children: ReactNode }) {
  const outline = articleOutline(article);
  return (
    <article className="bg-navy-dark py-10 text-cream md:py-14">
      <Container className="max-w-6xl">
        <Breadcrumbs crumbs={crumbs} />
        <div className="lg:grid lg:grid-cols-[minmax(0,48rem)_14rem] lg:justify-between lg:gap-12">
          <div className="min-w-0">
            <header className="mt-8">
              <ArticleLabels article={article} />
              <h1 className="mt-4 font-heading-en text-3xl leading-tight text-cream md:text-[2.6rem]">{article.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-cream/85">{article.summary}</p>
              <Dates article={article} />
              <PreviewEditorialNote article={article} />
            </header>
            <QuickAnswer article={article} />
            <MobileContents items={outline} />
            {children}
          </div>
          <SideContents items={outline} />
        </div>
      </Container>
    </article>
  );
}

// --- Select article ----------------------------------------------------------------
//
// Layout (Human instruction 2026-11-15): a type-led travel guide without photo
// slots. Header (category, title, short intro) → At a glance (key facts and
// the short answer) → map with numbered pins (articles whose places are in the
// spot master) → quick comparison table → numbered places → practical tips →
// FAQ → closing CTA → sources, about, related. Photos stay in the data: the
// list cards and the Home slide still use them; the article does not.

const SELECT_PLAN_CTA = cta("v1_explore_select_private", "privateGuide", routeHref("privateGuide"), "section", "primary", proposed("Plan a Private Day", "Header CTA wording (Human instruction 2026-11-09)"));
const SELECT_PLAN_CTA_ALT = cta("v1_explore_select_private_alt", "privateGuide", routeHref("privateGuide"), "section", "secondary", proposed("Plan a Private Day", "Header CTA wording (Human instruction 2026-11-09)"));
const SELECT_TOURS_CTA = cta("v1_explore_select_tours", "experiences", routeHref("experiences"), "section", "secondary", proposed("Explore Our Tours", "Header CTA wording (Human instruction 2026-11-11)"));

const pad2 = (n: number) => String(n).padStart(2, "0");
const EYEBROW = "font-heading-en text-[11px] tracking-[0.2em] text-gold uppercase";
/** Section heading of the reading column: a short gold rule, then the serif title. */
const SECTION_H2 = "font-heading-en text-[1.7rem] leading-tight text-cream md:text-[2.1rem] before:mb-4 before:block before:h-px before:w-10 before:bg-gold before:content-['']";

/** One place of the article, in page order: what the table, the map and the numbered sections share. */
type Entry = { id: string; name: string; nameJa?: string; area?: string; bestFor?: string; slot?: string };

function selectEntries(a: SelectArticle): Entry[] {
  const c = a.content;
  if (c.type === "spots")
    return c.spots.map((t) => {
      const s = spotById(t.spotId);
      return { id: s.id, name: s.name, nameJa: s.nameJa, area: s.details?.locality, bestFor: t.bestFor };
    });
  if (c.type === "itinerary")
    return c.stops.map((t) => {
      const s = spotById(t.spotId);
      return { id: `stop-${s.id}`, name: s.name, nameJa: s.nameJa, area: s.details?.locality, bestFor: t.bestFor, slot: t.slot };
    });
  return c.places.map((p) => ({ id: p.id, name: p.name, nameJa: p.nameJa, area: p.locality, bestFor: p.bestFor }));
}

/** Practical tips: the article's own groups, plus the guide tips / itinerary notes the formats already carry. */
function practicalGroups(a: SelectArticle): { heading: string; items: string[] }[] {
  const groups = [...(a.practical ?? [])];
  if (a.content.type === "guide" && a.content.tips.length > 0) groups.push({ heading: "Travel tips", items: a.content.tips });
  if (a.content.type === "itinerary" && a.content.thingsToKnow.length > 0) groups.push({ heading: "Things to know", items: a.content.thingsToKnow });
  return groups.filter((g) => g.items.length > 0);
}

const mainHeading = (a: SelectArticle) => (a.content.type === "itinerary" ? "The day, stop by stop" : a.content.type === "guide" ? "Recommended places" : `The ${selectEntries(a).length} places`);

function selectOutline(a: SelectArticle): OutlineItem[] {
  const items: OutlineItem[] = [{ id: "at-a-glance", label: "At a glance" }];
  if (articleSpotIds(a).length > 0) items.push({ id: "article-map", label: "Map" });
  const entries = selectEntries(a);
  if (entries.length > 1) items.push({ id: "quick-comparison", label: a.content.type === "itinerary" ? "The day at a glance" : "Quick comparison" });
  if (a.content.type === "guide") for (const s of a.content.sections) items.push({ id: s.id, label: s.heading });
  entries.forEach((e, i) => items.push({ id: e.id, label: `${i + 1}. ${e.slot ? `${e.slot}: ` : ""}${e.name}` }));
  if (practicalGroups(a).length > 0) items.push({ id: "practical-tips", label: "Practical tips" });
  if (a.faq.length > 0) items.push({ id: "faq", label: "FAQ" });
  items.push({ id: "sources", label: "Sources" });
  return items;
}

function BackToSelect() {
  return (
    <Link href={exploreSelectHref()} className="inline-flex items-center gap-2 font-heading-en text-xs tracking-[0.16em] text-cream/65 uppercase transition-colors hover:text-gold">
      <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden /> Back to {EXPLORE_COPY.select.label}
    </Link>
  );
}

function AtAGlance({ article }: { article: SelectArticle }) {
  return (
    <section id="at-a-glance" aria-labelledby="at-a-glance-h" className="scroll-mt-28 border-y border-gold/30 py-8 md:py-10">
      <h2 id="at-a-glance-h" className={EYEBROW}>
        At a glance
      </h2>
      {article.keyFacts.length > 0 ? (
        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          {article.keyFacts.map((f) => (
            <div key={f.label} className="border-l border-gold/30 pl-4">
              <dt className="text-[11px] tracking-[0.16em] text-cream/50 uppercase">{f.label}</dt>
              <dd className="mt-1 font-heading-en text-[17px] leading-snug text-cream md:text-lg">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div id="quick-answer" className="mt-8 scroll-mt-28">
        <p className="text-[11px] tracking-[0.16em] text-gold/80 uppercase">In short</p>
        <p className="mt-2 text-base leading-relaxed text-cream/90 md:text-lg">{article.quickAnswer}</p>
      </div>
    </section>
  );
}

/** In-article map: only this article's places, pins numbered like the sections; a pin's popup jumps to its section. */
function ArticleMap({ article }: { article: SelectArticle }) {
  const ids = articleSpotIds(article);
  const anchor = (id: string) => (article.content.type === "itinerary" ? `stop-${id}` : id);
  const base = getArticleMapContent(ids);
  const content: SelectMapContent = { ...base, spots: base.spots.map((s) => ({ ...s, guide: { href: `#${anchor(s.id)}`, label: "Read about it in this guide ↓" } })) };
  return (
    <section id="article-map" aria-labelledby="article-map-h" className="mt-16 scroll-mt-28">
      <h2 id="article-map-h" className={SECTION_H2}>
        {article.content.type === "itinerary" ? "The route on a map" : "The places on a map"}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-cream/65">
        The numbers match the places below. Select a pin to see its name and jump to it. On a phone, tap “Move map” to drag the map.
      </p>
      <div className="mt-6">
        <LazySelectMap content={content} variant="embed" numbered />
      </div>
      <Link href={mapHref()} className="mt-4 inline-flex items-center gap-1.5 text-sm text-gold hover:text-cream">
        <MapPin className="h-4 w-4" aria-hidden /> Open the full {EXPLORE_COPY.map.label}
      </Link>
    </section>
  );
}

/** Quick comparison: a table on wide screens, a numbered list on phones (no sideways scrolling). Only the columns the article has. */
function QuickComparison({ article }: { article: SelectArticle }) {
  const entries = selectEntries(article);
  if (entries.length < 2) return null;
  const route = article.content.type === "itinerary";
  const hasArea = entries.some((e) => e.area);
  const hasBest = entries.some((e) => e.bestFor);
  return (
    <section id="quick-comparison" aria-labelledby="quick-comparison-h" className="mt-16 scroll-mt-28">
      <h2 id="quick-comparison-h" className={SECTION_H2}>
        {route ? "The day at a glance" : "Quick comparison"}
      </h2>
      <table className="mt-6 hidden w-full border-collapse text-left md:table">
        <thead>
          <tr className="border-b border-gold/40 text-[11px] tracking-[0.16em] text-cream/50 uppercase">
            <th scope="col" className="w-14 py-3 pr-3 font-normal">
              {route ? "#" : "No."}
            </th>
            <th scope="col" className="py-3 pr-6 font-normal">
              {route ? "Stop" : "Place"}
            </th>
            {hasArea ? (
              <th scope="col" className="py-3 pr-6 font-normal">
                Area
              </th>
            ) : null}
            {hasBest ? (
              <th scope="col" className="py-3 font-normal">
                Best for
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.id} className="border-b border-cream/10 align-top">
              <td className="py-4 pr-3 font-heading-en text-lg text-gold">{pad2(i + 1)}</td>
              <th scope="row" className="py-4 pr-6 font-normal">
                {e.slot ? <span className="block text-[11px] tracking-[0.16em] text-gold/80 uppercase">{e.slot}</span> : null}
                <a href={`#${e.id}`} className="font-heading-en text-[17px] leading-snug text-cream hover:text-gold">
                  {e.name}
                </a>
              </th>
              {hasArea ? <td className="py-4 pr-6 text-sm leading-relaxed text-cream/65">{e.area ?? ""}</td> : null}
              {hasBest ? <td className="py-4 text-[15px] leading-relaxed text-cream/85">{e.bestFor ?? ""}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
      <ol className="mt-5 border-t border-gold/40 md:hidden">
        {entries.map((e, i) => (
          <li key={e.id} className="flex gap-4 border-b border-cream/10 py-4">
            <span aria-hidden className="w-7 shrink-0 font-heading-en text-lg leading-snug text-gold">
              {pad2(i + 1)}
            </span>
            <div className="min-w-0">
              {e.slot ? <p className="text-[11px] tracking-[0.16em] text-gold/80 uppercase">{e.slot}</p> : null}
              <a href={`#${e.id}`} className="font-heading-en text-[17px] leading-snug text-cream hover:text-gold">
                {e.name}
              </a>
              {e.area ? <p className="mt-0.5 text-xs text-cream/55">{e.area}</p> : null}
              {e.bestFor ? <p className="mt-1.5 text-sm leading-relaxed text-cream/80">{e.bestFor}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Points({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-5 flex flex-col gap-2.5 text-[15px] leading-relaxed text-cream/80 md:text-base">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span aria-hidden className="mt-[0.8em] h-px w-3 shrink-0 bg-gold/80" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** A numbered place: big gold number beside it on wide screens, above it on phones. */
function PlaceBlock({ n, entry, eyebrow, children }: { n: number; entry: Entry; eyebrow?: string; children: ReactNode }) {
  return (
    <section id={entry.id} aria-labelledby={`${entry.id}-h`} className="scroll-mt-28 border-t border-cream/10 py-10 md:grid md:grid-cols-[4.5rem_minmax(0,1fr)] md:gap-x-4 md:py-12">
      <p aria-hidden className="font-heading-en text-3xl leading-none text-gold md:pt-1 md:text-[2.6rem]">
        {pad2(n)}
      </p>
      <div className="mt-4 min-w-0 md:mt-0">
        {eyebrow ? <p className="text-[11px] tracking-[0.18em] text-gold/80 uppercase">{eyebrow}</p> : null}
        <h3 id={`${entry.id}-h`} className="mt-1.5 font-heading-en text-2xl leading-snug text-cream md:text-[1.75rem]">
          <span className="sr-only">{n}. </span>
          {entry.name}
          {entry.nameJa ? (
            <span className="ml-2 align-middle text-base text-cream/45" lang="ja">
              {entry.nameJa}
            </span>
          ) : null}
        </h3>
        {children}
      </div>
    </section>
  );
}

/** Small reference line under a place: stations, official site, map. */
function PlaceMeta({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col gap-1.5 text-sm text-cream/70 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-6">{children}</div>;
}

function CheckNote({ checkedAt, note }: { checkedAt: string | null; note: string }) {
  return (
    <>
      {checkedAt ? <p className="mt-3 text-xs text-cream/45">Last checked against official information: {formatIsoDate(checkedAt)}</p> : null}
      {V1_PREVIEW ? (
        <p className="mt-2 text-xs text-gold/75">
          {checkedAt ? "Checked" : "Not checked yet"} · {note}
        </p>
      ) : null}
    </>
  );
}

function SpotEntry({ text, n, entry }: { text: SelectSpotText; n: number; entry: Entry }) {
  const spot = spotById(text.spotId);
  const d = spot.details;
  const dayPlan = itineraryWithSpot(spot.id);
  const onTour = FEATURED_TOUR_SPOTS.includes(spot.id);
  return (
    <PlaceBlock n={n} entry={entry} eyebrow={d?.locality}>
      <p className={cn("mt-4", BODY)}>{text.overview}</p>
      <p className={cn("mt-3", BODY, "text-cream/75")}>{text.whyWeRecommend}</p>
      <Points items={[...text.localTips, ...text.thingsToKnow]} />
      {onTour ? (
        <p className="mt-5 text-sm leading-relaxed text-cream/75">
          {EXPLORE_COPY.tourCta.spotNote}{" "}
          <Link href={experienceHref(FEATURED_TOUR_SLUG)} className="text-gold hover:text-cream">
            About the tour →
          </Link>
        </p>
      ) : null}
      <PlaceMeta>
        {d?.access ? (
          <span>
            <span className="text-cream/50">Nearest stations: </span>
            {d.access.text}
          </span>
        ) : null}
        {d ? <SourceLink {...d.official} /> : null}
        <Link href={mapHref(spot)} className={cn("inline-flex items-center gap-1.5", LINK)}>
          <MapPin className="h-3.5 w-3.5" aria-hidden /> Full map
        </Link>
        {dayPlan ? (
          <Link href={dayPlan.href} className={LINK}>
            {dayPlan.label}
          </Link>
        ) : null}
      </PlaceMeta>
      <CheckNote checkedAt={text.checkedAt} note={text.checkNote} />
    </PlaceBlock>
  );
}

type ItineraryContent = Extract<SelectArticle["content"], { type: "itinerary" }>;

function StopEntry({ stop, n, entry }: { stop: ItineraryContent["stops"][number]; n: number; entry: Entry }) {
  const spot = spotById(stop.spotId);
  const more = selectSpotSectionHref(spot.id);
  return (
    <PlaceBlock n={n} entry={entry} eyebrow={`${stop.slot}${spot.details ? ` · ${spot.details.locality}` : ""}`}>
      <p className={cn("mt-4", BODY)}>{stop.plan}</p>
      {stop.stay ? <p className="mt-3 text-sm text-cream/70">Suggested time here: {stop.stay}</p> : null}
      {stop.nextLeg ? (
        <div className="mt-6 border-l-2 border-gold/60 pl-5">
          <p className="text-[11px] tracking-[0.16em] text-gold/80 uppercase">Getting to the next stop</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-cream/85">{stop.nextLeg.text}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {stop.nextLeg.sources.map((s) => (
              <SourceLink key={s.url} {...s} />
            ))}
          </p>
        </div>
      ) : null}
      <PlaceMeta>
        {more ? (
          <Link href={more.href} className={LINK}>
            More about {spot.name}
          </Link>
        ) : null}
        <Link href={mapHref(spot)} className={cn("inline-flex items-center gap-1.5", LINK)}>
          <MapPin className="h-3.5 w-3.5" aria-hidden /> Full map
        </Link>
      </PlaceMeta>
    </PlaceBlock>
  );
}

function GuideEntry({ place, n, entry }: { place: GuidePlace; n: number; entry: Entry }) {
  return (
    <PlaceBlock n={n} entry={entry} eyebrow={place.locality}>
      <p className={cn("mt-4", BODY)}>{place.text}</p>
      <Points items={place.tips} />
      {place.official ? (
        <PlaceMeta>
          <SourceLink {...place.official} />
        </PlaceMeta>
      ) : null}
      <CheckNote checkedAt={place.checkedAt} note={place.checkNote} />
    </PlaceBlock>
  );
}

function MainContent({ article }: { article: SelectArticle }) {
  const c = article.content;
  const entries = selectEntries(article);
  return (
    <>
      {c.type === "guide"
        ? c.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-16 scroll-mt-28">
              <h2 id={`${s.id}-h`} className={SECTION_H2}>
                {s.heading}
              </h2>
              <div className={cn("mt-5 flex flex-col gap-4", BODY, "text-cream/80")}>
                {s.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))
        : null}
      <section aria-labelledby="main-places-h" className="mt-16">
        <h2 id="main-places-h" className={SECTION_H2}>
          {mainHeading(article)}
        </h2>
        {c.type === "itinerary" ? <p className={cn("mt-5", BODY, "text-cream/80")}>{c.whyThisOrder}</p> : null}
        <div className="mt-6">
          {c.type === "spots"
            ? c.spots.map((t, i) => <SpotEntry key={t.spotId} text={t} n={i + 1} entry={entries[i]} />)
            : c.type === "itinerary"
              ? c.stops.map((s, i) => <StopEntry key={s.slot} stop={s} n={i + 1} entry={entries[i]} />)
              : c.places.map((p, i) => <GuideEntry key={p.id} place={p} n={i + 1} entry={entries[i]} />)}
        </div>
      </section>
    </>
  );
}

function PracticalTips({ article }: { article: SelectArticle }) {
  const groups = practicalGroups(article);
  if (groups.length === 0) return null;
  return (
    <section id="practical-tips" aria-labelledby="practical-tips-h" className="mt-12 scroll-mt-28 border-t border-gold/30 pt-12">
      <h2 id="practical-tips-h" className={SECTION_H2}>
        Practical tips
      </h2>
      <div className={cn("mt-6 grid gap-x-10 gap-y-8", groups.length > 1 && "md:grid-cols-2")}>
        {groups.map((g) => (
          <div key={g.heading}>
            <h3 className="text-[11px] tracking-[0.18em] text-gold uppercase">{g.heading}</h3>
            <Points items={g.items} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Closing CTA: links to the existing tour page and Private Guide request (nothing is booked by clicking). */
function SelectCta({ article }: { article: SelectArticle }) {
  const tour = article.cta === "featuredTour";
  const t = EXPLORE_COPY.tourCta;
  return (
    <section aria-labelledby="select-cta-h" className="mt-16 border-t border-gold/30 pt-12 pb-2 text-center md:pt-14">
      <p className={EYEBROW}>{tour ? t.eyebrow : "Private Guide"}</p>
      <h2 id="select-cta-h" className="mx-auto mt-4 max-w-xl font-heading-en text-2xl leading-snug text-cream md:text-[2rem]">
        {tour ? "See it with a local guide" : "Plan your day with a local guide"}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/75 md:text-base">{article.closing ?? (tour ? t.supporting : EXPLORE_COPY.cta.supporting)}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
        {tour ? (
          <>
            <CtaLink cta={TOUR_CTA} />
            <CtaLink cta={SELECT_PLAN_CTA_ALT} />
          </>
        ) : (
          <>
            <CtaLink cta={SELECT_PLAN_CTA} />
            <CtaLink cta={SELECT_TOURS_CTA} />
          </>
        )}
      </div>
    </section>
  );
}

export function SelectArticleView({ article, crumbs }: { article: SelectArticle; crumbs: Crumb[] }) {
  const outline = selectOutline(article);
  return (
    <article className="bg-navy-dark pt-8 pb-16 text-cream md:pt-12 md:pb-24">
      <Container className="max-w-6xl">
        <div className="flex flex-col gap-3">
          <BackToSelect />
          <div className="hidden md:block">
            <Breadcrumbs crumbs={crumbs} />
          </div>
        </div>
        <header className="mt-10 md:mt-14">
          <ArticleLabels article={article} />
          <h1 className="mt-5 max-w-4xl font-heading-en text-[2.15rem] leading-[1.12] text-cream sm:text-5xl md:text-[3.4rem]">{article.title}</h1>
          <div className="mt-6 flex max-w-3xl flex-col gap-4 text-[17px] leading-relaxed text-cream/80 md:text-xl md:leading-relaxed">
            {article.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="max-w-3xl">
            <Dates article={article} />
            <PreviewEditorialNote article={article} />
          </div>
        </header>
        <div className="mt-12 lg:grid lg:grid-cols-[minmax(0,48rem)_14rem] lg:justify-between lg:gap-12">
          <div className="min-w-0">
            <AtAGlance article={article} />
            <MobileContents items={outline} />
            {articleSpotIds(article).length > 0 ? <ArticleMap article={article} /> : null}
            <QuickComparison article={article} />
            <MainContent article={article} />
            <PracticalTips article={article} />
            <Faq article={article} />
            <SelectCta article={article} />
            <Sources article={article} />
            <AboutThisGuide />
            <Related article={article} />
          </div>
          <SideContents items={outline} />
        </div>
      </Container>
    </article>
  );
}

// --- Update article ----------------------------------------------------------------

export function UpdateArticleView({ article, crumbs }: { article: UpdateArticle; crumbs: Crumb[] }) {
  const currency = currencyOf(article);
  const notice = currency === "current" ? null : currency === "needs_recheck" ? EXPLORE_COPY.updates.recheckNotice : EXPLORE_COPY.updates.pastNotice;
  const sections: [string, string, string[]][] = [
    ["whats-changed", "What's changed", article.content.whatsChanged],
    ["who-is-affected", "Who is affected", article.content.whoIsAffected],
    ["what-to-do", "What travelers should do", article.content.whatTravelersShouldDo],
  ];
  return (
    <ArticleLayout article={article} crumbs={crumbs}>
      {notice ? (
        <p role="note" className="mt-8 border border-cream/30 bg-cream/10 px-4 py-3 text-sm leading-relaxed text-cream">
          {notice}
        </p>
      ) : null}
      {sections.map(([id, title, items]) =>
        items.length > 0 ? (
          <section key={id} id={id} aria-labelledby={`${id}-h`} className="mt-10 scroll-mt-28">
            <h2 id={`${id}-h`} className={H2}>
              {title}
            </h2>
            <div className={cn("mt-3 flex flex-col gap-4", BODY, "text-cream/80")}>
              {items.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ) : null,
      )}
      <Faq article={article} />
      <ArticleCta target={article.cta ?? "privateGuide"} />
      <Sources article={article} />
      <AboutThisGuide />
      <Related article={article} />
    </ArticleLayout>
  );
}

// --- Editorial policy (public-facing, preview until approved) --------------------------

export function EditorialPolicyView({ crumbs }: { crumbs: Crumb[] }) {
  const sections: [string, string[]][] = [
    [
      "Who writes Explore Kansai",
      [
        `Explore Kansai is written by the ${EXPLORE_COPY.author.name}: the local team behind Connectrip Japan's guided tours in Kansai.`,
        "Every article is reviewed and approved by a member of the team before it is published.",
      ],
    ],
    [
      "How we check information",
      [
        "We check facts against official sources, such as the website of the place itself, the railway operator or the organiser of an event, and we link to those sources in the article.",
        "Each article shows the date its information was last checked. If we cannot confirm something with an official source, we leave it out. That is why many of our guides do not list opening hours or fees: they change, and the official website is the best place to check them.",
      ],
    ],
    [
      "Keeping guides up to date",
      [
        "Connectrip Japan Select guides are reviewed at least every three months, and sooner when something important changes.",
        "Kansai Travel Updates are published only when there is news that affects travellers and we have checked it against an official source. Each update shows how long it is valid. When it is no longer current, it is marked as past information and kept for reference.",
      ],
    ],
    ["Photos", ["We use our own photos, or photos we have the right to use."]],
    ["Our tours", ["Connectrip Japan runs guided tours in Kansai. When a place in an article is part of one of our tours, or a private guide could help with the plan, we say so and link to it."]],
    ["Corrections", [`If you find something that is wrong or out of date, please tell us at ${businessInfo.email}. We check every report and correct the article when needed.`]],
  ];
  return (
    <PageShell crumbs={crumbs}>
      <PageHeader eyebrow={EXPLORE_COPY.title} title="Editorial Policy" intro="How we research, check and update the guides and travel updates in Explore Kansai." />
      {V1_PREVIEW ? <p className="mt-6 max-w-3xl border border-dashed border-gold/50 px-4 py-3 text-xs text-gold/85">Preview · DRAFT: wording to be approved by Connectrip Japan before publication.</p> : null}
      <div className="mt-10 flex max-w-3xl flex-col gap-10">
        {sections.map(([title, paras]) => (
          <section key={title}>
            <h2 className="font-heading-en text-2xl text-cream">{title}</h2>
            <div className={cn("mt-3 flex flex-col gap-4", BODY, "text-cream/80")}>
              {paras.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

// --- Editorial list (preview only) -----------------------------------------------------

const RIGHTS_LABEL = { confirmed: "Confirmed", unverified: "Not verified", missing: "Missing" } as const;

export function EditorialDashboardView({ rows }: { rows: EditorialRow[] }) {
  const ready = rows.filter((r) => r.publishable).length;
  return (
    <div className="bg-navy-dark py-10 text-cream md:py-14">
      <Container className="max-w-7xl">
        <p className="font-heading-en text-xs tracking-[0.25em] text-gold/80 uppercase">Preview only · not public</p>
        <h1 className="mt-2 font-heading-en text-3xl text-cream md:text-4xl">Explore Kansai: editorial list</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-cream/70">
          Every article with its status, last check, photo rights and whether it passes the publish gate. {rows.length} articles · {ready} ready to publish. How to add or update an article:
          <code className="mx-1 break-all text-gold/90">src/website-v1/content/explore/EDITORIAL.md</code>
        </p>
        <div className="mt-8 overflow-x-auto rounded-xl border border-gold/25">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="bg-navy text-[11px] tracking-[0.12em] text-cream/60 uppercase">
              <tr>
                {["Article", "Area", "Category", "Status", "Last checked", "Next check", "Photo rights", "Publish"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.article.slug} className="border-t border-cream/10 align-top">
                  <td className="px-4 py-4">
                    <Link href={articleHref(r.article)} className="text-cream hover:text-gold">
                      {r.article.title}
                    </Link>
                    <p className="mt-1 text-xs text-cream/45">{r.series}</p>
                  </td>
                  <td className="px-4 py-4 text-cream/80">{r.area}</td>
                  <td className="px-4 py-4 text-cream/80">{r.category}</td>
                  <td className="px-4 py-4 text-cream/80">{STATUS_LABEL[r.status]}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-cream/80">{r.lastChecked ? formatIsoDate(r.lastChecked) : "—"}</td>
                  <td className={cn("px-4 py-4 whitespace-nowrap", r.reviewOverdue ? "text-red-300" : "text-cream/80")}>
                    {r.nextReviewDue ? formatIsoDate(r.nextReviewDue) : "—"}
                    {r.reviewOverdue ? " · overdue" : ""}
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {(["confirmed", "unverified", "missing"] as const).map((k) =>
                      r.photos[k].length > 0 ? (
                        <p key={k} className={k === "confirmed" ? "text-emerald-300" : "text-gold/85"} title={r.photos[k].join(", ")}>
                          {RIGHTS_LABEL[k]}: {r.photos[k].length}
                        </p>
                      ) : null,
                    )}
                    {r.article.kind === "update" ? <p className="text-cream/45">No photos</p> : null}
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {r.publishable ? (
                      <span className="text-emerald-300">Ready</span>
                    ) : (
                      <details>
                        <summary className="cursor-pointer text-gold/90">Not ready ({r.problems.length})</summary>
                        <ul className="mt-2 list-disc pl-4 text-cream/65">
                          {r.problems.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-xs text-cream/50">
          Ready = passes the publish gate (approval, dates, quick answer, checked facts, rights-confirmed photos, no open editorial items). Publishing also needs Explore Kansai to be approved for the public site.
        </p>
      </Container>
    </div>
  );
}
