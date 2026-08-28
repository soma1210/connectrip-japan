import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { LegalPageHeader } from "@/components/ui/LegalPageHeader";
import { FadeIn } from "@/components/ui/FadeIn";
import { buildAlternates } from "@/lib/site";

type PolicySection = {
  number: number;
  title: string;
  body: string;
  note?: string;
  table?: {
    headers: [string, string];
    rows: [string, string][];
  };
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cancel-policy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cancelPolicy.seo" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(locale as Locale, "/cancel-policy"),
  };
}

export default async function CancelPolicyPage({
  params,
}: PageProps<"/[locale]/cancel-policy">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("cancelPolicy");
  const sections = t.raw("sections") as PolicySection[];

  return (
    <div className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-3xl">
        <LegalPageHeader heading={t("heading")} subheading={t("subheading")} />

        <p className="whitespace-pre-line text-sm leading-loose text-navy/80">
          {t("intro")}
        </p>

        <div className="mt-14 flex flex-col gap-12 md:mt-20 md:gap-16">
          {sections.map((section) => (
            <FadeIn key={section.number} className="flex gap-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm text-cream">
                {section.number}
              </span>
              <div className="flex-1">
                <h2 className="text-base font-medium text-navy md:text-lg">
                  {section.title}
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-loose text-navy/75">
                  {section.body}
                </p>

                {section.table ? (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-sm">
                      <thead>
                        <tr>
                          {section.table.headers.map((header) => (
                            <th
                              key={header}
                              className="border border-navy/15 bg-navy/5 px-4 py-2.5 text-left font-medium text-navy"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row, index) => (
                          <tr
                            key={row[0]}
                            className={
                              index === 0 ? "outline outline-2 -outline-offset-2 outline-navy" : ""
                            }
                          >
                            <td className="border border-navy/15 px-4 py-2.5 text-navy/80">
                              {row[0]}
                            </td>
                            <td className="border border-navy/15 px-4 py-2.5 text-navy/80">
                              {row[1]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {section.note ? (
                  <p className="mt-4 text-xs text-navy/40">{section.note}</p>
                ) : null}
              </div>
            </FadeIn>
          ))}
        </div>

        <p className="mt-16 text-center text-xs text-navy/40">
          {t("footerSignature")}
        </p>
      </Container>
    </div>
  );
}
