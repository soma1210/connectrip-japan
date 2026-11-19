import type { CancellationPolicyViewModel, CompanyProfileViewModel } from "@/contracts";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { LegalPageHeader } from "@/components/ui/LegalPageHeader";
import { TbdMark } from "../components/Tbd";
import { V1_PREVIEW } from "../config";

/**
 * Company Profile and Cancellation Policy, ported from the current site
 * (W1-D09, WORKING_BASELINE). Markup and classes are the current site's
 * `[locale]/company` and `[locale]/cancel-policy` pages; data comes from the
 * view model instead of next-intl. The Cancellation Policy text is v1's own
 * (content/cancellationPolicy.ts); only the page markup comes from the current site.
 */

function TbdPage({ slot, note }: { slot: string; note?: string }) {
  return (
    <div className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-3xl">
        <div className="flex min-h-40 items-center justify-center border border-dashed border-navy/30 p-8">
          <TbdMark slot={slot} note={note} tone="light" />
        </div>
      </Container>
    </div>
  );
}

export function CompanyProfileView({ vm }: { vm: CompanyProfileViewModel }) {
  if (vm.content.status === "TBD") return <TbdPage slot="Company Profile" note={vm.content.note} />;
  const c = vm.content.value;

  return (
    <div lang="en" className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-3xl">
        <LegalPageHeader heading={c.heading} subheading={c.subheading} />

        <div className="border border-navy/25">
          <dl className="divide-y divide-navy/10">
            {c.rows.map((row) => (
              <div key={row.label} className="grid gap-2 px-6 py-6 sm:grid-cols-[180px_1fr] sm:gap-6 md:px-8">
                <dt className="whitespace-pre-line text-sm font-medium text-navy">{row.label}</dt>
                <dd className="text-sm leading-relaxed text-navy/80">
                  {Array.isArray(row.value) ? (
                    <ul className="space-y-1.5">
                      {row.value.map((item) => (
                        <li key={item}>・{item}</li>
                      ))}
                    </ul>
                  ) : (
                    row.value
                  )}
                  {row.note ? <p className="mt-1.5 text-xs text-navy/40">{row.note}</p> : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {c.footerSignature ? <p className="mt-10 text-right text-xs text-navy/40">{c.footerSignature}</p> : null}
      </Container>
    </div>
  );
}

export function CancellationPolicyView({ vm }: { vm: CancellationPolicyViewModel }) {
  if (vm.content.status === "TBD") return <TbdPage slot="Cancellation Policy" note={vm.content.note} />;
  const c = vm.content.value;

  return (
    <div lang="en" className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-3xl">
        {/* Preview only: the policy text is a draft until a human records its legal approval. */}
        {V1_PREVIEW && vm.content.status === "PROPOSED" ? (
          <p className="mb-8 border border-dashed border-navy/40 bg-cream-dark/60 px-4 py-2.5 text-xs leading-relaxed text-navy/70">
            Preview only · DRAFT pending legal review. Not approved for publication.
            {vm.content.source ? <span className="mt-1 block text-navy/50">{vm.content.source}</span> : null}
          </p>
        ) : null}

        <LegalPageHeader heading={c.heading} subheading={c.subheading} />

        {c.intro ? <p className="whitespace-pre-line text-sm leading-loose text-navy/80">{c.intro}</p> : null}

        <div className="mt-14 flex flex-col gap-12 md:mt-20 md:gap-16">
          {c.sections.map((section) => (
            <FadeIn key={section.number} className="flex gap-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm text-cream">
                {section.number}
              </span>
              {/* min-w-0: let the fee table scroll inside its box instead of widening the page on phones. */}
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-medium text-navy md:text-lg">{section.title}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-loose text-navy/75">{section.body}</p>

                {section.table ? (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full border-collapse text-[13px] md:min-w-[420px] md:text-sm">
                      <thead>
                        <tr>
                          {section.table.headers.map((header, col) => (
                            <th key={header} className={`border border-navy/15 bg-navy/5 px-2 py-2.5 sm:px-2.5 font-medium text-navy md:px-4 ${col === 0 ? "text-left" : "text-right"}`}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row, index) => (
                          <tr key={row[0]} className={index === 0 ? "outline outline-2 -outline-offset-2 outline-navy" : ""}>
                            {row.map((cell, col) => (
                              <td key={col} className={`border border-navy/15 px-2 py-2.5 sm:px-2.5 text-navy/80 md:px-4 ${col === 0 ? "text-left" : "text-right tabular-nums"}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {section.afterTable ? <p className="mt-5 whitespace-pre-line text-sm leading-loose text-navy/75">{section.afterTable}</p> : null}

                {section.note ? <p className="mt-4 text-xs text-navy/40">{section.note}</p> : null}
              </div>
            </FadeIn>
          ))}
        </div>

        {c.footerSignature ? <p className="mt-16 text-center text-xs text-navy/40">{c.footerSignature}</p> : null}
      </Container>
    </div>
  );
}
