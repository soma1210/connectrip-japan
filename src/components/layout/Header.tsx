"use client";

import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { logoImage } from "@/data/images";
import { informationLinks, informationKeys } from "@/data/information-links";
import { trackCtaClick } from "@/lib/analytics";
import { LanguageSwitch } from "./LanguageSwitch";

const NAV_ITEMS = [
  { key: "service", hash: "service" },
  { key: "value", hash: "value" },
  { key: "process", hash: "process" },
  { key: "plan", hash: "plan" },
  { key: "faq", hash: "faq" },
  { key: "gallery", hash: "gallery" },
] as const;

const contactButtonClass =
  "whitespace-nowrap border border-gold text-gold px-6 py-2.5 text-xs tracking-[0.1em] transition-colors hover:bg-gold hover:text-navy";

export function Header() {
  const t = useTranslations("nav");
  const th = useTranslations("header");
  const tf = useTranslations("footer");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-dashed border-gold/30 bg-navy/95 backdrop-blur">
      <Container className="flex h-20 items-center justify-between max-w-[1340px]!">
        <a href="#" className="flex items-center gap-3">
          <Image
            src={logoImage}
            alt="Connectrip Japan"
            width={200}
            height={200}
            className="h-16 w-16"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="font-heading-en text-lg tracking-[0.12em] text-cream">
              {th("logoLine1")}
            </span>
            <span className="font-heading-en text-lg tracking-[0.12em] text-cream">
              {th("logoLine2")}
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-10 xl:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={{ pathname: "/", hash: item.hash }}
              className="text-xs tracking-[0.1em] text-cream/80 transition-colors hover:text-gold"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 xl:flex">
          <LanguageSwitch />
          <Link
            href="/contact"
            onClick={() =>
              trackCtaClick({
                event: "contact_cta_click",
                ctaId: "header_contact",
                ctaText: t("contact"),
                ctaPosition: "header",
                locale,
              })
            }
            className={contactButtonClass}
          >
            {t("contact")}
          </Link>
          <Link
            href="/reservation"
            onClick={() =>
              trackCtaClick({
                event: "reserve_cta_click",
                ctaId: "header_reserve",
                ctaText: t("reserve"),
                ctaPosition: "header",
                locale,
              })
            }
            className="whitespace-nowrap border border-gold bg-red px-6 py-2.5 text-xs tracking-[0.1em] text-cream transition-colors hover:bg-red-hover"
          >
            {t("reserve")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-cream xl:hidden"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {open ? (
        <div className="border-t border-gold/20 bg-navy xl:hidden">
          <Container className="flex flex-col gap-5 py-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={{ pathname: "/", hash: item.hash }}
                onClick={() => setOpen(false)}
                className="text-sm tracking-[0.1em] text-cream/80"
              >
                {t(item.key)}
              </Link>
            ))}

            <div className="flex flex-col gap-3 border-t border-gold/20 pt-5">
              <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">
                {tf("informationHeading")}
              </p>
              {informationKeys.map((key) => {
                const href = informationLinks[key];
                if (href) {
                  return (
                    <Link
                      key={key}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="text-sm tracking-[0.1em] text-cream/80"
                    >
                      {tf(`information.${key}`)}
                    </Link>
                  );
                }
                return (
                  <span key={key} className="text-sm tracking-[0.1em] text-cream/40">
                    {tf(`information.${key}`)}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <LanguageSwitch />
              <div className="flex items-center gap-3">
                <Link
                  href="/contact"
                  onClick={() => {
                    trackCtaClick({
                      event: "contact_cta_click",
                      ctaId: "mobile_menu_contact",
                      ctaText: t("contact"),
                      ctaPosition: "mobile_menu",
                      locale,
                    });
                    setOpen(false);
                  }}
                  className={contactButtonClass}
                >
                  {t("contact")}
                </Link>
                <Link
                  href="/reservation"
                  onClick={() => {
                    trackCtaClick({
                      event: "reserve_cta_click",
                      ctaId: "mobile_menu_reserve",
                      ctaText: t("reserve"),
                      ctaPosition: "mobile_menu",
                      locale,
                    });
                    setOpen(false);
                  }}
                  className="border border-gold bg-red px-6 py-2.5 text-xs tracking-[0.1em] text-cream"
                >
                  {t("reserve")}
                </Link>
              </div>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
