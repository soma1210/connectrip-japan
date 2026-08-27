import Link from "next/link";
import { isDbConfigured } from "@/lib/db";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">管理画面</h1>

      {!isDbConfigured ? (
        <p className="border border-gold/60 bg-gold/10 px-4 py-3 text-sm text-navy">
          データベースが未接続です。Vercelプロジェクトに Postgres
          を接続し、環境変数 <code className="bg-navy/5 px-1">POSTGRES_URL</code>{" "}
          を設定してから <code className="bg-navy/5 px-1">bun run db:init</code>{" "}
          を実行してください。それまでは公開サイトは既存の固定コンテンツを表示します。
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/gallery"
          className="border border-navy/15 bg-white p-6 transition-colors hover:border-navy/40"
        >
          <p className="text-lg font-medium">ギャラリー</p>
          <p className="mt-1 text-sm text-navy/60">写真の追加・削除</p>
        </Link>
        <Link
          href="/admin/vlog"
          className="border border-navy/15 bg-white p-6 transition-colors hover:border-navy/40"
        >
          <p className="text-lg font-medium">ブログ</p>
          <p className="mt-1 text-sm text-navy/60">記事の追加・削除</p>
        </Link>
        <Link
          href="/admin/reviews"
          className="border border-navy/15 bg-white p-6 transition-colors hover:border-navy/40"
        >
          <p className="text-lg font-medium">レビュー</p>
          <p className="mt-1 text-sm text-navy/60">口コミの追加・削除</p>
        </Link>
      </div>
    </div>
  );
}
