"use client";

import { useLocale, useTranslations } from "next-intl";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { socialLinks } from "@/data/social-links";
import { logoImage } from "@/data/images";
import { informationLinks, informationKeys } from "@/data/information-links";
import { trackCtaClick } from "@/lib/analytics";
import { LanguageSwitch } from "./LanguageSwitch";

const SNS_ICONS = {
  tiktok: FaTiktok,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  facebook: FaFacebookF,
} as const;

const FOOTER_NAV = [
  { key: "service", hash: "service" },
  { key: "process", hash: "process" },
  { key: "plan", hash: "plan" },
  { key: "reservation", href: "/reservation" },
] as const;

const contactButtonClass =
  "inline-block border border-gold text-gold px-4 py-2 text-xs tracking-[0.1em] transition-colors hover:bg-gold hover:text-navy";

export function Footer() {
  const t = useTranslations("footer");
  const th = useTranslations("header");
  const locale = useLocale();

  return (
    <footer className="border-t border-dashed border-gold/30 bg-navy-dark">
      <Container className="grid gap-10 py-14 md:grid-cols-3 md:gap-8">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src={logoImage}
              alt="Connectrip Japan"
              width={200}
              height={200}
              className="h-16 w-16"
            />
            <div className="flex flex-col leading-none">
              <span className="font-heading-en text-lg tracking-[0.12em] text-cream">
                {th("logoLine1")}
              </span>
              <span className="font-heading-en text-lg tracking-[0.12em] text-cream">
                {th("logoLine2")}
              </span>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm text-cream/60">{t("tagline")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <LanguageSwitch />
            <Link
              href="/contact"
              onClick={() =>
                trackCtaClick({
                  event: "contact_cta_click",
                  ctaId: "footer_contact",
                  ctaText: t("nav.contact"),
                  ctaPosition: "footer",
                  locale,
                })
              }
              className={contactButtonClass}
            >
              {t("nav.contact")}
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {(["tiktok", "instagram", "whatsapp", "facebook"] as const).map(
              (platform) => {
                const Icon = SNS_ICONS[platform];
                return (
                  <a
                    key={platform}
                    href={socialLinks[platform]}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-9 w-9 items-center justify-center border border-cream/20 text-cream/70 transition-colors hover:border-gold hover:text-gold"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              },
            )}
          </div>
        </div>

        <div>
          <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">
            {t("navigationHeading")}
          </p>
          <nav className="mt-4 flex flex-col gap-3">
            {FOOTER_NAV.map((item) => (
              <Link
                key={item.key}
                href={"hash" in item ? { pathname: "/", hash: item.hash } : item.href}
                onClick={
                  item.key === "reservation"
                    ? () =>
                        trackCtaClick({
                          event: "reserve_cta_click",
                          ctaId: "footer_reserve",
                          ctaText: t("nav.reservation"),
                          ctaPosition: "footer",
                          locale,
                        })
                    : undefined
                }
                className="text-sm text-cream/70 transition-colors hover:text-gold"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">
            {t("informationHeading")}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {informationKeys.map((key) => {
              const href = informationLinks[key];
              if (href) {
                return (
                  <Link
                    key={key}
                    href={href}
                    className="text-sm text-cream/70 transition-colors hover:text-gold"
                  >
                    {t(`information.${key}`)}
                  </Link>
                );
              }
              return (
                <span key={key} className="text-sm text-cream/50">
                  {t(`information.${key}`)}
                </span>
              );
            })}
          </div>
        </div>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-cream/10 py-6 text-xs text-cream/40 md:flex-row md:items-center md:justify-between">
        <span>
          &copy; {new Date().getFullYear()} {t("copyright")}
        </span>
        <span className="font-heading-en tracking-[0.1em]">
          CONNECTRIP JAPAN
        </span>
      </Container>
    </footer>
  );
}
