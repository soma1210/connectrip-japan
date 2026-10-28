"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Connectrip Japan 管理画面: one entry point and one navigation for every admin
// screen. Each screen keeps its own data (guide_applications, partner_registrations,
// gallery, blog, reviews); only the frame is shared.

type NavItem = { label: string; href: string };

const HOME: NavItem = { label: "管理トップ", href: "/admin" };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "応募管理",
    items: [
      { label: "ガイド応募", href: "/admin/guide-applications" },
      { label: "事業者アンケート", href: "/admin/partner-registrations" },
    ],
  },
  {
    label: "コンテンツ",
    items: [
      { label: "ギャラリー", href: "/admin/gallery" },
      { label: "ブログ", href: "/admin/vlog" },
      { label: "レビュー", href: "/admin/reviews" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === HOME.href ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-md px-3 py-2 text-sm ${active ? "bg-navy font-medium text-white" : "text-navy hover:bg-slate-100"}`}
    >
      {item.label}
    </Link>
  );
}

function NavList({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col gap-5">
      <NavLink item={HOME} pathname={pathname} />
      {GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.12em] text-slate-400">{group.label}</p>
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Connectrip Japan</span>
      <span className="block text-sm font-semibold text-navy">管理画面</span>
    </Link>
  );
}

function LogoutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button type="submit" className="whitespace-nowrap text-xs text-slate-500 hover:text-navy">
        ログアウト
      </button>
    </form>
  );
}

export function AdminConsoleShell({ children, logout }: { children: ReactNode; logout: () => Promise<void> }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-navy lg:flex">
      {/* PC: left sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-4 py-4">
          <Brand />
          <LogoutButton action={logout} />
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="管理画面">
          <NavList pathname={pathname} />
        </nav>
      </aside>

      {/* Phones and tablets: a menu that opens downwards, never sideways.
          key={pathname} closes it again after moving to another screen. */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white lg:hidden">
        <details key={pathname} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <Brand />
            <span className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium">
              <span className="group-open:hidden">メニュー</span>
              <span className="hidden group-open:inline">閉じる</span>
            </span>
          </summary>
          <nav className="border-t border-slate-200 px-2 py-3" aria-label="管理画面">
            <NavList pathname={pathname} />
            <div className="mt-4 border-t border-slate-200 px-3 pt-3">
              <LogoutButton action={logout} />
            </div>
          </nav>
        </details>
      </header>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
