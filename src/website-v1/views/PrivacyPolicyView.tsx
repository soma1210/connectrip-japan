import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { LegalPageHeader } from "@/components/ui/LegalPageHeader";
import { V1_PREVIEW } from "../config";
import {
  PRIVACY_PENDING,
  PRIVACY_POLICY,
  PRIVACY_POLICY_APPROVAL,
  PRIVACY_POLICY_SOURCE,
  PRIVACY_TECH_CHECKS,
  type PendingKey,
  type PolicyBlock,
  type PolicySection,
} from "../content/privacyPolicy";

/**
 * Privacy Policy V1 page. Same look as the other legal pages (cream sheet,
 * LegalPageHeader, numbered sections; see CancellationPolicyView), plus a
 * contents list because the policy is long.
 *
 * `{{key}}` placeholders: in the preview they show the proposed value with a
 * "to confirm" marker (or a "to be confirmed" slot). The page is never
 * rendered in public mode while any placeholder is left (privacyPolicy.ts).
 */
function Pending({ k }: { k: PendingKey }) {
  const item = PRIVACY_PENDING[k];
  return (
    <span className="rounded-sm border border-dashed border-red/60 bg-red/5 px-1 text-red" title={item.check}>
      {item.proposed ?? `[${item.label}]`}
      <span className="ml-1 text-[10px] tracking-wide uppercase">to confirm</span>
    </span>
  );
}

/** Text with `{{key}}` placeholders and bare https:// links. */
function Text({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /\{\{(\w+)\}\}|(https:\/\/[^\s]+[^\s.,;)])/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<Pending key={m.index} k={m[1] as PendingKey} />);
    else
      parts.push(
        <a key={m.index} href={m[2]} target="_blank" rel="noopener noreferrer" className="break-all text-red underline underline-offset-2 hover:text-navy">
          {m[2]}
        </a>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function Block({ block }: { block: PolicyBlock }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="mt-3 text-sm leading-loose text-navy/75">
          <Text text={block.text} />
        </p>
      );
    case "h3":
      return <h3 className="mt-7 text-sm font-medium tracking-wide text-navy">{block.text}</h3>;
    case "ul":
      return (
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-loose text-navy/75 marker:text-navy/40">
          {block.items.map((item, i) => (
            <li key={i}>
              <Text text={item} />
            </li>
          ))}
        </ul>
      );
    case "dl":
      return (
        <dl className="mt-4 border-t border-navy/15 text-sm">
          {block.items.map(([term, text]) => (
            <div key={term} className="grid gap-1 border-b border-navy/15 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="text-xs tracking-wide text-navy/55 sm:text-sm">{term}</dt>
              <dd className="text-navy/80">
                <Text text={text} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        // min-w-0 parents + overflow-x-auto: the table scrolls inside its box on phones.
        <div className="mt-5 overflow-x-auto">
          <table className={`w-full border-collapse text-[13px] md:text-sm ${block.headers.length > 2 ? "min-w-[520px]" : ""}`}>
            <thead>
              <tr>
                {block.headers.map((h) => (
                  <th key={h} className="border border-navy/15 bg-navy/5 px-3 py-2.5 text-left align-top font-medium text-navy">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="border border-navy/15 px-3 py-2.5 align-top leading-relaxed text-navy/80">
                      <Text text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function PrivacyPolicyView() {
  const c = PRIVACY_POLICY;
  const sections = c.sections as PolicySection[];
  const draft = PRIVACY_POLICY_APPROVAL === null;
  return (
    <div lang="en" className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-3xl">
        {V1_PREVIEW && draft ? (
          <p className="mb-8 border border-dashed border-navy/40 bg-cream-dark/60 px-4 py-2.5 text-xs leading-relaxed text-navy/70">
            Preview only · DRAFT pending legal review and owner confirmation. Not approved for publication. Items marked
            <span className="mx-1 text-red">TO CONFIRM</span>are not decided yet.
            <span className="mt-1 block text-navy/50">{PRIVACY_POLICY_SOURCE}</span>
            {PRIVACY_TECH_CHECKS.filter((c) => !c.done).map((c) => (
              <span key={c.id} className="mt-1 block text-navy/50">
                Technical check not done: {c.label}
              </span>
            ))}
          </p>
        ) : null}

        <LegalPageHeader heading={c.heading} subheading={c.subheading} />

        <p className="text-xs text-navy/60">
          Last updated: <Text text={c.lastUpdated} />
        </p>

        <nav aria-label="Contents" className="mt-10 border border-navy/15 bg-white/50 px-5 py-5 md:px-7">
          <p className="text-xs tracking-[0.2em] text-navy/55">CONTENTS</p>
          <ol className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-flex min-h-8 items-baseline gap-2 text-navy/80 hover:text-red">
                  <span className="w-5 shrink-0 text-right text-xs text-navy/45 tabular-nums">{s.number}.</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-14 flex flex-col gap-12 md:mt-16 md:gap-14">
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="flex scroll-mt-28 gap-4 md:gap-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm text-cream">{s.number}</span>
              <div className="min-w-0 flex-1">
                <h2 id={`${s.id}-title`} className="pt-1 text-base font-medium text-navy md:text-lg">
                  {s.title}
                </h2>
                {s.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
                {V1_PREVIEW && s.pending ? (
                  <p lang="ja" className="mt-4 border-l-2 border-red/50 bg-red/5 px-3 py-2 text-xs leading-relaxed text-navy/60">
                    要確認（プレビューのみ表示）: {s.pending}
                  </p>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 text-center text-xs text-navy/40">Connectrip Japan Co., Ltd.</p>
      </Container>
    </div>
  );
}
