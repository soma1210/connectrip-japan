import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { CtaButton } from "@/components/ui/CtaButton";
import { FadeIn } from "@/components/ui/FadeIn";
import { Link } from "@/i18n/navigation";
import { FIELDS, INDUSTRIES, STEPS } from "@/features/partner-survey/config/questions";

// Partner recruiting page (Japanese only, like the survey it links to).

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/partner">): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "パートナー募集",
    description:
      "Connectrip Japanでは、地域の体験・サービスを訪日旅行者へ一緒に届けるパートナー事業者様を募集しています。パートナーアンケートから貴社の情報と提携条件をお聞かせください。",
    alternates: { canonical: "/partner" },
    robots: locale === routing.defaultLocale ? undefined : { index: false, follow: true },
  };
}

const FLOW = [
  { title: "アンケートに回答", text: "貴社の体験・サービスと提携条件をお聞かせください。未確定の条件は「要相談」で構いません。" },
  { title: "回答内容を確認", text: "Connectrip Japanが回答内容を確認し、必要に応じて担当者よりご連絡します。" },
  { title: "条件のご相談・提携の検討", text: "連携の可能性について、条件を含めてご相談します。" },
];

function ApplyButton({ ctaId }: { ctaId: string }) {
  return (
    <CtaButton href="/partner/apply" ctaId={ctaId} ctaPosition="section" className="gap-2">
      パートナーアンケートに回答する
      <ArrowRight className="h-4 w-4" />
    </CtaButton>
  );
}

export default async function PartnerPage({ params }: PageProps<"/[locale]/partner">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div lang="ja">
      {/* Hero */}
      <section className="bg-navy py-16 text-center md:py-24">
        <Container className="max-w-3xl">
          <FadeIn>
            <p className="text-xs tracking-[0.25em] text-gold">PARTNER PROGRAM</p>
            <h1 className="mt-5 font-heading-jp text-3xl leading-snug text-cream md:text-5xl">
              地域の魅力を、
              <br />
              <span className="text-gold">一緒に旅へ。</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-loose text-cream/75 md:text-base">
              Connectrip Japanでは、地域ならではの体験・サービスを
              <br className="hidden sm:inline" />
              訪日旅行者へ一緒に届けるパートナー事業者様を募集しています。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-cream/70">
              <span className="inline-flex items-center gap-1.5 border border-gold/30 px-3 py-1.5">
                <Clock3 className="h-3.5 w-3.5 text-gold" /> 回答の目安 5〜10分
              </span>
              <span className="inline-flex items-center gap-1.5 border border-gold/30 px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" /> 回答内容は一般公開されません
              </span>
            </div>
            <div className="mt-10">
              <ApplyButton ctaId="partner_hero_apply" />
            </div>
          </FadeIn>
        </Container>
      </section>

      <div className="bg-cream py-16 text-navy md:py-24">
        <Container className="flex max-w-5xl flex-col gap-16 md:gap-24">
          {/* Who we are looking for */}
          <section>
            <FadeIn className="text-center">
              <p className="text-xs tracking-[0.2em] text-red">WHO WE ARE LOOKING FOR</p>
              <h2 className="mt-3 font-heading-jp text-2xl md:text-3xl">募集している事業者様</h2>
              <p className="mt-4 text-sm leading-relaxed text-navy/65">
                旅行者向けの体験・サービスを提供している、次のような事業者様からのご回答をお待ちしています。
              </p>
            </FadeIn>
            <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {INDUSTRIES.map((industry) => (
                <li
                  key={industry.value}
                  className="flex min-h-20 items-center justify-center border border-navy/15 bg-white px-3 py-5 text-center text-sm shadow-sm"
                >
                  {industry.value === "other" ? "その他 旅行者向けサービス" : industry.label}
                </li>
              ))}
            </ul>
          </section>

          {/* What the survey asks */}
          <section>
            <FadeIn className="text-center">
              <p className="text-xs tracking-[0.2em] text-red">QUESTIONNAIRE</p>
              <h2 className="mt-3 font-heading-jp text-2xl md:text-3xl">アンケートでお伺いする内容</h2>
              <p className="mt-4 text-sm leading-relaxed text-navy/65">
                4つのステップでご回答いただき、最後に内容を確認してから送信します。
              </p>
            </FadeIn>
            <ol className="mt-10 grid gap-4 md:grid-cols-2">
              {STEPS.map((step, index) => (
                <li key={step.id} className="border border-navy/15 bg-white p-6 shadow-sm md:p-8">
                  <p className="text-xs tracking-[0.2em] text-red">STEP {String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 font-heading-jp text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy/65">{step.subtitle}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {step.fields.map((key) => (
                      <li key={key} className="bg-cream px-2.5 py-1 text-xs text-navy/75">
                        {FIELDS[key].label}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          {/* Flow */}
          <section>
            <FadeIn className="text-center">
              <p className="text-xs tracking-[0.2em] text-red">FLOW</p>
              <h2 className="mt-3 font-heading-jp text-2xl md:text-3xl">ご回答後の流れ</h2>
            </FadeIn>
            <ol className="mt-10 flex flex-col gap-3">
              {FLOW.map((item, index) => (
                <li
                  key={item.title}
                  className="flex flex-col gap-2 border border-navy/15 bg-white p-6 shadow-sm md:flex-row md:items-center md:gap-10 md:p-8"
                >
                  <p className="shrink-0 text-lg font-medium md:w-72">
                    <span className="text-red">{String(index + 1).padStart(2, "0")}.</span> {item.title}
                  </p>
                  <p className="text-sm leading-relaxed text-navy/70">{item.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-center text-xs text-navy/50">ご回答時点で提携が成立するものではありません。</p>
          </section>
        </Container>
      </div>

      {/* Final CTA */}
      <section className="bg-navy py-16 text-center md:py-20">
        <Container className="max-w-2xl">
          <h2 className="font-heading-jp text-2xl leading-snug text-cream md:text-3xl">
            ひとつのつながりから、
            <br />
            新しい旅の可能性を。
          </h2>
          <div className="mt-8">
            <ApplyButton ctaId="partner_bottom_apply" />
          </div>
          <p className="mt-8 text-xs text-cream/55">
            アンケート以外のご相談は{" "}
            <Link href="/business-inquiry" className="text-gold underline underline-offset-4 hover:text-cream">
              法人・企業向けお問い合わせ
            </Link>{" "}
            からご連絡ください。
          </p>
        </Container>
      </section>
    </div>
  );
}
