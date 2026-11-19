# 旧ページ（/travel-guide/*・/kansai-travel-journal/*）の棚卸し（2026-11-14）

結論: 2系統とも **一般公開されたことがない**。
- どちらも PUBLIC_PATHS に含まれていないので、公開モードでは proxy が 404 を返す。
- 現行の本番サイト（`src/app/[locale]`）には、同名のルートはない。
- git 履歴でも、`/v1` 以外にこのパスのルートは見つからない。

そのため、外部からのリンクや検索エンジンへの登録はないと考えられる。リダイレクトはプレビュー内の整理目的にとどまる。

**今回、リダイレクトは有効化していない。** プレビューの挙動も変えていない。

## /travel-guide/*（旧 Travel Guide、DEMO 記事）
| URL | 現状（プレビュー） | 対応する Explore ページ | 提案 |
|---|---|---|---|
| `/travel-guide` | 307 → `/explore` | `/explore`（同じ役割のハブ） | 301 の候補: `/explore` |
| `/travel-guide/osaka` | 200（DEMO 一覧） | `/explore/area/osaka`（同じ役割の大阪ハブ） | 301 の候補: `/explore/area/osaka` |
| `/travel-guide/osaka/demo-local-guide` | 200（DEMO） | なし | 404（ルートを削除）。転送しない |
| `/travel-guide/osaka/demo-local-itinerary` | 200（DEMO） | なし（内容は架空。`osaka-day-trip` とは別物） | 404。転送しない |
| `/travel-guide/osaka/demo-seasonal-update` | 200（DEMO） | なし | 404。転送しない |
| `/travel-guide/osaka/osaka-events-this-month` | 200（DEMO、公開ゲートで不合格） | なし（Updates は0件） | 404。転送しない |

## /kansai-travel-journal/*（旧 Journal、DEMO 記事10件）
| URL | 現状（プレビュー） | 対応する Explore ページ | 提案 |
|---|---|---|---|
| `/kansai-travel-journal`、`/page/2`、`/page/3` | 200（DEMO 一覧） | `/explore`（同じ役割のハブ） | 一覧のトップだけ 301 の候補（`/explore`）。ページ番号付きは 404 |
| `/kansai-travel-journal/demo-0-winter-light-ups-in-osaka-where-to-see-them` | 200（DEMO） | なし | 404 |
| `…/demo-1-kyoto-autumn-leaves-planning-around-the-crowds` | 200（DEMO） | なし | 404 |
| `…/demo-2-getting-around-kansai-rail-pass-basics` | 200（DEMO） | なし | 404 |
| `…/demo-3-nara-beyond-the-deer-park-quiet-streets` | 200（DEMO） | なし | 404 |
| `…/demo-4-kobe-harbour-evenings-seasonal-events` | 200（DEMO） | なし | 404 |
| `…/demo-5-tenma-s-shopping-street-a-local-morning` | 200（DEMO） | 近い内容: `osaka-best-places#tenjinbashisuji`。ただし DEMO 記事なので同一内容ではない | 404。転送しない |
| `…/demo-6-winter-temple-visits-in-nara` | 200（DEMO） | なし | 404 |
| `…/demo-7-kyoto-buses-and-trains-practical-tips` | 200（DEMO） | なし | 404 |
| `…/demo-8-kansai-new-year-traditions-for-visitors` | 200（DEMO） | なし | 404 |
| `…/demo-9-kobe-s-hillside-neighbourhoods` | 200（DEMO） | なし | 404 |

## 推奨（承認後に実施）
1. 記事 URL は一括転送しない。対応する公開記事がないので、ルートを削除して 404 にする。
   - 公開されたことがないので、410 にする必要はない。
2. ハブの3つ（`/travel-guide`、`/travel-guide/osaka`、`/kansai-travel-journal`）だけを、同じ役割の Explore ページへの 301 候補にする。
   - 実施する場合は `next.config.ts` の redirects に追加する。本番に反映されるのはデプロイ時。
3. 旧データ（`content/guides/*`、`content/journal.ts`）は、Home の別セクションや contracts が参照しているので、ルート削除と同時には消さない。参照を整理してから、別作業として行う。
