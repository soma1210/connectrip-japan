"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

/** How often the open screen reads the sheet again. */
const REFRESH_INTERVAL_MS = 3 * 60 * 1000;

const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * Last read time, a manual refresh button, and a refresh every 3 minutes.
 * router.refresh() re-renders the server page (which reads the sheet again)
 * while keeping filters and scroll position on the client.
 */
export function GuideSheetRefresh({ fetchedAt }: { fetchedAt: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const refresh = () => startTransition(() => router.refresh());
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL_MS);
    // Coming back to a tab that sat hidden past the interval: catch up at once.
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - Date.parse(fetchedAt) > REFRESH_INTERVAL_MS) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, fetchedAt]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
      <span aria-live="polite">
        最終更新 <time dateTime={fetchedAt}>{timeFormat.format(new Date(fetchedAt))}</time>
        <span className="ml-1 text-slate-400">（3分ごとに自動更新）</span>
      </span>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-navy hover:border-navy disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "更新中…" : "今すぐ更新"}
      </button>
    </div>
  );
}
