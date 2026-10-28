import Link from "next/link";

export default function PartnerRegistrationNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">回答が見つかりません</h1>
      <p className="text-sm text-slate-600">この回答は存在しないか、URLが正しくありません。</p>
      <Link href="/admin/partner-registrations" className="text-sm text-navy underline-offset-2 hover:underline">
        一覧に戻る
      </Link>
    </div>
  );
}
