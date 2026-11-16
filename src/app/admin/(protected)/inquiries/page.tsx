import type { Metadata } from "next";
import Link from "next/link";
import { EmailBadge, InquiryStatusBadge, KindBadge, formatJst } from "@/admin/inquiries/InquiryBadges";
import { requireAdmin } from "@/lib/admin-auth";
import { listInquiries, PAGE_SIZE, type ListFilters } from "@/lib/inquiries/admin";
import { INQUIRY_STATUSES, KIND_LABEL, STATUS_LABEL, isInquiryStatus, type InquiryKind } from "@/lib/inquiries/status";
import { dbFromEnv } from "@/lib/pg";

export const metadata: Metadata = {
  title: "問い合わせ・予約リクエスト · Connectrip Admin",
  robots: { index: false, follow: false },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Query string → filters, ignoring anything unexpected. */
function parseFilters(sp: Record<string, string | string[] | undefined>): ListFilters {
  const status = one(sp.status);
  const kind = one(sp.kind);
  const page = Number(one(sp.page));
  return {
    status: isInquiryStatus(status) ? status : undefined,
    kind: kind === "contact" || kind === "booking_request" ? kind : undefined,
    emailFailed: one(sp.email) === "failed",
    page: Number.isInteger(page) && page > 0 && page < 10_000 ? page : 1,
  };
}

function hrefFor(f: ListFilters, page: number) {
  const q = new URLSearchParams();
  if (f.status) q.set("status", f.status);
  if (f.kind) q.set("kind", f.kind);
  if (f.emailFailed) q.set("email", "failed");
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return `/admin/inquiries${s ? `?${s}` : ""}`;
}

export default async function AdminInquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  const db = dbFromEnv();
  let data: Awaited<ReturnType<typeof listInquiries>> | null = null;
  let failed = false;
  if (db) {
    try {
      data = await listInquiries(db, filters);
    } catch {
      failed = true;
    }
  }
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const select = "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">問い合わせ・予約リクエスト</h1>
        <p className="mt-1 text-sm text-slate-600">サイトのフォームから届いた問い合わせと予約リクエスト。予約リクエストは管理者が確定するまで予約ではありません。</p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          ステータス
          <select name="status" defaultValue={filters.status ?? ""} className={select}>
            <option value="">すべて</option>
            {INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          種別
          <select name="kind" defaultValue={filters.kind ?? ""} className={select}>
            <option value="">すべて</option>
            {(Object.keys(KIND_LABEL) as InquiryKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-10 items-center gap-2 text-sm text-navy">
          <input type="checkbox" name="email" value="failed" defaultChecked={filters.emailFailed} className="h-4 w-4" />
          通知失敗のみ
        </label>
        <button type="submit" className="h-10 rounded-md bg-navy px-4 text-sm font-medium text-white hover:bg-navy/90">
          絞り込む
        </button>
        {filters.status || filters.kind || filters.emailFailed ? (
          <Link href="/admin/inquiries" className="h-10 content-center text-sm text-slate-500 hover:text-navy">
            条件をクリア
          </Link>
        ) : null}
      </form>

      {!db ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          データベースが未接続です（<code className="rounded bg-white/60 px-1">POSTGRES_URL</code> 未設定）。問い合わせはまだ保存されません。
        </p>
      ) : failed ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">一覧を読み込めませんでした。時間をおいて再読み込みしてください。</p>
      ) : data && data.items.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">該当する問い合わせはありません。</p>
      ) : data ? (
        <>
          <p className="text-sm text-slate-600">
            {data.total} 件{pages > 1 ? `（${data.page} / ${pages} ページ）` : ""}
          </p>

          {/* Phones: cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {data.items.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/inquiries/${item.id}`} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4 hover:border-navy/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <KindBadge value={item.kind} />
                    <InquiryStatusBadge value={item.status} />
                    <EmailBadge value={item.emailStatus} />
                  </div>
                  <p className="break-words font-medium">{item.customerName}</p>
                  <p className="break-all text-sm text-slate-600">{item.customerEmail}</p>
                  <p className="text-xs text-slate-500">
                    {formatJst(item.createdAt)} 受付 ・ <span className="font-mono">{item.ref}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Tablets and PCs: table */}
          <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">受付日時</th>
                  <th className="px-4 py-3 font-medium">種別</th>
                  <th className="px-4 py-3 font-medium">顧客名</th>
                  <th className="px-4 py-3 font-medium">メールアドレス</th>
                  <th className="px-4 py-3 font-medium">ステータス</th>
                  <th className="px-4 py-3 font-medium">通知</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">詳細</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {formatJst(item.createdAt)}
                      <span className="block font-mono text-[11px] text-slate-400">{item.ref}</span>
                    </td>
                    <td className="px-4 py-3">
                      <KindBadge value={item.kind} />
                    </td>
                    <td className="max-w-[14rem] break-words px-4 py-3 font-medium">{item.customerName}</td>
                    <td className="max-w-[16rem] break-all px-4 py-3 text-slate-600">{item.customerEmail}</td>
                    <td className="px-4 py-3">
                      <InquiryStatusBadge value={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <EmailBadge value={item.emailStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/inquiries/${item.id}`} className="whitespace-nowrap text-sm font-medium text-navy underline decoration-navy/30 underline-offset-4 hover:decoration-navy">
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 ? (
            <nav className="flex items-center justify-between text-sm" aria-label="ページ">
              {data.page > 1 ? <Link href={hrefFor(filters, data.page - 1)} className="text-navy underline underline-offset-4">← 前へ</Link> : <span />}
              {data.page < pages ? <Link href={hrefFor(filters, data.page + 1)} className="text-navy underline underline-offset-4">次へ →</Link> : <span />}
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
