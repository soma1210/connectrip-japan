import Image from "next/image";
import { getGalleryItems } from "@/lib/data/gallery";
import { addGalleryItem, removeGalleryItem } from "./actions";

export default async function AdminGalleryPage() {
  const items = await getGalleryItems();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-medium">ギャラリー</h1>

      <form
        action={addGalleryItem}
        className="flex flex-col gap-4 border border-navy/15 bg-white p-6"
      >
        <p className="text-sm font-medium">新しい写真を追加</p>
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
        <button
          type="submit"
          className="w-fit bg-navy px-6 py-3 text-sm text-white transition-colors hover:bg-navy/90"
        >
          追加する
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="border border-navy/15 bg-white p-3">
            <div className="relative aspect-[4/3] overflow-hidden bg-navy/5">
              <Image src={item.imageUrl} alt={item.altJa} fill sizes="300px" className="object-cover" />
            </div>
            <p className="mt-2 text-xs text-navy/70">{item.altJa}</p>
            <p className="text-xs text-navy/50">{item.altEn}</p>
            <form action={removeGalleryItem.bind(null, item.id)} className="mt-2">
              <button type="submit" className="text-xs text-red hover:underline">
                削除
              </button>
            </form>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-sm text-navy/50">まだ写真がありません。</p>
        ) : null}
      </div>
    </div>
  );
}
