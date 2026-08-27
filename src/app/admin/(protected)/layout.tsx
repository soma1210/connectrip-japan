import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { clearAdminSession, isAdminAuthenticated } from "@/lib/admin-auth";

async function logout() {
  "use server";
  await clearAdminSession();
  redirect("/admin/login");
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-cream text-navy">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <nav className="flex gap-6 text-sm">
            <Link href="/admin" className="font-medium hover:text-navy/70">
              管理画面
            </Link>
            <Link href="/admin/gallery" className="hover:text-navy/70">
              ギャラリー
            </Link>
            <Link href="/admin/vlog" className="hover:text-navy/70">
              ブログ
            </Link>
            <Link href="/admin/reviews" className="hover:text-navy/70">
              レビュー
            </Link>
          </nav>
          <form action={logout}>
            <button type="submit" className="text-xs text-navy/50 hover:text-navy">
              ログアウト
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
