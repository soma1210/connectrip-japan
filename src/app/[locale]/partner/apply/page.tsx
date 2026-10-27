import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PartnerSurveyForm } from "@/components/partner-survey/PartnerSurveyForm";

// The partner survey is Japanese only. Other locales show the same Japanese
// page (so the header link works from any language) but point search engines
// at the Japanese URL.

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/partner/apply">): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "パートナーアンケート",
    description:
      "Connectrip Japan パートナーアンケート。貴社の体験・サービスと提携条件をお聞かせください。ご回答いただいた内容をもとに、連携の可能性をご相談します。",
    alternates: { canonical: "/partner/apply" },
    robots: locale === routing.defaultLocale ? undefined : { index: false, follow: true },
  };
}

export default async function PartnerApplyPage({ params }: PageProps<"/[locale]/partner/apply">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div lang="ja">
      <PartnerSurveyForm />
    </div>
  );
}
