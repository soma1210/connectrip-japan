"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { NavItem } from "@/contracts";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import type { RecruitNav } from "../content/pages";
import { RecruitAccordion } from "./RecruitMenu";
import { TbdText } from "./Tbd";

/** Mobile navigation, same behaviour and styles as the current site's Header. */
export function MobileMenu({
  items,
  recruit,
  children,
  ctaClassName,
}: {
  items: NavItem[];
  recruit: RecruitNav;
  /** CTAs, shown first so they are visible as soon as the menu opens. */
  children: ReactNode;
  /** Hides the CTA block where the header already shows the CTAs. */
  ctaClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-cream min-[1340px]:hidden"
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-20 border-t border-gold/20 bg-navy min-[1340px]:hidden">
          <Container className="flex flex-col gap-5 py-6">
            <div className={cn("flex flex-wrap gap-3 border-b border-gold/20 pb-5", ctaClassName)} onClick={() => setOpen(false)}>
              {children}
            </div>
            {items.map((item) => (
              <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className="text-sm tracking-[0.1em] text-cream/80">
                <TbdText value={item.label} slot="Nav label" />
              </Link>
            ))}
            <RecruitAccordion recruit={recruit} onNavigate={() => setOpen(false)} />
          </Container>
        </div>
      ) : null}
    </>
  );
}
