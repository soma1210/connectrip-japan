"use client";

import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { LanguageSwitch } from "./LanguageSwitch";

const NAV_ITEMS = [
  { key: "service", href: "#service" },
  { key: "value", href: "#value" },
  { key: "process", href: "#process" },
  { key: "plan", href: "#plan" },
  { key: "faq", href: "#faq" },
  { key: "gallery", href: "#gallery" },
  { key: "contact", href: "#contact" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const th = useTranslations("header");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-dashed border-gold/30 bg-navy/95 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <a href="#" className="flex flex-col leading-none">
          <span className="font-heading-en text-lg tracking-[0.12em] text-cream">
            {th("logoLine1")}
          </span>
          <span className="font-heading-en text-lg tracking-[0.12em] text-cream">
            {th("logoLine2")}
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-xs tracking-[0.1em] text-cream/80 transition-colors hover:text-gold"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitch />
          <a
            href="#contact"
            className="bg-red px-6 py-2.5 text-xs tracking-[0.1em] text-cream transition-colors hover:bg-red-hover"
          >
            {t("reserve")}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-cream lg:hidden"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {open ? (
        <div className="border-t border-gold/20 bg-navy lg:hidden">
          <Container className="flex flex-col gap-5 py-6">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm tracking-[0.1em] text-cream/80"
              >
                {t(item.key)}
              </a>
            ))}
            <div className="flex items-center justify-between pt-2">
              <LanguageSwitch />
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="bg-red px-6 py-2.5 text-xs tracking-[0.1em] text-cream"
              >
                {t("reserve")}
              </a>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
