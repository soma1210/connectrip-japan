import type { Metadata } from "next";
import Link from "next/link";
import { INITIAL_PIPELINE_STATUS } from "@/features/guide-community/config/pipeline";
import { isDbConfigured } from "@/lib/db";
import { listGuideApplications } from "@/lib/data/guide-applications";
import { listPartnerRegistrations } from "@/lib/data/partner-registrations";

export const metadata: Metadata = {
  title: "管理画面 · Connectrip Japan",
  robots: { index: false, follow: false },
};

type Counts = { total: number; fresh: number } | null;

// Each count reads its own table. A failure in one only blanks that card.
async function guideCounts(): Promise<Counts> {
  try {
    const apps = await listGuideApplications();
    return { total: apps.length, fresh: apps.filter((app) => app.pipeline_status === INITIAL_PIPELINE_STATUS).length };
  } catch (error) {
    console.error("[admin] guide application counts failed", error);
    return null;
  }
}

async function partnerCounts(): Promise<Counts> {
  try {
    const rows = await listPartnerRegistrations();
    return { total: rows.length, fresh: rows.filter((row) => row.status === "new").length };
  } catch (error) {
    console.error("[admin] partner registration counts failed", error);
    return null;
  }
}

const CONTENT = [
  { label: "ギャラリー", text: "写真の追加・削除", href: "/admin/gallery" },
  { label: "ブログ", text: "記事の追加・削除", href: "/admin/vlog" },
  { label: "レビュー", text: "口コミの追加・削除", href: "/admin/reviews" },
];

export default async function AdminDashboardPage() {
  const [guides, partners] = await Promise.all([guideCounts(), partnerCounts()]);

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">管理画面</h1>
        <p className="mt-1 text-sm text-slate-600">
          Connectrip Japan の応募・パートナー管理とサイトのコンテンツ管理。ガイド応募と事業者アンケートは別々のデータとして管理しています。
        </p>
      </header>

      {!isDbConfigured ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          データベースが未接続です（<code className="rounded bg-white/60 px-1">POSTGRES_URL</code> 未設定）。
          ローカル開発では <code className="rounded bg-white/60 px-1">.data/</code> のファイルを表示しています。
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-500">応募・パートナー管理</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            title="ガイド応募"
            description="ガイド応募者の管理"
            unit="Applicants"
            counts={guides}
            freshLabel="新規（アンケート回答）"
            cta="ガイド応募を見る"
            href="/admin/guide-applications"
          />
          <SummaryCard
            title="事業者アンケート"
            description="飲食店、ホテル、体験事業者、旅行会社などの回答管理"
            unit="Partners"
            counts={partners}
            freshLabel="新規"
            cta="事業者回答を見る"
            href="/admin/partner-registrations"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-slate-500">コンテンツ管理</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {CONTENT.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-1 rounded-md border border-slate-200 bg-white p-5 transition-colors hover:border-navy/40"
            >
              <span className="text-base font-semibold">{item.label}</span>
              <span className="text-sm text-slate-600">{item.text}</span>
              <span className="mt-3 text-xs font-medium text-navy/70 group-hover:text-navy">開く →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  description,
  unit,
  counts,
  freshLabel,
  cta,
  href,
}: {
  title: string;
  description: string;
  unit: string;
  counts: Counts;
  freshLabel: string;
  cta: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-6 transition-colors hover:border-navy/40"
    >
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
        <p>
          <span className="text-3xl font-semibold tabular-nums">{counts ? counts.total : "—"}</span>
          <span className="ml-1.5 text-sm text-slate-500">{unit}</span>
        </p>
        <p className="text-sm text-slate-600">
          {freshLabel}{" "}
          <span className={`text-lg font-semibold tabular-nums ${counts && counts.fresh > 0 ? "text-sky-700" : "text-navy"}`}>
            {counts ? counts.fresh : "—"}
          </span>
        </p>
      </div>
      {counts === null ? <p className="text-xs text-red-700">件数を読み込めませんでした。</p> : null}
      <span className="mt-auto text-sm font-medium text-navy underline decoration-navy/30 underline-offset-4 group-hover:decoration-navy">
        {cta} →
      </span>
    </Link>
  );
}
