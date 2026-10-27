"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { RecruitLink, RecruitNav } from "../content/pages";

function RecruitItem({ item, className, onClick }: { item: RecruitLink; className: string; onClick: () => void }) {
  // Guide Community has its own root layout, so it gets a plain link (full page load).
  return item.external ? (
    <a href={item.href} onClick={onClick} className={className}>
      {item.label}
    </a>
  ) : (
    <Link href={item.href} onClick={onClick} className={className}>
      {item.label}
    </Link>
  );
}

/** Desktop header: opens on hover or click, closes on outside click or Escape. */
export function RecruitDropdown({ recruit }: { recruit: RecruitNav }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Hovering opens the menu, so the click that usually follows must not close it again.
  const openedByHover = useRef(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const itemClass =
    "block whitespace-nowrap px-4 py-2.5 text-xs tracking-[0.08em] text-cream/75 transition-colors hover:bg-navy hover:text-gold focus-visible:bg-navy focus-visible:text-gold focus-visible:outline-none";

  return (
    <div
      ref={ref}
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        openedByHover.current = !open;
        setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        openedByHover.current = false;
        setOpen(false);
      }}
      onBlur={(event) => {
        if (!ref.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (openedByHover.current) {
            openedByHover.current = false;
            return;
          }
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-1 text-xs tracking-[0.1em] transition-colors hover:text-gold",
          open ? "text-gold" : "text-cream/80",
        )}
      >
        {recruit.label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        // pt-3 bridges the gap to the button so the menu stays open while the pointer moves down.
        <div className="absolute left-1/2 top-full z-20 -translate-x-1/2 pt-3">
          <div className="min-w-[11rem] border border-gold/30 bg-navy-dark py-1 shadow-lg">
            {recruit.items.map((item) => (
              <RecruitItem key={item.id} item={item} className={itemClass} onClick={() => setOpen(false)} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Mobile menu: RECRUIT expands in place to show its pages. */
export function RecruitAccordion({ recruit, onNavigate }: { recruit: RecruitNav; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const itemClass = "py-1 text-sm tracking-[0.1em] text-cream/80";

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex items-center justify-between text-left text-sm tracking-[0.1em]",
          open ? "text-gold" : "text-cream/80",
        )}
      >
        {recruit.label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-3 ml-1 flex flex-col gap-2 border-l border-gold/40 pl-4">
          {recruit.items.map((item) => (
            <RecruitItem key={item.id} item={item} className={itemClass} onClick={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
