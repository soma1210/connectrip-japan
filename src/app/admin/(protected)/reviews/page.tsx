import { getReviews } from "@/lib/data/reviews";
import { addReview, removeReview } from "./actions";

export default async function AdminReviewsPage() {
  const reviews = await getReviews();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-medium">レビュー</h1>

      <form
        action={addReview}
        className="flex flex-col gap-4 border border-navy/15 bg-white p-6"
      >
        <p className="text-sm font-medium">新しいレビューを追加</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            お名前
            <input
              type="text"
              name="name"
              required
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            評価（1〜5）
            <input
              type="number"
              name="rating"
              min={1}
              max={5}
              defaultValue={5}
              required
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            国名（例: United States）
            <input
              type="text"
              name="country"
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            国コード（例: US）
            <input
              type="text"
              name="countryCode"
              maxLength={2}
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            タグ（例: KYOTO PRIVATE TOUR）
            <input
              type="text"
              name="tag"
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            日付（例: 2026.06.01）
            <input
              type="text"
              name="reviewDate"
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
          レビュー内容（日本語）
          <textarea
            name="quoteJa"
            rows={3}
            required
            className="resize-none border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
          レビュー内容（英語）
          <textarea
            name="quoteEn"
            rows={3}
            className="resize-none border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="w-fit bg-navy px-6 py-3 text-sm text-white transition-colors hover:bg-navy/90"
        >
          追加する
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <div key={review.id} className="border border-navy/15 bg-white p-4">
            <p className="text-sm font-medium">
              {review.name} {review.rating}★
            </p>
            <p className="text-xs text-navy/50">
              {review.country} ・ {review.reviewDate}
            </p>
            <p className="mt-2 text-xs text-navy/70">{review.quoteJa}</p>
            <form action={removeReview.bind(null, review.id)} className="mt-2">
              <button type="submit" className="text-xs text-red hover:underline">
                削除
              </button>
            </form>
          </div>
        ))}
        {reviews.length === 0 ? (
          <p className="text-sm text-navy/50">まだレビューがありません。</p>
        ) : null}
      </div>
    </div>
  );
}
