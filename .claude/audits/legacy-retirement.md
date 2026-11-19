# 旧サイト廃止・Website V1 への統一 作業記録（2026-11-15）

> Connectrip Japan Website V1 is the single source of truth. The legacy website is deprecated and must not be used as a reference for future development.

範囲: ブランチ `claude/website-v1-launch` の作業ツリーのみ。commit・push・deploy は未実施。V1 の公開スイッチ（`V1_PREVIEW`、`PUBLIC_PATHS`、`EXPLORE_PUBLIC`）は変更なし。

## 0. 前提
- **現在の本番：** `origin/main`（旧サイトのみ。V1 のコードはない）。このブランチでの削除は、main と本番に影響しない。
- **このブランチを公開モードでビルドした場合：** 旧サイトのページは削除前から配信されていなかった（proxy が V1 だけを出す）。そのため、公開モードの動作は削除前後で同じ。
- **プレビューモードの変更点：**
  - 削除前は、ルートで旧サイトを配信していた（next-intl）。
  - 削除後は、`/` を `/v1` へ転送し、それ以外の旧パスは 404。

## 1. 削除した旧サイト専用ファイル（83件、すべて git で追跡済み・未変更のものだけ）
| グループ | 件数 |
|---|---|
| `src/app/[locale]/**`（旧サイトのページ、レイアウト、OG 画像） | 10 |
| `src/app/api/{contact,reservation,business-inquiry}`（旧サイトのフォーム API、メール送信） | 3 |
| `src/components/layout/**`、`src/components/sections/**` | 21 |
| `src/components/cards/{Blog,Gallery,Issue,Plan,ProcessItem,Review,Service}Card` | 7 |
| `src/components/ui/{Carousel,CtaButton,FaqAccordion}` | 3 |
| `src/i18n/**`（next-intl のルーティング） | 3 |
| `messages/{en,ja,vi,ko,zh-TW}.json` | 5 |
| `src/lib/{analytics,flag}.ts`、`src/data/information-links.ts` | 3 |
| `src/features/partner-survey/**`、`src/lib/data/partner-applications.ts`（旧パートナーアンケート。API は 410 で参照なし） | 6 |
| `public/images/{issues,service,process,plan,final-cta}/**`、`public/images/README.md` | 22 |

判断方法: V1 の全ページ、`api/v1`、booking-request、proxy、sitemap、robots、next.config、チェック用スクリプト、保留した業務システムを起点に import をたどり、どこからも到達しないファイルだけを削除した。画像は、残すコードとビルド設定の中の文字列参照（ディレクトリ単位の参照を含む）で確認した。

## 2. V1 のために変更・移行したもの
- **データ：** `messages/*.json` から V1 が使っていた部分を `src/website-v1/content/data/` に移した。文言は変えていない。
  - `company.ts`（英語の会社概要）
  - `businessInquiry.ts`（日本語の事業者問い合わせ）
  - `sns.ts`（日本語と英語の SNS 欄）
- **画像リスト：** `src/data/images.ts` は、V1 が使う `valueCardImages` だけにした。
- **next-intl を使わない形に変更：**
  - `src/proxy.ts`
  - `src/app/sitemap.ts`（プレビューでは空、公開時は今までどおり）
  - `src/lib/site.ts`（`SITE_URL` のみ）
  - `next.config.ts`（next-intl プラグインを外した。リダイレクトは変更なし）
- **開発ルール：**
  - `CLAUDE.md` に Single source of truth の節を追加した。
  - ルートの `README.md` を書き直した。
  - `src/website-v1/README.md` を更新した。

## 3. V1 が参照するため維持した共有ファイル
- `src/components/ui/{Container,FadeIn,LegalPageHeader,PlaceholderImage,SectionHeading}`
- `src/components/cards/{SnsCard,ValueCard}`
- `src/data/{business-info,images,social-links}.ts`
- `src/lib/{cn,rate-limit,site}.ts`
- `src/lib/booking-request/**`、`apps-script/booking-requests/Code.gs`（Google Apps Script との連携）
- `src/contracts/**`（fixtures と型チェックを含む）
- `src/app/{globals.css,robots.ts,sitemap.ts,favicon.ico}`
- `public/images/{hero,gallery,value,logo,v1}`
- `next.config.ts`、`netlify.toml`、`src/proxy.ts`、`scripts/check-v1-guides.ts`、`scripts/select/*`

## 4. 削除を保留したもの
| 対象 | 理由 |
|---|---|
| 管理画面 `src/app/admin/**`、`src/admin/**`、`src/lib/{db,admin-auth}.ts`、`src/lib/data/*`、`sql/*`、`scripts/init-db.mjs` | Postgres と Blob に保存済みの応募データ（ガイド・パートナー）と、ギャラリー・レビュー・VLOG の管理 UI。削除するには、データの書き出しと保存期間の判断（Privacy Policy 第10節）が必要 |
| 旧ガイド応募フォーム `src/app/guide-community/**`、`src/components/guide-community`、`src/features/guide-community`、`/api/guide-applications`、`src/lib/mailer.ts` | 応募は Google フォームに移行済みで、ページ自体は転送されている。管理画面と API がデータを共有しているので、管理画面と一緒に判断する |
| パートナー登録 `src/components/partner-registration`、`src/features/partner-registration`、`/api/partner-registrations`、`/api/partner-applications`（410） | V1 の `/v1/partner/apply` が参照している（ただし next.config で Google フォームへ常に転送）。管理画面と一緒に判断する |
| `package.json` の `next-intl` と `@next/third-parties` | コードからは参照されなくなった。外すと lockfile の更新（bun install）が必要なので、別作業にする |
| `origin/main`（旧サイト本体）と本番環境 | V1 への切り替えまで本番を維持する |
| V1 内で参照されていないファイル（`content/people.ts`、`views/ConnectripSelectView.tsx`） | 旧サイトのものではない（V1 のもの）。今回の範囲外 |

## 5. 旧 URL の移行方針
旧サイトの URL 構成は、日本語が既定でルート（`/`、`/company` など）、英語が `/en/...`、そのほかの言語が `/vi`、`/ko`、`/zh-TW`。アクセス実績のデータ（GA4、Search Console）には、この作業ではアクセスできないため、未確認。

| 旧 URL | 現在の扱い（公開モード） | 方針 |
|---|---|---|
| `/` | V1 Home | そのまま |
| `/company`、`/cancel-policy` | 同じ URL の V1 ページ | そのまま |
| `/en` | 301 → `/` | 維持 |
| `/en/company`、`/en/cancel-policy` | 301 → 同じページ | 維持 |
| `/contact`、`/en/contact` | 301 → `/inquiry` | 維持 |
| `/reservation`、`/en/reservation` | 301 → `/private-guide` | 維持 |
| `/business-inquiry`、`/en/business-inquiry` | 404 | V1 の「For Business」を公開するとき、`/business-inquiry` は同じ URL で配信。`/en/business-inquiry` → `/business-inquiry` の 301 を追加する |
| `/pricing`、`/en/pricing` | 404 | 旧ページは「準備中」の仮ページ。候補: 料金を載せている `/private-guide` への 301（承認が必要） |
| `/careers`、`/en/careers` | 404 | 旧ページは「準備中」の仮ページ。404 のままを推奨（ガイド募集は外部の Google フォーム） |
| `/vi`、`/ko`、`/zh-TW` とその下のページ | 404 | 2026-11-11 の指示どおり 404。対応する英語ページへの 301 は、アクセス実績を見て判断する |
| `/guide-community`、`/partner/apply` | 307 → Google フォーム | 維持 |

関係のないページへの一括転送はしない。上の表のうち「追加」と「候補」は、承認後に `next.config.ts` の `PUBLIC_MODE_REDIRECTS` に追加する。

## 6. V1 を本番公開するときの切り替え作業（すべて承認が必要）
1. このブランチをレビューし、main に統合する。統合した時点で、main の旧サイトのコードは V1 に置き換わる。
2. 本番の環境変数:
   - `NEXT_PUBLIC_WEBSITE_V1_PREVIEW` を外す（公開モード）
   - `BOOKING_GAS_URL` と `BOOKING_GAS_SECRET` を本番用にする
   - `NEXT_PUBLIC_GTM_ID` は V1 では使われない
3. ホスティングを確定し、`connectripjapan.com` の DNS を向ける。Netlify の場合は、`netlify.toml` の noindex ヘッダーを外す。
4. 公開ページを追加する（それぞれ承認後）: `PUBLIC_PATHS` への追加、Privacy Policy V1 の `/privacy-policy`、About、Explore Kansai の `EXPLORE_PUBLIC`。
5. 旧 URL のリダイレクトを追加する（第5節で承認されたもの）。
6. 切り替えの後でやること:
   - 管理画面と旧応募データの扱いを決める（データを書き出したうえで削除するか、維持するか）
   - `next-intl` と `@next/third-parties` を依存から外す
   - 旧サイトの GTM と GA4 の扱いを決める
   - Search Console にサイトマップを再送信する

## 7. 検証結果
- tsc（`next typegen` の後）、ESLint（プロジェクト全体）: OK
- `bun run check:booking`: OK
- `bun run check:v1-guides`: 自己テストすべて合格。公開中のレコードで不合格は 0 件
- `npx next build`（公開モード）: OK
- 公開モード（next start、ポート 3099）:
  - 公開7ページは 200
  - プレビュー専用のページは 404
  - 旧 URL の 301 と 307 は削除前と同じ
  - `/api/contact` と `/api/reservation` は 404
  - sitemap は7件、robots は変更なし
- プレビュー（3013）:
  - `/` は `/v1` へ転送
  - V1 の主要15ページは、PC とスマホの両方で 200。ヘッダーとフッター（12リンク）があり、コンソールエラーと横スクロールはなし
  - 会社概要と About の会社情報は移行前と同じ表示
  - `/admin/login` と `/guide-community`（Google フォームへの転送）は維持
