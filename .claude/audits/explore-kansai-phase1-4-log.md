# Explore Kansai Phase 1–4 実装・検証記録（2026-11-14）

範囲: プレビューのみ。commit・push・デプロイは未実施。予約機能、価格、法務ページ、公開ページには変更なし。

## 段階1 記事詳細
- 実装内容:
  - ラベル: シリーズ、カテゴリー、エリア
  - 著者表示（Connectrip Japan Editorial Team）、公開日、更新日、確認日
  - 要約、Quick answer、At a glance
  - 自動目次: モバイルは折りたたみ、PC は追従するサイドバー
  - 写真（未確保はプレビューでのみプレースホルダー、権利未確認には印を付ける）
  - 記事内の地図: 記事のスポットだけを表示、遅延読み込み
  - FAQ、出典一覧、著者ボックスと編集方針ページ、関連記事（不足分は同じエリアから補う）
  - 記事に応じた CTA: 大阪10選は Osaka Like a Local ツアーと Private Guide、モデルコースは Private Guide。リンクのみで、予約処理は変更なし。
  - スポット節: ツアーのルート上のスポットに案内を出す。モデルコースへの相互リンク。
- 検証:
  - tsc、eslint: OK
  - ルート 200、存在しない slug は 404
  - 目次の全リンク先が存在する（15件 / 11件）
  - 375 / 768 / 1440px で横スクロールなし
  - 記事内の地図: 10ピンを描画

## 段階2 一覧・エリアページ
- 実装内容:
  - Select 一覧: エリア × カテゴリーで絞り込み
  - Updates 一覧: エリア × カテゴリーで絞り込み
  - 絞り込みはリンク式で、JavaScript なしでも動く。canonical は絞り込みなしの URL に固定。
  - 記事カードを刷新: 写真、ラベル、件数、日付
  - Hub に「Explore by area」を追加
  - `/explore/area/[osaka|kyoto|nara|kobe]` を追加。記事のないエリアは noindex で、サイトマップにも載せない。
  - データ: 記事に `area` を追加。スポットマスタはエリアごとのファイルにして `spots/index.ts` で統合。
- 検証:
  - `?topic=Day+itinerary` で1件、`?area=kyoto` で0件の案内表示
  - 未知のエリアは 404
  - 3つの画面幅で横スクロールなし

## 段階3 SEO / AIO
- 実装内容:
  - 構造化データ: Article / NewsArticle、FAQPage（画面の FAQ と同じ文）、ItemList（TouristAttraction と検証済みの座標）、BreadcrumbList、CollectionPage（一覧、Hub、エリアページ）
  - 構造化データは公開可能な記事のときだけ出力する。プレビューでは BreadcrumbList のみ。
  - OG 画像は権利確認済みの写真だけを使う。
  - サイトマップ: Explore が公開されたとき、記事のあるエリアと編集方針ページを追加する。絞り込み URL と編集一覧は載せない。
  - 公開モードでは、Explore の各ルートが metadata も空で返す（404 ページに説明文が残らない）。
- 検証（一時スクリプト、実行後に削除）: 21項目すべて PASS
  - 見出し = H1
  - FAQPage = 画面の FAQ
  - ItemList の件数
  - 本番 URL のみ（`/v1` を含まない）
  - 未公開記事では出力しない
  - 公開ゲートが Quick answer の欠落を検出する
- 公開ビルドの HTML:
  - Explore の各ページは 404 で、Explore の文言は0件
  - TOP / private-guide / cancel-policy / company に Explore へのリンクなし
  - sitemap は7件のまま

## 段階4 運用
- 実装内容:
  - 編集一覧 `/v1/explore/editorial`: プレビュー専用。公開モードでは常に 404。noindex、サイトマップ外、どこからもリンクしない。
    - 表示項目: タイトル、エリア、カテゴリー、状態、最終確認日、次回確認日、写真の権利（確認済み / 未確認 / なし）、公開可否と理由
  - 手順書 `src/website-v1/content/explore/EDITORIAL.md`
  - 旧ページ棚卸し `.claude/audits/explore-legacy-routes.md`（リダイレクトは未設定）

## 全体検証（最終）
- `npx tsc --noEmit`: OK
- `npx eslint`（変更範囲）: OK
- `npx next build`（公開モード）: OK
- `bun run check:booking`: OK（rules と API）
- プレビューサーバー: 主要ページすべて 200
- スクリーンショット: `.claude/explore-kansai/p14/`
- 備考: 一時チェックに `npx tsx` を使ったが、npx のキャッシュに入っただけで、package.json と lock ファイルは変更していない。
