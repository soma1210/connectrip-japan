import Link from "next/link";
import { BadgeCheck, ExternalLink, MapPin } from "lucide-react";
import type {
  ArticleBlock,
  ArticlePreviewFlag,
  BreadcrumbItem,
  GuideArticleDetails,
  GuideFaqItem,
  GuideSource,
  VerificationBadge,
} from "@/contracts";
import { cn } from "@/lib/cn";
import { formatIsoDate, formatIsoRange } from "../format";
import { TbdText } from "../Tbd";

/**
 * Travel Guide article parts (Phase 1, W1-D10). Colours, borders and type
 * follow the current site's design system (navy / gold / cream / red).
 * Labels for checks come from the view model only: no record, no label.
 */

const eyebrow = "font-heading-en text-[11px] tracking-[0.25em] text-gold/80";

export function Breadcrumb({ items }: { items?: BreadcrumbItem[] }) {
  if (!items || items.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-cream/55">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href} className="flex min-w-0 items-center gap-2">
              {i > 0 ? <span aria-hidden>›</span> : null}
              {last ? (
                <TbdText value={item.name} slot="Breadcrumb" className="truncate text-cream/75" />
              ) : (
                <Link href={item.href} className="hover:text-gold">
                  <TbdText value={item.name} slot="Breadcrumb" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const FLAG_LABELS: Record<ArticlePreviewFlag, string> = {
  demo: "DEMO / NOT FOR PRODUCTION",
  draft: "DRAFT",
  out_of_period: "OUT OF PERIOD",
  needs_review: "REVIEW DUE",
};

/** Preview-only chips on cards. */
export function PreviewFlags({ flags, className }: { flags?: ArticlePreviewFlag[]; className?: string }) {
  if (!flags || flags.length === 0) return null;
  return (
    <span className={cn("flex flex-wrap gap-1.5", className)}>
      {flags.map((flag) => (
        <span
          key={flag}
          className={cn(
            "border px-2 py-0.5 font-sans text-[10px] tracking-[0.08em]",
            flag === "demo" ? "border-red bg-red/90 text-cream" : "border-dashed border-gold/60 bg-navy-dark/80 text-gold",
          )}
        >
          {FLAG_LABELS[flag]}
        </span>
      ))}
    </span>
  );
}

/** Preview-only notice above the article. Never shown in production (no drafts / demos there). */
export function PreviewNotice({ guide, flags }: { guide: GuideArticleDetails; flags?: ArticlePreviewFlag[] }) {
  if (!flags || flags.length === 0) return null;
  return (
    <div
      role="note"
      className={cn(
        "border px-4 py-3 text-xs leading-relaxed",
        guide.demo ? "border-red bg-red/15 text-cream" : "border-dashed border-gold/50 bg-navy-dark/60 text-cream/80",
      )}
    >
      {guide.demo ? (
        <p>
          <strong className="tracking-[0.08em] text-cream">DEMO / PLACEHOLDER / NOT FOR PRODUCTION.</strong> Events, venues, sources,
          checks and photos on this page are not real. This record cannot pass the publish gate.
        </p>
      ) : null}
      {flags.includes("draft") ? <p>Draft: not published. Visible in the Website v1 preview only.</p> : null}
      {flags.includes("needs_review") && guide.freshness.reviewDueAt ? (
        <p>Review due since {formatIsoDate(guide.freshness.reviewDueAt)}.</p>
      ) : null}
    </div>
  );
}

/** Published / Updated / Last checked. Updated only when the content changed. */
export function Byline({ guide, readingMinutes }: { guide: GuideArticleDetails; readingMinutes?: number }) {
  const { byline } = guide;
  const parts: string[] = [`By ${byline.author.name}`];
  if (byline.publishedAt) parts.push(`Published ${formatIsoDate(byline.publishedAt)}`);
  else parts.push("Not published yet");
  if (byline.updatedAt) parts.push(`Updated ${formatIsoDate(byline.updatedAt)}`);
  if (byline.lastCheckedAt) parts.push(`Last checked ${formatIsoDate(byline.lastCheckedAt)}`);
  if (readingMinutes) parts.push(`${readingMinutes} min read`);
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-cream/60">
      {parts.map((part, i) => (
        <span key={part} className="flex items-center gap-3">
          {i > 0 ? <span aria-hidden className="text-gold/40">·</span> : null}
          {part}
        </span>
      ))}
    </p>
  );
}

/** Period banner for fresh articles, computed from dates. */
export function StatusBanner({ guide }: { guide: GuideArticleDetails }) {
  const { period, periodLabel } = guide.freshness;
  if (period === "not_applicable" || !periodLabel) return null;
  const text =
    period === "out_of_period"
      ? `This page covers ${periodLabel}. The next update is being prepared.`
      : period === "upcoming"
        ? `This page covers ${periodLabel} (upcoming).`
        : `This page covers ${periodLabel}.`;
  return (
    <p
      className={cn(
        "border-l-2 px-4 py-2.5 text-sm",
        period === "out_of_period" ? "border-red bg-red/10 text-cream" : "border-gold bg-navy-dark/60 text-cream/85",
      )}
    >
      {text}
    </p>
  );
}

export function QuickAnswer({ text }: { text: string }) {
  return (
    <div className="border border-gold/40 bg-navy-dark/60 px-5 py-4 md:px-6 md:py-5">
      <p className={eyebrow}>QUICK ANSWER</p>
      <p className="mt-2 text-base leading-relaxed text-cream md:text-lg">{text}</p>
    </div>
  );
}

export function Toc({ items }: { items: GuideArticleDetails["toc"] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Contents" className="border-y border-cream/15 py-4">
      <p className={eyebrow}>CONTENTS</p>
      <ol className="mt-3 grid gap-1.5 text-sm text-cream/80 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="hover:text-gold">
              <span className="mr-2 text-gold/60">{i + 1}.</span>
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function CheckBadge({ badge }: { badge?: VerificationBadge }) {
  if (!badge) return null;
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-cream/55">
      <BadgeCheck className={cn("h-3.5 w-3.5 shrink-0", badge.method === "on_site" ? "text-gold" : "text-cream/45")} aria-hidden />
      {badge.label}
    </p>
  );
}

function ExternalLinks({ officialUrl, mapUrl }: { officialUrl?: string; mapUrl?: string }) {
  if (!officialUrl && !mapUrl) return null;
  const link = "inline-flex items-center gap-1.5 border-b border-red pb-0.5 text-xs tracking-[0.06em] text-cream hover:text-gold";
  return (
    <div className="flex flex-wrap gap-5">
      {officialUrl ? (
        <a href={officialUrl} target="_blank" rel="noopener noreferrer" className={link}>
          Official site <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      ) : null}
      {mapUrl ? (
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={link}>
          Map <MapPin className="h-3 w-3" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

function Facts({ rows }: { rows: [string, string | undefined][] }) {
  const shown = rows.filter((r): r is [string, string] => Boolean(r[1]));
  if (shown.length === 0) return null;
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {shown.map(([label, value]) => (
        <div key={label} className="border-t border-cream/15 pt-2">
          <dt className="font-heading-en text-[11px] tracking-[0.15em] text-cream/50 italic">{label}</dt>
          <dd className="mt-1 text-cream/85">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const STATE_LABELS = { live: "ON NOW", upcoming: "UPCOMING", ended: "ENDED" } as const;

export function EventCard({ block }: { block: Extract<ArticleBlock, { type: "event" }> }) {
  const { event, state } = block;
  return (
    <div className={cn("flex flex-col gap-4 border border-gold/30 bg-navy-dark/40 p-5 md:p-6", state === "ended" && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "px-2 py-0.5 text-[10px] tracking-[0.12em]",
            state === "live" && "bg-red text-cream",
            state === "upcoming" && "border border-gold/60 text-gold",
            state === "ended" && "border border-cream/30 text-cream/60",
          )}
        >
          {STATE_LABELS[state]}
        </span>
        <span className="text-sm text-cream/85">{formatIsoRange(event.startDate, event.endDate)}</span>
      </div>
      <div>
        <h3 className="font-heading-en text-xl tracking-wide text-gold">{event.name}</h3>
        <p className="mt-1 text-xs text-cream/60">{[event.venue, event.area].filter(Boolean).join(" · ")}</p>
      </div>
      {event.summary ? <p className="text-sm leading-relaxed text-cream/80">{event.summary}</p> : null}
      <Facts
        rows={[
          ["Time", event.timeNote],
          ["Price", event.price],
          ["Access", event.access],
          ["Best for", event.bestFor?.join(", ")],
          ["Family friendly", event.familyFriendly === undefined ? undefined : event.familyFriendly ? "Yes" : "No"],
        ]}
      />
      <ExternalLinks officialUrl={event.officialUrl} mapUrl={event.mapUrl} />
      <CheckBadge badge={block.badge} />
    </div>
  );
}

export function SpotCard({ block }: { block: Extract<ArticleBlock, { type: "spot" }> }) {
  const { spot } = block;
  return (
    <div className="flex flex-col gap-4 border border-gold/30 bg-navy-dark/40 p-5 md:p-6">
      <div>
        <h3 className="font-heading-en text-xl tracking-wide text-gold">{spot.name}</h3>
        <p className="mt-1 text-xs text-cream/60">{[spot.area, spot.address].filter(Boolean).join(" · ")}</p>
      </div>
      <Facts
        rows={[
          ["Opening hours", spot.hours],
          ["Price", spot.price],
          ["Access", spot.access],
          ["Best for", spot.bestFor?.join(", ")],
          ["Family friendly", spot.familyFriendly === undefined ? undefined : spot.familyFriendly ? "Yes" : "No"],
          ["Crowds", block.crowdLabel],
        ]}
      />
      <ExternalLinks officialUrl={spot.officialUrl} mapUrl={spot.mapUrl} />
      <CheckBadge badge={block.badge} />
    </div>
  );
}

/** Connectrip Local Insight: only rendered from an on-site record (the type requires one). */
export function LocalInsightCard({ block }: { block: Extract<ArticleBlock, { type: "localInsight" }> }) {
  return (
    <aside className="border-l-2 border-red bg-navy-dark/70 px-5 py-4 md:px-6">
      <p className={eyebrow}>CONNECTRIP LOCAL INSIGHT</p>
      <p className="mt-2 text-base leading-relaxed text-cream/90">{block.insight.text}</p>
      <div className="mt-3">
        <CheckBadge badge={block.badge} />
      </div>
    </aside>
  );
}

function SubHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="scroll-mt-28 text-2xl text-gold">
      {children}
    </h2>
  );
}

export function RecentlyEnded({ events }: { events: GuideArticleDetails["endedEvents"] }) {
  if (events.length === 0) return null;
  return (
    <section className="flex flex-col gap-5">
      <SubHeading id="recently-ended">Recently ended</SubHeading>
      {events.map((block) => (
        <EventCard key={block.event.id} block={block} />
      ))}
    </section>
  );
}

export function Faq({ items }: { items?: GuideFaqItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="flex flex-col gap-5">
      <SubHeading id="faq">FAQ</SubHeading>
      <dl className="flex flex-col gap-5">
        {items.map((item) => (
          <div key={item.question} className="border-t border-cream/15 pt-4">
            <dt className="text-base text-cream">{item.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-cream/75">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Sources({ sources }: { sources: GuideSource[] }) {
  if (sources.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <SubHeading id="sources">Sources</SubHeading>
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-cream/75">
        {sources.map((source) => (
          <li key={source.id}>
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-cream underline decoration-gold/50 hover:text-gold">
              {source.title}
            </a>{" "}
            <span className="text-cream/55">
              — {source.publisher}, accessed {formatIsoDate(source.accessedAt)}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-cream/50">Dates and times can change. Check the official site before you go.</p>
    </section>
  );
}
