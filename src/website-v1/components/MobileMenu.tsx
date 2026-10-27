"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { NavItem } from "@/contracts";
import { Container } from "@/components/ui/Container";
import type { RecruitNav } from "../content/pages";
import { RecruitAccordion } from "./RecruitMenu";
import { TbdText } from "./Tbd";

/** Mobile navigation, same behaviour and styles as the current site's Header. */
export function MobileMenu({ items, recruit, children }: { items: NavItem[]; recruit: RecruitNav; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-cream xl:hidden"
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-20 border-t border-gold/20 bg-navy xl:hidden">
          <Container className="flex flex-col gap-5 py-6">
            {items.map((item) => (
              <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className="text-sm tracking-[0.1em] text-cream/80">
                <TbdText value={item.label} slot="Nav label" />
              </Link>
            ))}
            <RecruitAccordion recruit={recruit} onNavigate={() => setOpen(false)} />
            <div className="border-t border-gold/20 pt-5" onClick={() => setOpen(false)}>
              {children}
            </div>
          </Container>
        </div>
      ) : null}
    </>
  );
}
