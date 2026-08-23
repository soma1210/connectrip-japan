import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { LegalPageHeader } from "@/components/ui/LegalPageHeader";

type CompanyRow = {
  label: string;
  value: string | string[];
  note?: string;
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/company">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "company.seo" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CompanyPage({
  params,
}: PageProps<"/[locale]/company">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("company");
  const rows = t.raw("rows") as CompanyRow[];

  return (
    <div className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-3xl">
        <LegalPageHeader heading={t("heading")} subheading={t("subheading")} />

        <div className="border border-navy/25">
          <dl className="divide-y divide-navy/10">
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid gap-2 px-6 py-6 sm:grid-cols-[180px_1fr] sm:gap-6 md:px-8"
              >
                <dt className="whitespace-pre-line text-sm font-medium text-navy">
                  {row.label}
                </dt>
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
                  {row.note ? (
                    <p className="mt-1.5 text-xs text-navy/40">{row.note}</p>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-10 text-right text-xs text-navy/40">
          {t("footerSignature")}
        </p>
      </Container>
    </div>
  );
}
