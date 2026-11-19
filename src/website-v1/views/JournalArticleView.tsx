import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { JOURNAL_COPY, type JournalArticle } from "../content/journal";
import { journalPageHref } from "../routes";

/** Kansai Travel Journal article: navy and gold, text only (no photos). */
export function JournalArticleView({ article }: { article: JournalArticle }) {
  return (
    <article className="bg-navy-dark py-12 text-cream md:py-16">
      <Container className="max-w-3xl">
        <Link href={journalPageHref(1)} className="inline-flex items-center gap-2 font-heading-en text-sm tracking-[0.08em] text-gold/80 hover:text-gold">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {JOURNAL_COPY.title}
        </Link>
        <p className="mt-8 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-heading-en text-xs tracking-[0.12em] text-gold uppercase">
          <span>
            {article.category} · {article.area}
          </span>
          {article.flags.map((f) => (
            <span key={f} className="border border-cream/30 px-1.5 text-[10px] text-cream/60">
              {f}
            </span>
          ))}
        </p>
        <h1 className="mt-3 font-heading-en text-3xl leading-tight text-cream md:text-[2.6rem]">{article.title}</h1>
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-1 border-b border-gold/25 pb-6 text-sm text-cream/60">
          {article.published ? (
            <div className="flex gap-1.5">
              <dt>Published</dt>
              <dd className="text-cream/85">{article.published}</dd>
            </div>
          ) : null}
          {article.updated ? (
            <div className="flex gap-1.5">
              <dt>Updated</dt>
              <dd className="text-cream/85">{article.updated}</dd>
            </div>
          ) : null}
          {article.period ? (
            <div className="flex gap-1.5">
              <dt>Dates</dt>
              <dd className="text-cream/85">{article.period}</dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-8 text-lg leading-relaxed text-cream/90">{article.summary}</p>
        <div className="mt-6 flex flex-col gap-5 text-base leading-relaxed text-cream/80">
          {article.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {article.sources.length > 0 ? (
          <section aria-labelledby="official-info" className="mt-10 border-t border-gold/25 pt-6">
            <h2 id="official-info" className="font-heading-en text-sm tracking-[0.15em] text-gold uppercase">
              Official information
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {article.sources.map((s) => (
                <li key={s.url + s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-cream underline decoration-gold/60 underline-offset-4 hover:text-gold">
                    {s.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-cream/50">Details can change. Please check the official information before you go.</p>
          </section>
        ) : null}

        {article.related.length > 0 ? (
          <section aria-labelledby="related-tours" className="mt-10 border-t border-gold/25 pt-6">
            <h2 id="related-tours" className="font-heading-en text-sm tracking-[0.15em] text-gold uppercase">
              Explore with a local guide
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {article.related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="group inline-flex items-center gap-2 font-heading-en text-lg text-cream hover:text-gold">
                    {r.title} <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </article>
  );
}
