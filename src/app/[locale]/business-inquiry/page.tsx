import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { BusinessInquirySection } from "@/components/sections/BusinessInquirySection";
import { buildAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/business-inquiry">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessInquiry.seo" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(locale as Locale, "/business-inquiry"),
  };
}

export default async function BusinessInquiryPage({
  params,
}: PageProps<"/[locale]/business-inquiry">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return <BusinessInquirySection />;
}
