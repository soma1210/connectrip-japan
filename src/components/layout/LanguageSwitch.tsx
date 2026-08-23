"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";

const LABELS: Record<string, string> = { en: "EN", ja: "JP" };

export function LanguageSwitch({
  className,
  variant = "pill",
}: {
  className?: string;
  variant?: "pill" | "boxed";
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  if (variant === "boxed") {
    return (
      <div className={cn("flex items-center gap-2 text-xs", className)}>
        {routing.locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => router.replace(pathname, { locale: loc })}
            aria-current={locale === loc}
            className={cn(
              "border px-3 py-1.5 transition-colors",
              locale === loc
                ? "border-gold text-gold"
                : "border-cream/20 text-cream/60 hover:border-cream/40 hover:text-cream",
            )}
          >
            {LABELS[loc]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 border border-cream/20 px-2 py-1 text-xs",
        className,
      )}
    >
      {routing.locales.map((loc, index) => (
        <span key={loc} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-cream/25">|</span>}
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: loc })}
            aria-current={locale === loc}
            className={cn(
              "px-0.5 transition-colors",
              locale === loc ? "text-gold" : "text-cream/60 hover:text-cream",
            )}
          >
            {LABELS[loc]}
          </button>
        </span>
      ))}
    </div>
  );
}
