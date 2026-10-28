import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { recruitHref, routeHref } from "../routes";

// Partner Recruitment (ported from the current site's /partner, 2026-10-27).
// The partner pages are Japanese only: they address businesses in Japan.
// 2026-10-28: the old survey's question list was removed; this page only introduces the partner program.

const PARTNER_TYPES = [
  "飲食店",
  "ホテル・宿泊施設",
  "体験・アクティビティ事業者",
  "旅行会社・旅行代理店",
  "観光施設",
  "その他の観光関連事業者",
];

const COLLABORATION = [
  { title: "旅行者へのご紹介", text: "ガイドツアーや旅のご相談の中で、訪日旅行者に貴社の店舗・施設・体験をご紹介します。" },
  { title: "旅程への組み込み", text: "プライベートガイドの旅程や体験プランに、地域ならではの場所として組み込みます。" },
  { title: "地域の魅力を一緒に発信", text: "地域の文化や魅力を、Connectrip Japanのサイトや旅の現場を通じて一緒に伝えます。" },
];

const FLOW = [
  { title: "アンケートに回答", text: "事業者向けアンケートで、貴社の事業内容をお聞かせください。" },
  { title: "回答内容を確認", text: "Connectrip Japanが回答内容を確認し、必要に応じて担当者よりご連絡します。" },
  { title: "条件のご相談・提携の検討", text: "連携の可能性について、条件を含めてご相談します。" },
];

// Same classes as CtaLink "primary". Not a CtaLink: the partner survey is not a contract CtaDestination.
const APPLY_CLASS =
  "inline-flex items-center justify-center gap-2 border border-gold bg-red px-8 py-4 text-center text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover";

function ApplyButton({ ctaId }: { ctaId: string }) {
  return (
    <Link href={recruitHref("partnerApply")} className={APPLY_CLASS} data-cta-id={ctaId} data-cta-position="section">
      パートナーアンケートに回答する
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function PartnerRecruitView() {
  return (
    <div lang="ja">
      {/* Hero */}
      <section className="bg-navy py-16 text-center md:py-24">
        <Container className="max-w-3xl">
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
              <ShieldCheck className="h-3.5 w-3.5 text-gold" /> 回答内容は一般公開されません
            </span>
          </div>
          <div className="mt-10">
            <ApplyButton ctaId="v1_partner_hero_apply" />
          </div>
        </Container>
      </section>

      <div className="bg-cream py-16 text-navy md:py-24">
        <Container className="flex max-w-5xl flex-col gap-16 md:gap-24">
          {/* Who we are looking for */}
          <section>
            <div className="text-center">
              <p className="text-xs tracking-[0.2em] text-red">WHO WE ARE LOOKING FOR</p>
              <h2 className="mt-3 font-heading-jp text-2xl md:text-3xl">募集している事業者様</h2>
              <p className="mt-4 text-sm leading-relaxed text-navy/65">
                訪日旅行者を迎える、次のような事業者様との連携を広げていきたいと考えています。
              </p>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
              {PARTNER_TYPES.map((type) => (
                <li
                  key={type}
                  className="flex min-h-20 items-center justify-center border border-navy/15 bg-white px-3 py-5 text-center text-sm shadow-sm"
                >
                  {type}
                </li>
              ))}
            </ul>
          </section>

          {/* What we want to do together */}
          <section>
            <div className="text-center">
              <p className="text-xs tracking-[0.2em] text-red">COLLABORATION</p>
              <h2 className="mt-3 font-heading-jp text-2xl md:text-3xl">一緒に取り組みたいこと</h2>
            </div>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {COLLABORATION.map((item) => (
                <li key={item.title} className="border border-navy/15 bg-white p-6 shadow-sm md:p-8">
                  <h3 className="font-heading-jp text-lg">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-navy/65">{item.text}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Flow */}
          <section>
            <div className="text-center">
              <p className="text-xs tracking-[0.2em] text-red">FLOW</p>
              <h2 className="mt-3 font-heading-jp text-2xl md:text-3xl">ご回答後の流れ</h2>
            </div>
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
            <ApplyButton ctaId="v1_partner_bottom_apply" />
          </div>
          <p className="mt-8 text-xs text-cream/55">
            アンケート以外のご相談は{" "}
            <Link href={routeHref("businessInquiry")} className="text-gold underline underline-offset-4 hover:text-cream">
              法人・企業向けお問い合わせ
            </Link>{" "}
            からご連絡ください。
          </p>
        </Container>
      </section>
    </div>
  );
}

// The simple survey form was removed (2026-10-28). The URL stays; the new survey will be placed here.
export function PartnerApplyView() {
  return (
    <div lang="ja">
      <section className="bg-cream py-24 text-center text-navy md:py-32">
        <Container className="max-w-2xl">
          <p className="text-xs tracking-[0.25em] text-red">PARTNER SURVEY</p>
          <h1 className="mt-5 font-heading-jp text-2xl leading-relaxed md:text-3xl">現在準備中です。</h1>
          <p className="mt-6 text-sm leading-loose text-navy/70 md:text-base">
            新しい事業者向けアンケートを近日公開予定です。
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
            <Link href={recruitHref("partner")} className="text-red underline underline-offset-4 hover:text-navy">
              パートナー募集ページへ戻る
            </Link>
            <Link href={routeHref("home")} className="text-red underline underline-offset-4 hover:text-navy">
              トップページへ
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
