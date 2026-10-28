import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Clock3 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// The old partner survey closed on 2026-10-28 (its API answers 410). The URL is
// kept and shows a "coming soon" notice until the new survey (/partner/survey)
// is announced. The old form is in git history.

export const metadata: Metadata = {
  title: "パートナーアンケート（準備中）",
  description: "Connectrip Japan パートナーアンケートは現在準備中です。新しい事業者向けアンケートを近日公開予定です。",
  alternates: { canonical: "/partner/apply" },
  robots: { index: false, follow: true },
};

export default async function PartnerApplyPage({ params }: PageProps<"/[locale]/partner/apply">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div lang="ja" className="bg-cream py-[60px] text-navy md:py-[100px]">
      <Container className="max-w-2xl">
        <div className="rounded-lg border border-navy/10 bg-white px-6 py-12 text-center shadow-sm md:px-12">
          <Clock3 className="mx-auto h-12 w-12 text-gold" strokeWidth={1.5} />
          <p className="mt-6 text-sm font-semibold tracking-[0.15em] text-navy/70">Connectrip Japan</p>
          <h1 className="mt-3 text-2xl font-semibold text-navy md:text-3xl">現在準備中です</h1>
          <p className="mt-5 text-[15px] leading-relaxed text-navy/75">
            新しい事業者向けアンケートを近日公開予定です。
            <br className="hidden sm:inline" />
            公開まで今しばらくお待ちください。
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
            <Link href="/partner" className="text-sm text-navy underline underline-offset-4 hover:text-red">
              パートナー募集ページへ
            </Link>
            <Link href="/" className="text-sm text-navy/60 underline underline-offset-4 hover:text-navy">
              Connectrip Japan トップへ
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
