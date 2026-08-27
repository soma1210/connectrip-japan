import { redirect } from "next/navigation";
import {
  isAdminAuthenticated,
  isAdminConfigured,
  setAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await setAdminSession();
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const { error } = await searchParams;

  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 text-navy">
        <h1 className="text-xl font-medium">管理画面は未設定です</h1>
        <p className="text-sm text-navy/70">
          環境変数 <code className="bg-navy/5 px-1">ADMIN_PASSWORD</code>{" "}
          を設定してください。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 text-navy">
      <h1 className="text-xl font-medium">管理画面ログイン</h1>
      <form action={login} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          パスワード
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="border border-navy/20 px-4 py-3 text-sm focus:border-navy/50 focus:outline-none"
          />
        </label>
        {error ? (
          <p className="text-sm text-red">パスワードが違います。</p>
        ) : null}
        <button
          type="submit"
          className="bg-navy px-6 py-3 text-sm text-white transition-colors hover:bg-navy/90"
        >
          ログイン
        </button>
      </form>
    </div>
  );
}
