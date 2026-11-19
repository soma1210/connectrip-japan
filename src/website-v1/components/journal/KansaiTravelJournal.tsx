import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { JOURNAL_COPY, JOURNAL_PHOTO, showJournalPhoto, type JournalPage } from "../../content/journal";
import { reveal, revealGroup, revealStyles } from "../motion/reveal";

/**
 * Kansai Travel Journal section (design approved 2026-11-13): Kiyomizu-dera
 * photo on the left as a CSS background fading into navy, title over the
 * photo, four text-only articles on the right, numbered pages below.
 * Server component: every page number is a real link (crawlable, back /
 * forward work), no client-side switching.
 */
export type SectionCopy = { brand: string; title: string; subtitle: string; tagline: string };

/**
 * Also the Home "Explore Kansai" section (2026-11-14): same design, Explore
 * articles as `data`, its own `copy`, a "view all" link and `dimPhoto` (a
 * semi-transparent navy veil over the photo so the articles stand forward).
 */
export function KansaiTravelJournal({
  data,
  id,
  headingLevel = "h2",
  copy = JOURNAL_COPY,
  more,
  emptyText = "New articles are on the way. Please check back soon.",
  dimPhoto = false,
}: {
  data: JournalPage;
  id?: string;
  headingLevel?: "h1" | "h2";
  copy?: SectionCopy;
  more?: { href: string; label: string };
  emptyText?: string;
  dimPhoto?: boolean;
}) {
  const Heading = headingLevel;
  return (
    // Luxury editorial motion (Home only, where RevealObserver is mounted): title → tagline → articles one by one → pages.
    <section id={id} aria-labelledby="ktj-title" {...revealGroup} className="relative isolate overflow-hidden bg-navy-dark">
      <div className="mx-auto w-full max-w-(--container-app) px-5 pt-10 pb-10 md:px-10 md:pt-10 md:pb-10">
        {/* Title block (left) and tagline (right). On mobile the photo sits between them. */}
        <div className="grid gap-6 md:grid-cols-[52fr_48fr] md:gap-8">
          <div className="min-w-0">
            <p {...reveal("fade", 0, "font-heading-en text-sm tracking-[0.18em] text-gold")}>{copy.brand}</p>
            <Heading
              id="ktj-title"
              {...reveal("title", 0.1, "mt-1 font-heading-en text-[2.4rem] leading-[1.05] tracking-[0.02em] text-gold sm:text-5xl md:text-[clamp(2.3rem,3.55vw,3.5rem)] lg:whitespace-nowrap")}
            >
              {copy.title}
            </Heading>
            <p {...reveal("up", 0.25, "mt-1.5 font-heading-en text-base tracking-[0.04em] text-gold/90 md:text-xl")}>{copy.subtitle}</p>
          </div>
          {/* Photo (CSS background): mobile = short band in the flow; md+ = the section's left ~58%, behind the text. */}
          {showJournalPhoto ? (
            <div
              role="img"
              aria-label={JOURNAL_PHOTO.alt}
              data-parallax="0.07"
              data-progress="0.9"
              style={{ "--zoom": 0.07 } as React.CSSProperties}
              className={cn(
                "relative -mx-5 h-56 bg-cover bg-[position:58%_45%] sm:h-72",
                "bg-[url('/images/v1/journal/kiyomizu-dera-1000.webp')] md:bg-[url('/images/v1/journal/kiyomizu-dera-2000.webp')]",
                // md+: a little taller than the section, so the light scroll parallax (--py, set on Home) never shows an edge.
                "md:absolute md:-inset-y-[7%] md:left-0 md:-z-10 md:mx-0 md:h-auto md:w-[58%] md:bg-[position:62%_50%]",
                // Scroll-linked camera on Home (wide screens): eases back from a slight push-in and drifts slower than the page.
                revealStyles.sceneCamera,
              )}
            >
              {/* Fades into navy: bottom (mobile) / right (md+); darker top-left behind the title on md+. */}
              <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/30 via-transparent to-navy-dark md:hidden" />
              <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent from-35% via-navy-dark/70 via-75% to-navy-dark md:block" />
              <div className="absolute inset-0 hidden bg-gradient-to-b from-navy-dark/75 via-navy-dark/10 via-30% to-navy-dark/50 md:block" />
              {/* Explore Kansai: an even navy veil softens the photo so the title and articles come forward. */}
              {dimPhoto ? <div className="absolute inset-0 bg-navy-dark/35" /> : null}
            </div>
          ) : null}
          <div {...reveal("fade", 0.35, "flex flex-col justify-end md:pb-1")}>
            <span className="hidden h-px w-full bg-gold/70 md:block" aria-hidden />
            <p className="font-heading-en text-sm text-gold italic md:mt-4 md:text-right md:text-lg">{copy.tagline}</p>
          </div>
        </div>

        {/* Articles: right 55% on md+. */}
        <div className="mt-6 md:mt-5 md:grid md:grid-cols-[45fr_55fr] md:gap-10">
          <div className="hidden md:block" aria-hidden />
          <div>
            {data.items.length === 0 ? (
              <p className="border-y border-gold/25 py-10 text-center text-sm text-cream/70">{emptyText}</p>
            ) : (
              <ul className="border-b border-gold/25">
                {data.items.map((item, i) => (
                  <li key={item.id} {...reveal("up", 0.45 + i * 0.14, "border-t border-gold/25 first:border-t-0 md:first:border-t-0")}>
                    <Link
                      href={item.href}
                      className="group grid grid-cols-[1fr_auto] items-center gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-heading-en text-xs tracking-[0.12em] text-gold uppercase">
                          <span>
                            {item.category} · {item.area}
                          </span>
                          {item.published ? (
                            <>
                              <span className="text-cream/35" aria-hidden>
                                |
                              </span>
                              <span className="tracking-[0.04em] text-cream/75 normal-case">{item.published}</span>
                            </>
                          ) : null}
                          {item.flags.map((f) => (
                            <span key={f} className="border border-cream/30 px-1.5 text-[10px] tracking-[0.12em] text-cream/60">
                              {f}
                            </span>
                          ))}
                        </p>
                        <h3 className="mt-1.5 font-heading-en text-xl leading-snug text-cream transition-colors group-hover:text-gold md:text-[1.45rem]">
                          {item.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-cream/70">{item.summary}</p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-gold transition-transform group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Pagination data={data} />
            {more ? (
              <p {...reveal("fade", 1.05, "mt-6 text-right")}>
                <Link href={more.href} className="inline-flex items-center gap-2 font-heading-en text-sm tracking-[0.08em] text-gold hover:text-cream">
                  {more.label} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

const BOX = "inline-flex h-11 min-w-11 items-center justify-center rounded-[3px] border px-3 font-heading-en text-base transition-colors md:h-12 md:min-w-12";

/** Numbered pages with Previous / Next. Hidden when everything fits on one page. */
function Pagination({ data }: { data: JournalPage }) {
  if (data.totalPages <= 1) return null;
  const { page, totalPages, pageHrefs } = data;
  return (
    <nav aria-label="Journal pages" {...reveal("fade", 1.05, "mt-8 flex flex-wrap items-center justify-center gap-2.5 md:mt-7 md:gap-3")}>
      <PageLink href={page > 1 ? pageHrefs[page - 2] : undefined} label="Previous">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span className="sr-only sm:not-sr-only">Previous</span>
      </PageLink>
      {pageNumbers(page, totalPages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-cream/60" aria-hidden>
            …
          </span>
        ) : n === page ? (
          <span key={n} aria-current="page" className={cn(BOX, "border-gold bg-gold text-navy-dark")}>
            {n}
          </span>
        ) : (
          <Link key={n} href={pageHrefs[n - 1]} aria-label={`Page ${n}`} className={cn(BOX, "border-cream/50 text-cream hover:border-gold hover:text-gold")}>
            {n}
          </Link>
        ),
      )}
      <PageLink href={page < totalPages ? pageHrefs[page] : undefined} label="Next">
        <span className="sr-only sm:not-sr-only">Next</span>
        <ArrowRight className="h-4 w-4" aria-hidden />
      </PageLink>
    </nav>
  );
}

function PageLink({ href, label, children }: { href?: string; label: string; children: React.ReactNode }) {
  const cls = cn(BOX, "gap-2 px-3 sm:px-5");
  return href ? (
    <Link href={href} rel={label === "Next" ? "next" : "prev"} className={cn(cls, "border-gold/70 text-gold hover:bg-gold hover:text-navy-dark")}>
      {children}
    </Link>
  ) : (
    <span aria-disabled="true" className={cn(cls, "cursor-not-allowed border-cream/15 text-cream/30")}>
      {children}
    </span>
  );
}

/** 1 2 3 4 5 … 12 style list: first, last, and up to five around the current page. */
export function pageNumbers(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(page - 2, total - 4));
  const end = Math.min(total, start + 4);
  const out: (number | "…")[] = [];
  if (start > 1) out.push(1, ...(start > 2 ? (["…"] as const) : []));
  for (let n = start; n <= end; n++) out.push(n);
  if (end < total) out.push(...(end < total - 1 ? (["…"] as const) : []), total);
  return out;
}
