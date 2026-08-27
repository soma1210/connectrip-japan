"use client";

import { useLocale } from "next-intl";
import { ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ja: "日本語",
  vi: "Tiếng Việt",
};

export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 border border-cream/20 px-3 py-1.5 text-xs tracking-[0.05em] text-cream/70 transition-colors hover:border-cream/40 hover:text-cream"
      >
        <Languages className="h-3.5 w-3.5" />
        Language
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 min-w-[8rem] border border-gold/30 bg-navy-dark">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                router.replace(pathname, { locale: loc });
                setOpen(false);
              }}
              aria-current={locale === loc}
              className={cn(
                "block w-full px-4 py-2.5 text-left text-xs tracking-[0.05em] transition-colors",
                locale === loc ? "text-gold" : "text-cream/70 hover:text-cream",
              )}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
