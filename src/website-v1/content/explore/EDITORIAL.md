# Explore Kansai 記事の追加・更新手順書

対象: Connectrip Japan Select（長く使えるガイド）と Kansai Travel Updates（期限のあるニュース）
記事の状態は、プレビュー環境の編集一覧 `/v1/explore/editorial` で確認できます。

## 0. 基本ルール
- 記事は英語で書く。著者表示は「Connectrip Japan Editorial Team」。
- 事実は公式情報（施設の公式サイト、鉄道会社、主催者）で確認し、確認した日付を記録する。確認できないことは書かない。
  - 営業時間・料金・所要時間は、確認できない限り書かない。
- 写真は、自社撮影の写真か、権利を確認済みの写真だけを公開に使う。
  - 未確保のうちは、プレビューにだけプレースホルダーが出る。
- FAQ は、旅行者が実際に持つ疑問に、記事中の確認済みの事実だけで答える。SEO のためだけの質問は作らない。
- 公開には人の承認が必要。自動では公開されない。

## 1. ファイルの場所
| 内容 | ファイル |
|---|---|
| スポット（名前・座標・写真・公式サイト・アクセス） | `src/website-v1/content/spots/osaka.ts`（エリアごとに1ファイル。京都なら `kyoto.ts` を作り、`spots/index.ts` の `ALL_SPOTS` に加える） |
| Select 記事 | `src/website-v1/content/explore/select.ts` |
| Updates 記事 | `src/website-v1/content/explore/updates.ts`（ファイル内にひな形あり） |
| エリアの説明文 | `src/website-v1/content/explore/areas.ts` |
| 公開判定のルール | `src/website-v1/content/explore/rules.ts` |

## 2. Select 記事を追加する
1. 必要なスポットをスポットマスタに登録する。
   - 座標は OpenStreetMap か Wikidata から取り、推測しない。
   - 公式サイトとアクセスを登録する。
   - 写真がなければ `placeholder` にする。
2. `select.ts` に記事を1件追加する。最初は `status: "draft"` にする。必須項目は次のとおり。
   - `slug`、`title`、`seoTitle`、`description`、`summary`
   - `topic`: カテゴリー。例: "Best places"、"Day itinerary"
   - `area`: osaka / kyoto / nara / kobe
   - `quickAnswer`: 読者の疑問への直接の答え（2〜3文）
   - `keyFacts`: At a glance に出す、確認済みの短い事実
   - `intro`
   - `content`: スポット記事なら `spots`、モデルコースなら `itinerary`。スポットごとに `checkedAt` と `checkNote` を書く。
   - `faq`
   - `cta`: `featuredTour`（Osaka Like a Local のルート上のスポットを含む場合）か `privateGuide`
   - `related`: 関連記事の slug。不足分は同じエリアから自動で補われる。
   - `editorialNotes`: 未解決の事項
3. プレビューで確認する。
   - 記事: `/v1/explore/select/{slug}`
   - 編集一覧: `/v1/explore/editorial`。公開を止めている項目がここに出る。
4. 確認が済んだら `status: "in_review"` にし、担当者がレビューする。

URL、目次、地図、構造化データ、サイトマップ、一覧、エリアページへの掲載は、記事データから自動で作られます。

## 3. Updates 記事を追加する
1. 公式の情報源で確認できたニュースだけを扱う。何もない日は何も追加しない。
2. `updates.ts` のひな形をコピーする。必須項目は次のとおり。
   - `source`: 公式の情報源
   - `verifiedAt`
   - `validity`: 期限がある場合は `until`。期限がない場合は `open` にし、再確認日を確認日から30日以内に設定する。
   - `quickAnswer`
   - `content` の3項目（What's changed / Who is affected / What travelers should do）
3. 期限が過ぎると、自動で「Past updates」に移り、noindex になる。削除はしない。

## 4. 公開する（人の承認が必要）
1. 編集一覧で、その記事が「Ready」になっていることを確認する。条件は次のとおり。
   - 承認者、公開日、確認日、Quick answer がそろっている
   - すべてのスポットの事実が確認済み
   - 写真の権利がすべて確認済み
   - `editorialNotes` が空
2. 記事に `status: "published"`、`approval: { by: "担当者名", at: "YYYY-MM-DD" }`、`publishedAt`、`verifiedAt` を入れる。
3. ゲートを通らない記事を `published` にすると、ビルドが止まる（安全装置）。
4. Explore Kansai 自体の一般公開は別の判断。必要な作業は次の3つで、すべて承認が必要。
   - `EXPLORE_PUBLIC` を true にする
   - PUBLIC_PATHS と proxy の設定を変える
   - 本番デプロイする

## 5. 定期作業
- Select: `nextReviewDue`（90日ごと）までに見直し、`lastReviewedAt` と `nextReviewDue` を更新する。期限切れは編集一覧に赤で表示される。
- Updates（`open`）: `recheckBy` までに再確認する。過ぎると「再確認中」の表示になり、最新情報としては扱われない。

## 6. 写真の権利を確認済みにする
スポットマスタで、写真の `rights` を `"CONFIRMED_BY_HUMAN"` に変える。誰がいつ確認したかは、コミットメッセージかメモに残す。確認済みの写真だけが、本番表示と SNS 共有画像（OG）に使われる。
