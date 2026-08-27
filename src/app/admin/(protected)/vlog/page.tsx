import Image from "next/image";
import { getVlogPosts } from "@/lib/data/vlog";
import { addVlogPost, removeVlogPost } from "./actions";

export default async function AdminVlogPage() {
  const posts = await getVlogPosts();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-medium">ブログ</h1>

      <form
        action={addVlogPost}
        className="flex flex-col gap-4 border border-navy/15 bg-white p-6"
      >
        <p className="text-sm font-medium">新しい記事を追加</p>
        <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
          画像ファイル
          <input
            type="file"
            name="image"
            accept="image/*"
            required
            className="border border-navy/15 px-4 py-3 text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            タイトル（日本語）
            <input
              type="text"
              name="titleJa"
              required
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            タイトル（英語）
            <input
              type="text"
              name="titleEn"
              required
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            説明文（日本語）
            <textarea
              name="descriptionJa"
              rows={3}
              required
              className="resize-none border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            説明文（英語）
            <textarea
              name="descriptionEn"
              rows={3}
              required
              className="resize-none border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            代替テキスト（日本語）
            <input
              type="text"
              name="altJa"
              required
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
            代替テキスト（英語）
            <input
              type="text"
              name="altEn"
              required
              className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-xs tracking-[0.05em] text-navy/70">
          リンク先URL（任意）
          <input
            type="text"
            name="linkUrl"
            placeholder="https://..."
            className="border border-navy/15 px-4 py-3 text-sm focus:border-navy/40 focus:outline-none"
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
        {posts.map((post) => (
          <div key={post.id} className="border border-navy/15 bg-white p-3">
            <div className="relative aspect-[4/3] overflow-hidden bg-navy/5">
              <Image src={post.imageUrl} alt={post.altJa} fill sizes="300px" className="object-cover" />
            </div>
            <p className="mt-2 text-sm font-medium">{post.titleJa}</p>
            <p className="text-xs text-navy/60">{post.descriptionJa}</p>
            <form action={removeVlogPost.bind(null, post.id)} className="mt-2">
              <button type="submit" className="text-xs text-red hover:underline">
                削除
              </button>
            </form>
          </div>
        ))}
        {posts.length === 0 ? (
          <p className="text-sm text-navy/50">まだ記事がありません。</p>
        ) : null}
      </div>
    </div>
  );
}
