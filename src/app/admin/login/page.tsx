import { redirect } from "next/navigation";
import { getAdminViewer } from "@/admin/access";
import { isGoogleLoginConfigured } from "@/admin/google-login";
import { adminEmails, devPassword, isSessionConfigured, matchesDevPassword, writeSession } from "@/admin/session";

const ERRORS: Record<string, { title: string; body: string }> = {
  denied: {
    title: "Access denied",
    body: "この Google アカウントには管理画面へのアクセス権がありません。許可されたアカウントでログインし直してください。",
  },
  cancelled: { title: "ログインを中止しました", body: "もう一度お試しください。" },
  expired: { title: "ログインの有効期限が切れました", body: "お手数ですが、最初からやり直してください。" },
  unverified: { title: "メールアドレスが未確認です", body: "Google 側で確認済みのメールアドレスを持つアカウントでログインしてください。" },
  failed: { title: "ログインに失敗しました", body: "時間をおいてもう一度お試しください。" },
  password: { title: "パスワードが違います", body: "開発用パスワードを確認してください。" },
};

/** Development only (`next dev` with ADMIN_DEV_PASSWORD): sign in without Google. */
async function devLogin(formData: FormData) {
  "use server";
  if (!matchesDevPassword(String(formData.get("password") ?? ""))) {
    redirect("/admin/login?error=password");
  }
  await writeSession({ method: "dev-password" });
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdminViewer()) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const message = error ? ERRORS[error] ?? ERRORS.failed : null;
  const googleReady = isGoogleLoginConfigured && isSessionConfigured() && adminEmails().length > 0;
  const devReady = devPassword() !== null;

  if (!googleReady && !devReady) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 text-navy">
        <h1 className="text-xl font-medium">管理画面は未設定です</h1>
        <p className="text-sm text-navy/70">
          環境変数 <code className="bg-navy/5 px-1">ADMIN_GOOGLE_CLIENT_ID</code>、
          <code className="bg-navy/5 px-1">ADMIN_GOOGLE_CLIENT_SECRET</code>、
          <code className="bg-navy/5 px-1">ADMIN_SESSION_SECRET</code>、
          <code className="bg-navy/5 px-1">ADMIN_EMAIL_1</code> /{" "}
          <code className="bg-navy/5 px-1">ADMIN_EMAIL_2</code> を設定してください。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 text-navy">
      <h1 className="text-xl font-medium">管理画面ログイン</h1>

      {message ? (
        <div role="alert" className="border border-red/30 bg-red/5 px-4 py-3 text-sm">
          <p className="font-medium text-red">{message.title}</p>
          <p className="mt-1 text-navy/70">{message.body}</p>
        </div>
      ) : null}

      {googleReady ? (
        <>
          {/* A full page load, not client navigation: the route handler sets the
              sign-in cookie and redirects to Google. */}
          <form action="/admin/auth/google" method="get">
            <button
              type="submit"
              className="w-full bg-navy px-6 py-3 text-sm text-white transition-colors hover:bg-navy/90"
            >
              Google でログイン
            </button>
          </form>
          <p className="text-xs text-navy/60">許可された管理者の Google アカウントのみログインできます。</p>
        </>
      ) : null}

      {devReady ? (
        <form action={devLogin} className="flex flex-col gap-4 border-t border-navy/10 pt-6">
          <label className="flex flex-col gap-2 text-sm">
            開発用パスワード（ローカル開発時のみ）
            <input
              type="password"
              name="password"
              required
              autoFocus={!googleReady}
              className="border border-navy/20 px-4 py-3 text-sm focus:border-navy/50 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="border border-navy/30 px-6 py-3 text-sm text-navy transition-colors hover:border-navy"
          >
            開発用ログイン
          </button>
        </form>
      ) : null}
    </div>
  );
}
