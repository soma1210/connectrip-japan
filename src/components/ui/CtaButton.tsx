import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

export function CtaButton({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center bg-red px-8 py-4 text-center text-sm tracking-[0.08em] text-cream transition-colors hover:bg-red-hover",
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
