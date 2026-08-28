"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/cn";
import { Link } from "@/i18n/navigation";
import { trackCtaClick, type CtaPosition } from "@/lib/analytics";
import type { ComponentProps, MouseEvent } from "react";

export function CtaButton({
  href,
  className,
  children,
  onClick,
  ctaId,
  ctaPosition,
  ...rest
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  ctaId: string;
  ctaPosition: CtaPosition;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">) {
  const locale = useLocale();
  const classes = cn(
    "inline-flex items-center justify-center border border-gold bg-red px-8 py-4 text-center text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover",
    className,
  );

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (href === "/reservation") {
      trackCtaClick({
        event: "reserve_cta_click",
        ctaId,
        ctaText: typeof children === "string" ? children : "",
        ctaPosition,
        locale,
      });
    }
    onClick?.(event);
  }

  if (href.startsWith("#")) {
    return (
      <a href={href} className={classes} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
