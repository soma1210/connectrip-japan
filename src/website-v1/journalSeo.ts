import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_NAME } from "./config";
import { JOURNAL_COPY, type JournalArticle } from "./content/journal";
import { absoluteUrl, toGuideMetadata } from "./metadata";
import { journalPageHref } from "./routes";

/**
 * Kansai Travel Journal SEO. Everything comes from the same record the page
 * renders (title = H1, description = summary, dates = shown dates), so the
 * markup never says more than the page. DEMO / unpublished articles are noindex.
 */
const approved = (value: string) => ({ status: "APPROVED" as const, value, source: "Kansai Travel Journal record" });

export function journalListMetadata(page: number): Metadata {
  const title = page > 1 ? `${JOURNAL_COPY.title} – Page ${page}` : JOURNAL_COPY.title;
  return toGuideMetadata({
    title: approved(title),
    description: approved(`${JOURNAL_COPY.subtitle}. ${JOURNAL_COPY.tagline}`),
    canonicalPath: journalPageHref(page),
    noindex: false,
  });
}

export function journalArticleMetadata(a: JournalArticle): Metadata {
  return toGuideMetadata({
    title: approved(a.title),
    description: approved(a.summary),
    canonicalPath: a.href,
    noindex: a.noindex,
    ogType: "article",
    publishedTime: a.noindex ? undefined : a.record.publishedAt,
    modifiedTime: a.noindex ? undefined : (a.record.updatedAt ?? a.record.publishedAt),
  });
}

/** Article JSON-LD for published, real articles only (none for DEMO / drafts). */
export function journalArticleJsonLd(a: JournalArticle): Record<string, unknown> | undefined {
  if (a.noindex) return undefined;
  const organization = { "@type": "Organization", name: ORGANIZATION_NAME, url: SITE_URL };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.summary,
    datePublished: a.record.publishedAt,
    dateModified: a.record.updatedAt ?? a.record.publishedAt,
    author: organization,
    publisher: organization,
    mainEntityOfPage: absoluteUrl(a.href),
    isPartOf: { "@type": "Blog", name: JOURNAL_COPY.title, url: absoluteUrl(journalPageHref(1)) },
    isBasedOn: a.sources.map((s) => s.url),
    inLanguage: "en",
  };
}
