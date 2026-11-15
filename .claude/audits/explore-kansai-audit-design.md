# Explore Kansai 監査・完成設計（2026-11-14）

対象: worktree `claude-website-v1` / branch `claude/website-v1-launch`（未コミット変更を含む）
範囲: 監査と設計のみ。コード変更なし。

## 1. 現状の完成度: 約55%

| 領域 | 完成度 | 状況 |
|---|---|---|
| データ設計（型・公開ゲート・有効期限） | 85% | CMS 移行できる形。draft→in_review→published→archived |
| ルーティング / 表示制御 | 80% | 6 ルートあり。プレビューのみ表示。公開モードでは 404・sitemap 0件 |
| SEO / AIO 基盤 | 65% | canonical、Breadcrumb、Article/NewsArticle JSON-LD（公開時のみ）。FAQ・ItemList・Place はなし |
| 記事ページ UI | 60% | スポット節、出典、Things to Know、関連記事、CTA。目次・要約ボックス・著者表示はなし |
| 地図 | 70% | 遅延読み込み、エラー時の代替表示、記事リンク。大阪のみ |
| コンテンツ量 | 15% | Select 2本（どちらも in_review）、Updates 0本。対象は大阪のみ |
| 写真 | 10% | 権利確認済み 0枚。4枚は NOT_VERIFIED、6スポットは写真なし |
| 検索 / 絞り込み | 0% | なし |
| 運用ツール | 40% | ルールはコードにある。担当者向けの一覧画面と手順書はない |

## 2. 実装済み
- ルート: `/explore`、`/explore/select`、`/explore/select/[slug]`、`/explore/updates`、`/explore/updates/[slug]`、`/explore/map/osaka`。旧 `/connectrip-select/osaka` は `?spot` を保ったままリダイレクト。
- データ:
  - スポットマスタ `content/spots/osaka.ts`: 20 スポット。OSM / Wikidata の座標根拠、公式サイト、アクセスを持つ。
  - 記事 `content/explore/{select,updates}.ts`。
  - ルール `rules.ts`: 公開ゲート、レビュー期限、Updates の有効期限（`until` / `open` 最長30日）、過去ニュースは noindex。
- SEO: 本番 URL の canonical、プレビューは常に noindex、パンくず（表示と JSON-LD）、Article / NewsArticle（`isBasedOn` に出典）、権利確認済みの写真だけ OG に使う。
- 地図: 画面に近づいてから読み込む。失敗時はリスト表示。ポップアップから記事のスポット節へリンク。
- 導線: TOP の Explore セクション、ヘッダーナビ、記事末尾の Private Guide CTA。
- 公開モードの安全性: Explore は表示されず、ナビは変わらず、sitemap は 7 ページのまま。

## 3. 未実装
1. エリア分類（Osaka / Kyoto / Nara / Kobe）と、それを使った一覧の絞り込みとエリアハブ
2. サイト内検索
3. 記事の目次、冒頭の要約（Quick answer / Key facts）、著者・監修者の表示
4. FAQ 節と FAQPage JSON-LD、ItemList JSON-LD（10選）、TouristAttraction / Place の構造化データ
5. 記事ごとの小さな地図（記事内のスポットだけを表示）
6. 記事の内容に合わせた予約導線（例: 大阪の記事 → Osaka Like a Local の固定ツアー）。今は Private Guide の CTA が1つだけ
7. 京都・奈良・神戸のスポットマスタ（`spots/osaka.ts` は大阪専用の形）
8. Updates の RSS、編集担当者向けの一覧画面（状態、レビュー期限切れ、再確認期限）
9. 記事追加の手順書

## 4. UI/UX の改善点
- 長い記事（10選）で今どこを読んでいるか分からない → 目次（モバイルでは折りたたみ）と、スポット番号へのジャンプ
- 写真のないスポットが6つあり、一覧が単調 → 写真の調達計画を立てる（独自撮影を推奨）。それまでは統一デザインのプレースホルダー
- CTA が記事末尾にしかない → 本文の途中（3スポット目のあと）に控えめな CTA を1つ追加。押し売りに見えない文言にする
- Hub に新着・エリア・地図への入口が並ぶが、エリアで探す入口がない
- Updates が0件のときの表示は適切。ただし Hub での見え方は、記事が入ったときに要確認
- 本文の行長と文字サイズは良好。表のモバイル対応も済み

## 5. SEO / AIO の不足
| 不足 | 影響 | 対応 |
|---|---|---|
| 冒頭の短い答えがない | AI 検索に引用されにくい | 記事冒頭に 2〜3 文の要約と Key facts（エリア、所要の目安は検証済みのものだけ、最寄り駅） |
| 著者・監修者の情報がない | E-E-A-T が弱い | 「Connectrip Japan 編集部 / 監修: ローカルガイド」のボックス。実名を出すかは人が判断 |
| FAQ がない | 関連質問を拾えない | 実際の問い合わせを元に FAQ 節。画面に見える FAQ だけ JSON-LD にする |
| ItemList / Place がない | リッチリザルトとエンティティ理解が弱い | 10選に ItemList、各スポットに Place（座標は検証済みのもの） |
| OG 画像がない | SNS で共有しにくい | 権利確認済みの写真が入るまで空のまま（現行の正しい挙動） |
| 記事数が少ない | トピックとしての権威性が出ない | エリア × テーマで記事計画（例: 大阪のエリア別 → 京都10選 → 奈良日帰り） |
| 旧ルートが残っている | 重複・混乱のリスク | `/travel-guide/*`（DEMO）と `/kansai-travel-journal/*`（DEMO 記事）。公開前に処理方針を決める |

## 6. 記事の追加・更新方法（現在）
- Select:
  1. `content/explore/select.ts` に1件追加する。スポットは `spots/osaka.ts` に先に登録する。
  2. `status: "in_review"` でプレビューを確認する。
  3. 人の承認（`approval`）を入れ、`published` にする。
  4. 公開ゲートが、編集メモ・未確認の事実・承認漏れがあればビルドを止める。
- Updates:
  1. `content/explore/updates.ts` に追加する。出典は必須、`validity` も必須。
  2. 期限が過ぎると「Past updates」に移り、noindex になる。
- 課題: コード編集とビルドが必要で、エンジニアでない人は更新できない。将来の CMS 移行は型がそのまま使えるが、移行先は未決定。

## 7. 公開前に解決が必要な問題（P0）
1. 写真の権利: 確認済み 0 枚。NOT_VERIFIED の写真は公開しない
2. 記事2本の人による事実確認と承認（Dotonbori / Shinsekai の説明が未確認）
3. 旧 DEMO ルート（`/travel-guide/*`、`/kansai-travel-journal/*`）の扱い（リダイレクトか削除か）
4. 公開の手順: `EXPLORE_PUBLIC`、PUBLIC_PATHS、proxy、sitemap を同時に切り替える。PUBLIC_PATHS への追加は要承認
5. 著者・監修者の表示内容（実名、写真、経歴）を人が決める

## 8. 完成仕様（提案）

### 情報設計
```
/explore                         Hub（新着 / エリア / Select / Updates / 地図）
/explore/select                  Select 一覧（エリア・テーマで絞り込み、URL パラメータで保持）
/explore/select/[slug]           Select 記事
/explore/updates                 Updates 一覧（カテゴリで絞り込み、Current / Past）
/explore/updates/[slug]          Updates 記事
/explore/area/[osaka|kyoto|nara|kobe]   エリアハブ（その地域の記事・地図・ツアー）
/explore/map/[area]              エリア地図
/explore/search                  検索（記事15本以上になってから）
/explore/updates/feed.xml        RSS
```
2カテゴリー（Connectrip Japan Select / Kansai Travel Updates）は維持する。エリアは横断的な分類として加える。

### 記事詳細（Select）
1. パンくず
2. H1、要約、更新日・確認日
3. Quick answer（2〜3文）と Key facts
4. 目次
5. 本文（スポット節: 写真、概要、Why we recommend、Local tips、Things to know、地図リンク）
6. 途中 CTA（1回、控えめ）
7. 記事内地図
8. FAQ
9. 出典一覧
10. 著者・監修者
11. 末尾 CTA（記事に合わせて固定ツアーか Private Guide）
12. 関連記事

### 記事詳細（Updates）
現行の構成（What's changed / Who is affected / What travelers should do / 出典 / 有効期限）を維持し、Quick answer を追加する。

### 検索
記事数が少ないうちは、絞り込みで十分。15本を超えたら、ビルド時に作る索引 JSON を使ってブラウザ内で検索する。外部サービスは使わない。

### 関連記事
今は手動指定（`related`）。これを優先し、足りない分は同じエリア・テーマから自動で補う。

### 地図
スポットマスタを `spots/{area}.ts` に分け、型を共通にする。エリア地図と記事内地図は同じコンポーネントで描く。

### 予約導線
- 記事データに `ctaTarget`（`fixedTour:osaka-like-a-local` または `privateGuide`）を持たせる。
- 予約フォームと API は変更しない。リンク先を選ぶだけにする。

### デザイン
既存ブランドに揃える（ネイビー、ゴールド、クリーム、セリフ見出し）。写真を主役にした落ち着いた誌面にし、装飾は増やさない。

### 運用
- プレビュー専用の編集ダッシュボード（`/explore/_editorial`、noindex、公開モードでは 404）。全記事の状態、レビュー期限切れ、再確認期限、公開ゲートの問題を一覧する。
- 手順書 `docs/explore-editorial.md`。
- 定期作業: Select は3か月ごとに見直す。Updates は期限で自動的に Past に移り、`open` のものは30日以内に再確認する。

## 9. 実装計画（優先順位つき）

| 段階 | 内容 | 既存への影響 | 目安 |
|---|---|---|---|
| 0. 公開ブロッカー | 旧 DEMO ルートの方針決定と処理、写真の方針、記事2本の確認依頼 | 小（プレビューのみ） | 判断待ち |
| 1. 記事体験 | Quick answer / Key facts、目次、著者ボックス、途中 CTA、`ctaTarget`、記事内地図 | 型にフィールドを追加。省略可にして互換を保つ | 1〜2日 |
| 2. SEO/AIO | FAQ 節と FAQPage、ItemList、Place の JSON-LD（公開時のみ出力） | なし（公開前は出力されない） | 0.5〜1日 |
| 3. 分類と一覧 | `area` / `topic` を追加、一覧の絞り込み、エリアハブ、スポットマスタのエリア分割 | 地図コンポーネントの汎用化 | 1〜2日 |
| 4. 運用基盤 | 編集ダッシュボード（プレビュー専用）、手順書、RSS | なし | 1日 |
| 5. 記事拡充 | 京都・奈良・神戸のスポットと記事。事実確認つき | なし | 継続 |
| 6. 検索 | 15本を超えたらブラウザ内検索 | なし | 0.5日 |
| 7. 公開 | 人が承認したあと、`EXPLORE_PUBLIC`、PUBLIC_PATHS、sitemap を切り替える | 公開画面が変わる（要承認） | 判断待ち |

各段階は独立して確認できる。各段階で tsc、eslint、next build、check:booking、公開モードのビルド HTML 検査（Explore が出ないこと）を行う。

## 10. 人の判断が必要な事項
1. 旧 DEMO ルート（`/travel-guide/*`、`/kansai-travel-journal/*`）をリダイレクトするか、削除するか
2. 著者・監修者の表示内容
3. 写真の調達方法（独自撮影 / ライセンス購入 / 現行写真の権利確認）
4. 次に書く記事の優先順位（推奨: 京都10選 → 奈良日帰り → 大阪エリア別）
5. 公開時期
