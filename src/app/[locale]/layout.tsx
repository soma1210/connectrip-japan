import type { Metadata } from "next";
import { Shippori_Mincho_B1 } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE_URL, buildAlternates } from "@/lib/site";
import { businessInfo } from "@/data/business-info";
import { socialLinks } from "@/data/social-links";
import "../globals.css";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

const shipporiMinchoB1 = Shippori_Mincho_B1({
  variable: "--font-shippori-mincho-b1",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: `%s | Connectrip Japan`,
    },
    description: t("description"),
    alternates: buildAlternates(locale as Locale, "/"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: "Connectrip Japan",
      locale:
        locale === "ja"
          ? "ja_JP"
          : locale === "vi"
            ? "vi_VN"
            : locale === "ko"
              ? "ko_KR"
              : locale === "zh-TW"
                ? "zh_TW"
                : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "seo" });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Connectrip Japan",
    legalName: businessInfo.legalNameEn,
    url: `${SITE_URL}${getPathname({ locale, href: "/" })}`,
    logo: `${SITE_URL}/images/logo/logo.png`,
    image: `${SITE_URL}/images/logo/logo.png`,
    description: t("description"),
    email: businessInfo.email,
    telephone: businessInfo.telephone,
    foundingDate: businessInfo.foundingDate,
    address: {
      "@type": "PostalAddress",
      streetAddress: businessInfo.address.streetAddress,
      addressLocality: businessInfo.address.addressLocality,
      addressRegion: businessInfo.address.addressRegion,
      addressCountry: businessInfo.address.addressCountry,
    },
    areaServed: businessInfo.areaServed,
    sameAs: Object.values(socialLinks),
    inLanguage: locale,
  };

  return (
    <html
      lang={locale}
      className={`${shipporiMinchoB1.variable} h-full antialiased`}
    >
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
      <body className="min-h-full flex flex-col bg-navy text-cream">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
