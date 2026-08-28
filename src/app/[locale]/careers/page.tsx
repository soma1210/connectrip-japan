import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ComingSoonSection } from "@/components/sections/ComingSoonSection";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/careers">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "careers.seo" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CareersPage({
  params,
}: PageProps<"/[locale]/careers">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations("careers");

  return (
    <ComingSoonSection
      heading={t("heading")}
      subheading={t("subheading")}
      message={t("message")}
    />
  );
}
