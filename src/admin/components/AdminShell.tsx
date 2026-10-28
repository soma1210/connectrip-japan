"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAdmin } from "@/admin/logout";

type NavItem = { label: string; href: string | null };

const GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin/dashboard" }] },
  {
    label: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers" },
      { label: "Inquiries", href: "/admin/inquiries" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Bookings", href: "/admin/bookings" },
      { label: "Private Day Plans", href: "/admin/plans" },
      { label: "Availability", href: null },
      { label: "Guides", href: null },
    ],
  },
  { label: "Insights", items: [{ label: "Analytics", href: null }] },
];

function itemClass(active: boolean) {
  return active
    ? "bg-navy text-white"
    : "text-navy hover:bg-slate-100";
}

function NavLinks({ pathname, compact = false }: { pathname: string; compact?: boolean }) {
  return (
    <div className={compact ? "flex gap-4" : "flex flex-col gap-5"}>
      {GROUPS.map((group) => (
        <div key={group.label} className={compact ? "flex shrink-0 items-center gap-2" : "flex flex-col gap-1"}>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 ${compact ? "sr-only" : "px-2"}`}>
            {group.label}
          </p>
          <div className={compact ? "flex gap-1" : "flex flex-col gap-0.5"}>
            {group.items.map((item) => {
              const active = item.href !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
              if (!item.href) {
                return (
                  <span
                    key={item.label}
                    className="flex items-center justify-between gap-3 whitespace-nowrap rounded-md px-2 py-1.5 text-sm text-slate-400"
                    title="Coming soon"
                  >
                    {item.label}
                    <span className="text-[10px] uppercase tracking-wide">Soon</span>
                  </span>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-2 py-1.5 text-sm ${itemClass(active)} ${compact ? "whitespace-nowrap" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-navy antialiased [font-family:ui-sans-serif,system-ui,sans-serif] leading-normal">
      <div className="lg:flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-200 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Connectrip</p>
            <p className="text-sm font-semibold">Admin</p>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
            <Link href="/admin" className="text-xs text-slate-500 hover:text-navy">
              Site CMS
            </Link>
            <form action={logoutAdmin}>
              <button type="submit" className="text-xs text-slate-500 hover:text-navy">
                Log out
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Connectrip</p>
                <p className="text-sm font-semibold">Admin</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/admin" className="text-xs text-slate-500">
                  Site CMS
                </Link>
                <form action={logoutAdmin}>
                  <button type="submit" className="text-xs text-slate-500">
                    Log out
                  </button>
                </form>
              </div>
            </div>
            <nav className="overflow-x-auto px-3 pb-3" aria-label="Admin">
              <NavLinks pathname={pathname} compact />
            </nav>
          </header>
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
