import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PartnerRegistrationForm } from "@/components/partner-registration/PartnerRegistrationForm";

// 事業者・パートナー向けアンケート. Japanese only, like /partner/apply: other
// locales show the same Japanese page but point search engines at the
// Japanese URL.

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/partner/survey">): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "事業者・パートナー向けアンケート",
    description:
      "Connectrip Japan 事業者・パートナー向けアンケート。飲食店・宿泊施設・体験事業者・旅行会社・観光施設の皆さまへ。まずはお互いを知るための簡単なアンケートです（所要時間 約3分）。",
    alternates: { canonical: "/partner/survey" },
    robots: locale === routing.defaultLocale ? undefined : { index: false, follow: true },
  };
}

export default async function PartnerSurveyPage({ params }: PageProps<"/[locale]/partner/survey">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div lang="ja">
      <PartnerRegistrationForm />
    </div>
  );
}
