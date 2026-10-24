import type { CancellationPolicyViewModel, CompanyProfileViewModel } from "@/contracts";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { LegalPageHeader } from "@/components/ui/LegalPageHeader";
import { TbdMark } from "../components/Tbd";

/**
 * Company Profile and Cancellation Policy, ported from the current site
 * (W1-D09, WORKING_BASELINE). Markup and classes are the current site's
 * `[locale]/company` and `[locale]/cancel-policy` pages; data comes from the
 * view model instead of next-intl.
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
        <LegalPageHeader heading={c.heading} subheading={c.subheading} />

        <p className="whitespace-pre-line text-sm leading-loose text-navy/80">{c.intro}</p>

        <div className="mt-14 flex flex-col gap-12 md:mt-20 md:gap-16">
          {c.sections.map((section) => (
            <FadeIn key={section.number} className="flex gap-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm text-cream">
                {section.number}
              </span>
              <div className="flex-1">
                <h2 className="text-base font-medium text-navy md:text-lg">{section.title}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-loose text-navy/75">{section.body}</p>

                {section.table ? (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-sm">
                      <thead>
                        <tr>
                          {section.table.headers.map((header) => (
                            <th key={header} className="border border-navy/15 bg-navy/5 px-4 py-2.5 text-left font-medium text-navy">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row, index) => (
                          <tr key={row[0]} className={index === 0 ? "outline outline-2 -outline-offset-2 outline-navy" : ""}>
                            <td className="border border-navy/15 px-4 py-2.5 text-navy/80">{row[0]}</td>
                            <td className="border border-navy/15 px-4 py-2.5 text-navy/80">{row[1]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

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
