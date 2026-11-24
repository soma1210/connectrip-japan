# GA4・Cookie同意・プライバシーポリシー 最終レビュー（2026-11-24）

- **対象ブランチ：** `claude/ga4-consent`
  - `origin/main` e4c1cfb を起点にしたもので、V3 Award の変更は含まない。
- **状態（2026-11-24 第2回）：** 法務の判断待ちのため公開を停止中。ローカルに Commit 済み。**Push・PR・Merge・Deploy は行っていない。**

> このレポートは法的助言ではない。公式資料で確認できた範囲の整理であり、法令に適合していると断定はしていない。

---

## 0. 結論（3区分）

### A. 公開できる項目（実装と検証が済み、事実どおりの記述）

**実装**

- Consent Mode v2（Basic）
  - 同意前は gtag.js を読み込まない。
  - 承諾時に送るのは analytics だけ。広告系の同意3項目は常に denied のまま。
- 同意を撤回したとき
  - `ga-disable` を有効にし、consent を denied に更新し、`_ga` Cookie を削除する。
  - 次のページからはタグを読み込まない。
- 同意の記録：localStorage の `crj-cookie-consent` に分けて保存し、12か月で失効する。
- page_view：二重送信なし（初回1回・遷移2回・戻る1回で、ちょうど4件）。
- 成果イベント（4種）
  - API が成功を返したときだけ送る。失敗した送信は計測しない。
  - 同じ予約・問い合わせは1回だけ数える。
  - 個人情報は含めない。
- バナー（英語）
  - Accept と Reject は同じ大きさ。
  - 文字のコントラストは WCAG AA を満たす（Accept 5.05、Reject 15.87）。
  - オープニング演出が終わってから表示する。
  - キーボードで操作できる。JavaScript が無効でも本文は読める。
- 予約・問い合わせ機能への影響はない（追加したのは計測の1行だけ）。

**ポリシー本文のうち、実装した事実そのものを書いた記述**

- 同意の流れ、拒否・未選択時は読み込まないこと、撤回の方法、記録の12か月保存。
- Cookie の名前と最長2年の保持（Google の公開仕様）。
- フォームの入力内容を送らないこと、広告タグを使わないこと。
- Google LLC（米国）であること、Google の各リンク。
- sessionStorage の説明（既存の文のまま）。

### B. 修正が必要な項目（公開前に作業が必要）

1. ~~**GA4 管理画面の設定**~~ → **2026-11-24 済み**（オーナーが設定・確認。第12章を参照）。以下は当時の作業内容（ポリシー本文が事実になる前提）
   - 保持期間：14か月
   - Google シグナル：無効
   - Google 広告とのリンク：なし
   - データ共有設定：確認
   - 拡張計測：「フォームの操作」をオフ、「履歴の変更によるページ変更」をオン
2. ~~**Vercel の Production 環境変数**~~ → **2026-11-24 済み**（Production のみ。第14章）
3. **ポリシーの「Last updated」**：公開日に更新する。
4. ~~**既存テスト `api.test.ts` の書き方の問題**~~ → **2026-11-24 対策済み**（第13章）。以下は当時の内容：（今回の変更が原因ではない。第4章）
   - `.env.local` があると Neon に接続してしまう。
   - 修正するには予約チームの判断が必要。今回は変更していない。

### C. 法務の承認が必要な項目

1. ポリシーの追記文（第3・4・5・7・9・10章）の確認と承認。
2. **今回の追加は「重要な変更」に当たるか。**
   - 第13章は「重要な変更は事前に告知する」と約束している。
   - 当たる場合は、事前告知の方法と期間を決める必要がある。
3. 第7章の前置き「委託先は当社へのサービス提供のためにのみ利用」は、Google アナリティクスにもそのまま当てはまるか。
   - Google の規約とデータ共有設定を前提に確認する。
4. 個人情報保護法の整理
   - 第28条（外国にある第三者への提供）
   - 第31条（個人関連情報の第三者提供）
5. 電気通信事業法の外部送信規律に当たるかの判定。
   - 自社サービスを紹介するだけのサイトは対象外とされている。
   - ただし Explore Kansai・Travel Guide などの情報提供ページを、どう扱うかの判断が要る。
6. EU・英国
   - EU は DPF への依拠を確認する。
   - 英国は 2026-02-05 施行の統計目的の例外を使わず、同意方式を続けることの確認。
7. 撤回の直前に発生したイベントが遅れて送られること（第3章）を、許容するかどうか。

---

## 1. 基本設定（2026-11-24 オーナー決定）

| 項目 | 決定 | 反映先 | 実機での確認 |
|---|---|---|---|
| GA4 データ保持 | 14か月 | 第9章「after 14 months」、`PRIVACY_DECISIONS` | GA4 管理画面（未。`PRIVACY_TECH_CHECKS.ga4Retention`） |
| Google シグナル | 無効 | 第9章、コード（`allow_google_signals=false`） | GA4 管理画面（未。`ga4NoAdvertising`） |
| Google 広告連携 | なし | 第9章「not linked to Google Ads」 | GA4 管理画面（未。`ga4NoAdvertising`） |
| 同意記録の有効期間 | 12か月 | 第9章、コード（`CONSENT_MAX_AGE_MS`） | 実装済み・QA 済み |

---

## 2. Cookie バナーの再確認

### 英語の表現

- **タイトル・説明：** 指定どおりの文言。
- **設定画面：** 1か所を事実に合わせて修正した。
  - 修正前：「Uses cookies from Google LLC」
  - 修正後：「Uses Google Analytics cookies; the service is provided by Google LLC」
  - 理由：`_ga` Cookie は Google のスクリプトが当サイトのドメインに書き込むもので、Google LLC の Cookie そのものではないため。
- **文言の候補（任意）：** 説明文の「at any time」は、設定の変更がフッターからいつでもできることと合っている。

### 見やすさ（WCAG のコントラスト）

| 要素 | 比率 | 判定 |
|---|---|---|
| Accept（修正前：ブランドの朱 #e0532f に cream） | 3.17 | 不合格（13px の文字には 4.5 必要） |
| **Accept（修正後：深いエンジ #ad3b1d）** | **5.05** | AA 合格。ボタンと背景の差は 3.14（ボタンなど文字以外は 3 以上が基準） |
| Reject（cream #f3e8d2 に黒文字） | 15.87 | 合格。サイト全体の `.bg-cream` の暗色化を避けるため、色を直接指定 |
| 説明文・リンク・状態ラベル | 9.16 / 8.08 / 5.91 | 合格 |

Accept と Reject は同じ大きさ（高さ44px）・同じ段に並ぶ。Reject は明るい cream、Accept はエンジで、どちらも目立ち、どちらかに誘導する配色ではない。

### 同意撤回の動作（QA で確認）

- フッターの「Cookie Settings」で設定が開き、フォーカスは見出しに移る。現在の状態「On」も表示される。
- Reject を押すと `_ga` Cookie が削除され、フォーカスはフッターのボタンに戻る。
- その後のページ遷移・戻る・スクロール・フォーム操作では、送信は0件。
- 再読み込み後もタグは読み込まれない。
- WebKit ではキーボード操作で確認した。Safari はマウスでクリックしたボタンにフォーカスを移さないため。

---

## 3. 撤回直前のイベントが遅れて送信される件

### 実測（Chromium で本物の gtag.js を使用。送信はすべてローカルで遮断）

| 状況 | 撤回の0.2秒前に発生したイベント（scroll） |
|---|---|
| 撤回して同じページにとどまる | 撤回の **約4.8秒後** に送信。`gcs=G101`（発生時点の同意状態）、client_id あり |
| 撤回してページを移動する | 同じく約4.8秒後に送信 |
| 撤回してすぐ再読み込みする | 送信されなかった |
| 参考：撤回しない場合 | 発生の約5.0秒後に送信 |

### 原因

- gtag.js は、イベントを数秒（実測で約5秒）ためてからまとめて送る。
- `ga-disable` と `consent update denied` は、**撤回より後に発生するイベント**を止める。ただし、すでにたまっている分を取り消す公式の API はない。

### 影響

- 遅れて送られるのは、**同意が有効だった間に発生した**イベント（実測では撤回前の約5秒以内）だけ。撤回後に発生したイベントは送られない（QA で0件を確認）。
- GDPR 第7条(3)は「撤回は、撤回前の同意に基づく処理の適法性に影響しない」としている。そのため法的な影響は小さいと考えられる。ただし断定はしない。
- ポリシーの「撤回時点から収集を停止」「撤回前に収集された情報には影響しない」という表現とは矛盾しない。

### 改善の可能性

| 案 | 内容 | 評価 |
|---|---|---|
| ① 現状のまま、事実として記録する | 追加の実装なし | **推奨。** 公式仕様の範囲で、壊れにくい |
| ② ポリシーに1文足す | 例：「Information recorded in the few seconds before you withdraw may still be sent to Google.」 | 透明性は高まる。法務が必要と判断した場合だけ |
| ③ 撤回時にページを再読み込みする | 実測では、たまっていた分も送られなかった | gtag の非公開の挙動に頼るうえ、画面が飛ぶ。推奨しない |
| ④ fetch・sendBeacon を上書きして遮断する | 送信を力ずくで止める | 公式の方法ではなく、壊れやすい。推奨しない |

---

## 4. 既存テスト `api.test.ts` の 503/409 不一致

### 原因

- テストは、データベースがない場合に API が 503 を返すことを期待している（96行目）。
- テストが `POSTGRES_URL` を消すのは、もっと後の110行目。
- Bun は `.env.local` を自動で読み込むため、96行目の時点ではデータベース（Neon、ap-southeast-1。本番か検証用かは不明）に接続されていた。
- 予約 API は固定の submissionId で書き込みを試み、同じ ID の行がすでにあって内容が違ったため 409（conflict）を返した。
  - その行は過去の実行で作られたもので、日付が毎日変わるため内容のハッシュが一致しない。
  - conflict のため、新しい行は書き込まれていない。

### 検証

- `bun --no-env-file`（`.env` を読まない）で、既存テスト8件を2か所で実行した。
  - このブランチ：**8件すべて合格**
  - 変更のない `origin/main` のコピー：**8件すべて合格**（確認後にコピーは削除）
- `git diff origin/main -- src/lib src/app/api` は差分なし。予約・問い合わせ API には一切触れていない。
- **結論：** 今回の変更による不具合ではない。テストが実行環境の `.env.local` に左右される問題。

### 対応

予約の業務ロジックもテストも変更していない。予約チームに次を提案する。

- テストの先頭で `POSTGRES_URL` を消す、またはテストを `--no-env-file` で実行するようスクリプトを変える。
- 開発機の `.env.local` が、どのデータベースを指しているかを確認する。

---
## 5. 法務上の未解決事項（推測で断定しない）

| # | 論点 | 確認できた公式情報 | 未解決の点 | 承認者・判断者 |
|---|---|---|---|---|
| L1 | 日本：電気通信事業法の外部送信規律（第27条の12） | 総務省 FAQ では、自社の商品・サービスの案内ページは「自己の需要」によるもので、電気通信事業に当たらず規律の対象外とされる。一方で、業界情報など他者向けの情報もあわせて提供する自社サイトは「他人の需要に応ずる」と判断される場合がある | Explore Kansai・Travel Guide（公開範囲は限定）などの旅行情報ページが「各種情報のオンライン提供」に当たるか。対象外と判断した場合も、その記録を残す。なお、規律の公表事項（送信される情報・送信先・利用目的）は第9章と第7章ですでに満たしている | 法務 |
| L2 | 日本：個人情報保護法 第31条（個人関連情報） | Cookie ID や IP アドレスは個人関連情報に当たりうる。提供先が個人データとして取得することが想定される場合は、本人の同意の確認が必要（PPC ガイドライン通則編 3-7） | Google が GA のデータを個人データとして取得すると「想定される」か（Google シグナルは無効、広告連携なしの前提で）。令和8年改正の統計作成等の特例の扱い | 法務 |
| L3 | 日本：個人情報保護法 第28条（外国にある第三者） | 第8章の既存の確認事項（各事業者が第28条のどれに当たるか）に Google をすでに含めている | 当社にとって GA のデータが「個人データ」に当たるか。当たる場合の根拠（基準に適合する体制、または同意） | 法務 |
| L4 | 第13章の「重要な変更」 | 自社ポリシーで「重要な変更は事前に告知する」と約束している | GA4 の追加は重要な変更か。重要な場合は、事前告知の方法（サイト上の告知）と期間を決める | 法務・経営 |
| L5 | 第7章の前置きと Google | 委託先は「当社へのサービス提供のためにのみ利用」と書いている | Google の規約上、GA のデータの利用範囲（データ共有設定をすべてオフにした場合を含む）がこの表現に合うか。合わなければ、Google の行だけ注記する | 法務 |
| L6 | EU：ePrivacy・GDPR | EDPB Cookie Banner Taskforce の報告書では、多数の当局が第1階層に拒否ボタンが必要とし、事前チェックは無効としている | 本実装は同意方式で対応済み。加盟国ごとの細則は未確認 | 法務（必要に応じて） |
| L7 | EU→米国の移転 | Google は EU-U.S. DPF の認証を受けており、2023-09-01 から EEA のデータ移転に DPF を使っていると公表している | DPF の公式リストでの現在の認証状況の確認。当社側の記録 | 法務 |
| L8 | 英国：PECR・DUAA | ICO は「拒否は承諾と同じくらい簡単に」としている。DUAA による統計目的の同意免除は 2026-02-05 施行（二次情報。原文は未確認） | 免除は「その目的のためだけ」の保存・アクセスが条件で、GA（Google 側での利用を含む）が当たるかは不明確。**本実装は免除に頼らず同意を取るため、安全側** | 法務（確認のみ） |
| L9 | 撤回直前のイベント | 第3章を参照 | 許容するか、ポリシーに1文足すか | 法務 |

### 承認が必要な項目（チェックリスト）

- [ ] ポリシーの追記文（第3・4・5・7・9・10章）の承認（L4・L5 を含む）
- [ ] 重要な変更に当たるかの判断と、事前告知の要否・方法（L4）
- [ ] 外部送信規律に当たるかの判定記録（L1）
- [ ] 個人情報保護法 第28条・第31条の整理（L2・L3。第8章の既存項目と一緒に）
- [ ] EU・英国の確認（L6〜L8）
- [ ] 撤回直前イベントの扱い（L9）
- [ ] バナーの文言・デザインの承認
- [ ] 公開日（Last updated）
- [ ] 本番公開の指示

---

## 6. 本番公開の手順（確定案）

**前提：** 第5章の承認がすべて済み、オーナーから「公開してよい」と明示的な指示があること。

### Step 1：GA4 管理画面（デプロイ前）

1. 管理 → データの収集と修正 → データ保持：**イベントデータ・ユーザーデータとも14か月**
2. 管理 → データの収集：**Google シグナルを無効**
3. 管理 → サービス間のリンク：**Google 広告のリンクがないこと**を確認
4. アカウント設定 → データ共有設定：内容を確認し、方針を記録する（L5）
5. データストリーム → 拡張計測機能
   - 「ページビュー」の詳細設定で、**ブラウザの履歴イベントに基づくページの変更をオン**
   - **フォームの操作をオフ**
6. 管理 → カスタム定義：イベントスコープで `form_type`・`lead_source`・`tour_id` を登録する
7. 内部トラフィックの定義（社内 IP）とデータフィルタ（まずテストモードで）
8. GTM-TFBSVRBX：公開中の GA4 タグがないこと、サイトに設置されていないことを確認する

確認できたら、`PRIVACY_TECH_CHECKS` の該当項目を `done: true` にする。人が確認した後だけ。

### Step 2：Commit・Push

1. `claude/ga4-consent` にコミットする。対象は下の「変更ファイル」だけ。`.env.local` と `AGENTS.md` は含めない。
2. Push すると Vercel の Preview がビルドされる。
   - Preview には環境変数を入れないため、バナーとタグは出ない。
   - Preview で確認すること：サイトの見た目が変わっていないこと、ポリシー本文が新しい文になっていること。
3. Preview でバナーまで確認したい場合は、本番の測定 ID を使わず、**テスト用の別の GA4 プロパティ**の ID を、そのブランチの Preview 環境だけに設定する。

### Step 3：Vercel の環境変数（Merge の前に）

1. Vercel → Project → Settings → Environment Variables
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-JRP0JE887C`
   - 環境：**Production だけ**（Preview・Development にはチェックしない）
2. `GA_ALLOW_NON_PRODUCTION` は、どの環境にも設定しない。
3. 注意：`NEXT_PUBLIC_` の変数はビルドのときに埋め込まれる。そのため、**Merge の前に設定**しておき、Merge で走る本番ビルドに反映させる。設定前にビルドした場合は、再デプロイが必要。

### Step 4：PR

1. `main` ← `claude/ga4-consent` の PR を作る。
2. 差分が GA4・同意・ポリシーのファイルだけであることを確認する。
3. `main` が進んでいたら rebase し、QA をもう一度行う。
4. PR の説明に、承認の記録（日付・承認者）、QA の結果、ロールバックの手順を書く。

### Step 5：Merge → Production Deploy

1. Merge すると、Vercel が Production を自動でデプロイする。
2. ビルドが成功し、Production の環境変数が反映されていることを確認する。

### Step 6：本番での確認（デプロイ直後）

1. シークレットウィンドウで https://connectripjapan.com を開く。
   - オープニング演出の後にバナーが出ること。
   - DevTools の Network に、`gtag/js` も `collect` も出ていないこと。
2. **Reject** を押す。再読み込みしても、送信がないこと。
3. 新しいシークレットウィンドウで **Accept** を押す。
   - `gtag/js?id=G-JRP0JE887C` と `g/collect` が出ること。
   - `collect` に `gcs=G101` が付いていること。
4. GA4 の **リアルタイム** レポートで、1ユーザーが表示されること。
5. **DebugView：** Tag Assistant（tagassistant.google.com）で本番 URL に接続し、イベントを確認する。
   - ページ遷移で page_view が1件ずつ出ること。
   - Home のツアーで予約ダイアログを開くと、`booking_request_start` が出ること。
6. 予約・問い合わせの成功イベント
   - 実際の送信はスタッフ通知と DB 保存を伴うため、**スタッフと調整したテスト送信を1件だけ**行い、`generate_lead` を確認する。
   - テストした記録は、管理画面で「テスト」と分かるように処理する。
7. フッターの Cookie Settings から Reject を押し、`_ga` Cookie が消えること、その後送信がないことを確認する。
8. GA4 の各レポートでホスト名を見て、`localhost` や `*.vercel.app` が混ざっていないことを確認する。

### ロールバック

- **推奨：** PR #14 と同じく、Revert PR → Merge で戻す。ポリシーもバナーも元に戻る。
- **緊急停止：** Vercel の `NEXT_PUBLIC_GA_MEASUREMENT_ID` を削除して再デプロイすると、バナーとタグが消える。
  - ただし、ポリシーは「同意した場合に GA を使う」という文のまま残るため、早めに Revert すること。

### Step 7：V3 Award への反映

- `main` に入った同じコミットを、V3 に cherry-pick する。
- V3 の worktree に残っている未コミットの GA4 試作は、取り込むときに置き換える。それまでは触らない。

---

## 7. 既存のコードの保護状況（2026-11-24 時点）

| 対象 | 状態 |
|---|---|
| `origin/main` | e4c1cfb のまま（変更なし） |
| `claude/ga4-consent` | 未コミット・未 Push（リモートにブランチなし）。upstream は外してある |
| V3 Award の worktree | HEAD 5170c3a。未コミットの GA4 試作4ファイルは以前のまま（変更していない） |
| V2・dark-cream など他の worktree | 変更していない |
| 予約・問い合わせ API（`src/lib`・`src/app/api`） | `origin/main` と差分なし |

### 変更ファイル（`claude/ga4-consent`）

新規：

- `src/website-v1/analytics.ts`
- `src/website-v1/consent/consent.ts`
- `src/website-v1/components/analytics/` 内の5ファイル
  - `Analytics.tsx`
  - `CookieConsent.tsx`
  - `CookieSettingsButton.tsx`
  - `trackEvent.ts`
  - `BookingStartTracker.tsx`
- `.claude/legal/ga4-cookie-consent-review.md`（本書）

変更：

- `src/app/v1/layout.tsx`
- `src/website-v1/components/Layout.tsx`
- `src/website-v1/components/LiveInquiryForm.tsx`
- `src/website-v1/components/booking/PrivateGuideRequestForm.tsx`
- `src/website-v1/components/booking/TourBookingRequest.tsx`
- `src/website-v1/views/PageViews.tsx`
- `src/website-v1/content/privacyPolicy.ts`
- `src/website-v1/content/privacyPolicy.test.ts`
- `.env.example`

---

## 7-2. 最終 QA（2026-11-24、最終ビルド）

- **E2E：93/93 合格**（Chromium・WebKit）
  - 確認した項目：
    - 同意前・拒否後は送信0件
    - 承諾後は `gcs=G101`
    - page_view は4件で重複なし
    - 成果イベントは成功時だけ1件ずつ、失敗時は0件
    - 撤回後は送信0件、`_ga` 削除
    - 375〜1440px で崩れなし
    - キーボード操作、JavaScript 無効時
    - ポリシーの表示、ページ上のエラー0件
  - Google への送信と、予約・問い合わせ API への送信は、すべてローカルでモックした。
- **Type Check・Lint：** 合格
- **既存テスト：** 8/8 合格（`bun --no-env-file` で実行）
- **Production Build：** 合格
  - 環境変数なしでは、バナーもタグもどのページにも出ない。

---

## 12. 最終法務確認（2026-11-24・第2回）と公開判断

### 12-1. 12項目の確認結果

| # | 項目 | 結果 | 根拠・残る点 |
|---|---|---|---|
| 1 | 利用目的 | 事実と一致 | 第5章の追加項目、第9章（集計のみ・個人を特定しない）。実装もそのとおり |
| 2 | Google LLC への送信 | 事実と一致 | 第9章、第7章の表。送信内容は E2E で確認（個人情報を含まない） |
| 3 | Cookie | 事実と一致 | `_ga`・`_ga_<ID>`、最長2年（Google の公開仕様）。同意記録は localStorage に12か月 |
| 4 | 同意・拒否・撤回 | 事実と一致（L9 を除く） | QA 93/93。撤回の直前約5秒のイベントは遅れて送られる場合がある（第3章、L9） |
| 5 | 保持期間 | 事実と一致 | GA4 は14か月（オーナー確認済み）。本文は「after 14 months」 |
| 6 | データ共有との整合 | おおむね一致・要確認 | データ共有はすべてオフ（オーナー確認済み）で、「広告に使わない」と矛盾しない。第7章前置きの「委託先は当社へのサービス提供のためにのみ利用」が、Google の GA 規約上の Google 自身の利用（サービスの維持・保護など）と完全に一致するかは法務の確認が必要（L5） |
| 7 | 国外移転 | **要判断** | 第8章の既存の確認事項（第28条の区分）に Google の扱いが加わる（L3） |
| 8 | Google へのリンク | 事実と一致 | partner-sites、Privacy Policy、オプトアウト・アドオン |
| 9 | 個人情報保護法・外部送信規律 | **要判断** | 第31条（個人関連情報）の該当性（L2）。外部送信規律に当たるかの判定記録（L1） |
| 10 | GDPR・英国 | 実装は同意方式で安全側・要確認 | 第1階層に同じ大きさの Reject、事前チェックなし。DPF の認証状況の確認（L7）、英国の新しい例外は使わない方針の確認（L8） |
| 11 | 重要な変更の事前通知 | **要判断（公開を止める理由）** | 第13章は「重要な変更は事前に告知」と約束している。GA4 の追加が重要な変更かどうか、告知の方法・期間を決めないまま公開すると、自社ポリシーに反するおそれがある |
| 12 | 最終更新日 | 手続き待ち | 公開日が決まった時点で更新する（現在は 2026-11-19 のまま） |

### 12-2. 公開判断

**公開を停止した（Push・PR・Merge・Deploy は行っていない）。**

理由：次の判断は法務・経営が行うもので、Claude が推測で承認することはできない。どれも、承認されたことを示す記録がまだない。

1. **ポリシー追記文の承認**（第3・4・5・7・9・10章）
2. **重要な変更に当たるかと、事前告知の方法**（#11）
3. **個人情報保護法 第28条・第31条の整理**（#7・#9。第8章の既存項目と一緒に）
4. **外部送信規律に当たるかの判定記録**（#9）
5. 撤回直前のイベントの扱い（L9）、第7章前置きの表現（L5）、EU の DPF の確認（L7）

承認が済めば、第6章の手順で公開できる。Vercel の環境変数とテストの安全対策は済んでいる。

---

## 13. データベースの安全対策（2026-11-24）

- **原因：** Bun は `.env.local` を自動で読み込む。`src/lib/booking-request/api.test.ts` は、ルート（`POST /api/v1/booking-requests`）に `process.env` をそのまま渡すため、Neon に接続していた。他のテストは、空の環境変数を明示的に渡しているため接続しない。
- **対策（予約・問い合わせ API のコードは変更していない）：**
  1. `api.test.ts` の先頭で `POSTGRES_URL`・`POSTGRES_URL_NON_POOLING` を削除する。どう実行しても「データベースなし」の状態でしか動かない。
  2. `package.json` のテスト用スクリプトを `bun --no-env-file` に変えた（`check:booking`・`check:inquiries`、新しく `check:site`・`test:unit`）。
- **検証：**
  - 偽の `POSTGRES_URL`（127.0.0.1:1）を与えても、接続を試みずに合格した。
  - `bun run test:unit` で全テストが合格。
- **接続先の確認：**
  - Vercel では `POSTGRES_URL` が Production 用と Preview/Development 用に分かれて登録されている。
  - `.env.local` が本番を指していないかは、秘密情報を開示しないと確認できないため、**確認していない**。
  - 本物のデータを使うテストは行わない。
  - 開発機の `.env.local` が Development 用の値か（`vercel env pull` で作ったものか）を、オーナー側で確認することを推奨する。

## 14. Vercel の環境変数（2026-11-24 に確認・設定）

- 設定前の `vercel env ls`：GA・GTM 関係の変数はなかった（重複・競合なし）。`GA_ALLOW_NON_PRODUCTION` もない。
- 追加した変数：`NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-JRP0JE887C`、**Production のみ**。
- 現在の `main` のコードはこの変数を読まないため、本番サイトへの影響はない。GA4 のコードが `main` に入ってビルドされたときに、初めて有効になる。
- 値の目視確認は、本番の秘密情報を取り出す必要があるため行っていない。公開後に、gtag のリクエスト `gtag/js?id=G-JRP0JE887C` で確認する。

---

## 8. 参照した公式情報

- 総務省 外部送信規律 FAQ：https://www.soumu.go.jp/main_sosiki/joho_tsusin/d_syohi/gaibusoushin_kiritsu_00002.html
- 総務省 外部送信規律 資料：https://www.soumu.go.jp/main_content/000862755.pdf
- 個人情報保護委員会 ガイドライン Q&A：https://www.ppc.go.jp/personalinfo/faq/APPI_QA/
- 個人情報保護委員会 ガイドライン通則編：https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/
- Google Consent Mode（basic）：https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic
- Google Analytics データ保持：https://support.google.com/analytics/answer/7667196
- Google 広告向け機能のポリシー要件：https://support.google.com/analytics/answer/2700409
- Google データ移転の枠組み：https://policies.google.com/privacy/frameworks
- Google 広告・解析製品のデータ移転：https://business.safety.google/adsdatatransfers/
- EDPB Cookie Banner Taskforce 報告書：https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf
- 英国 DUAA の Cookie 例外（二次情報）：https://bratby.law/data-use-and-access-act-2025-commencement/

---
## 9. プライバシーポリシーの差分（英語原文。左＝現在の公開文 `main`、右＝変更後）

```diff
@@ -48,7 +48,7 @@
 
 When you visit this website, the servers of our hosting provider (Vercel) process technical information that your browser sends, such as your IP address, browser type, device information, the pages requested and the date and time of access. This is used to deliver the website, keep it secure and prevent abuse. Our booking form also uses your IP address for a short time to limit repeated submissions.
 
-This website does not currently use cookies for analytics or advertising. See Section 9.
+If you agree, this website also uses Google Analytics, which uses cookies to collect information about how you use the website. We do not use it unless you accept analytics cookies, and we do not use advertising cookies. See Section 9.
 
 ## 4. How We Collect Information
 
@@ -58,7 +58,7 @@
 - through the external forms we link to, such as the Google Forms used for guide and partner applications;
 - from the guides who deliver your tour, for example if something happens on the day that we need to follow up on;
 - from travel companies or other business partners who make a request on your behalf, where this applies; and
-- automatically, when you use this website (see Section 3).
+- automatically, when you use this website (see Sections 3 and 9).
 
 ## 5. How We Use Personal Information
 
@@ -71,6 +71,7 @@
 - to review guide applications, arrange interviews and manage our work with guides;
 - to reply to business inquiries and manage our relationships with business partners;
 - to run, maintain and secure this website, and to prevent fraud, spam and abuse;
+- to understand how visitors find and use this website, through Google Analytics, if you accept analytics cookies (see Section 9);
 - to improve our services, using information that does not identify you wherever possible;
 - to send marketing messages, only if you have agreed to receive them (see below); and
 - to comply with laws and regulations, respond to requests from public authorities, and establish or defend legal claims.
@@ -112,6 +113,7 @@
 | Resend | Sending an email notice to our staff when a booking request or inquiry arrives | The details of your request, including your name and email address |
 | Microsoft (Microsoft 365) | Our company mailbox (contact@connectripjapan.com): receiving and replying to email | Your email address and the content of your messages |
 | Google (Google Forms) | Guide and partner application forms | The details you enter in those forms |
+| Google (Google Analytics) | Measuring how visitors use this website, only if you accept analytics cookies (see Section 9) | Information about your visit and your device collected through cookies, such as the pages you view, how you arrived at the website and your approximate location |
 | Stripe (when used for payment) | Invoices and payments | Your name, email address and payment information |
 | Neon (past application data) | Storing guide applications and partner survey answers received through our earlier website | The details given in those forms |
 
@@ -131,11 +133,40 @@
 
 Cookies are small text files that a website stores in your browser. Similar technologies include local storage and session storage.
 
-This website does not currently use analytics, advertising or social media tracking cookies, and does not load tools such as Google Analytics or Google Tag Manager. We do not use advertising tags.
+### Google Analytics
 
+With your consent, this website uses Google Analytics 4, a web analytics service provided by Google LLC (United States). We use it to understand how visitors find and use this website, for example which pages are viewed, where visits come from (such as a search engine, social media or another website), the approximate country or region of visitors and the type of device, so that we can improve the website and our services. We look at this information in aggregate reports and do not use it to identify individual visitors.
+
+If you accept analytics cookies, Google Analytics stores cookies in your browser (named "_ga" and "_ga_" followed by an identifier) that keep a random identifier for up to 2 years, and your browser sends Google information such as:
+
+- the pages you visit, the page or website you came from, and the date, time and length of your visit;
+- your interactions with the website, such as scrolling, clicks on links to other websites, and whether a booking request or inquiry was successfully sent (but not what you wrote in it);
+- your browser, operating system, language, screen size and type of device; and
+- your IP address, which Google uses to estimate your approximate location (such as your country, region and city). Google Analytics does not log or store IP addresses.
+
+We do not send Google your name, email address, phone number, the content of your messages, or any other information you enter in our forms. We do not use Google Analytics advertising features, such as Google signals or remarketing, our Google Analytics account is not linked to Google Ads, and we do not allow this information to be used for personalized advertising.
+
+Google handles this information on its systems, which may be located in the United States and other countries outside Japan (see Section 8). For how Google uses information from websites that use its services, see https://policies.google.com/technologies/partner-sites and Google's Privacy Policy at https://policies.google.com/privacy
+
+We have set Google Analytics to delete the visit-level and user-level information linked to its cookies after 14 months. Reports that only show totals and do not identify individual visitors may be kept longer.
+
+### Your choice
+
+Google Analytics is off until you choose. When you first visit, a banner asks whether you accept analytics cookies. Google Analytics is loaded only if you select "Accept Analytics". If you select "Reject Analytics" or make no choice, it is not loaded and no information is sent to Google through it. Closing the banner or continuing to browse is not treated as consent. Rejecting analytics cookies does not affect your use of this website.
+
+You can change your choice or withdraw your consent at any time with the "Cookie Settings" link at the bottom of every page. If you withdraw it, Google Analytics stops collecting information from that point and we delete its cookies from your browser. Withdrawing consent does not affect information collected before you withdrew it.
+
+We remember your choice in your browser's local storage for 12 months, after which we ask again. This record contains only your choice and the date, stays in your browser and is not sent to us or to Google.
+
+You can also block or delete cookies in your browser settings, or use Google's browser add-on to opt out of Google Analytics: https://tools.google.com/dlpage/gaoptout
+
+### Other storage
+
+We do not use advertising or social media tracking cookies, and we do not use advertising tags.
+
 We use your browser's session storage for one functional purpose only: to remember, while your browser tab is open, that the opening animation on our home page has already been shown. This stays in your browser, is not sent to us, and is cleared when you close the tab.
 
-You can also block or delete cookies in your browser settings.
+If you have questions about cookies or Google Analytics, please contact us (see Section 14).
 
 ## 10. Data Retention
 
@@ -147,6 +178,8 @@
 
 The IP address that our booking and inquiry forms use to limit repeated submissions is kept for about 10 minutes.
 
+For how long Google Analytics information and your cookie choice are kept, see Section 9.
+
 ## 11. Data Security
 
 We take steps to prevent the leakage, loss or damage of personal information and to manage it safely, including:
```

---

## 10. 変更後の全文（英語。公開されるもの）

## Privacy Policy

Last updated: 2026-11-19

### 1. Introduction and Data Controller

Connectrip Japan Co., Ltd. (Connectrip Japan 株式会社, "Connectrip Japan", "we", "us" or "our") respects your privacy. This Privacy Policy explains how we collect, use, share and protect personal information when you visit our website, contact us, request or book our services, or apply to work with us.

We handle personal information in accordance with the Act on the Protection of Personal Information of Japan (APPI) and other applicable Japanese laws.

Connectrip Japan Co., Ltd. is the business operator responsible for your personal information (the "data controller").

- **Company:** Connectrip Japan Co., Ltd.
- **Address:** 1-15-25 Nakajima, Nishiyodogawa-ku, Osaka, Japan
- **Representative:** Riku Oizumi, Representative Director & CEO
- **Personal Information Management Officer:** Soma Beppu, Director & Deputy Representative |⁠ EVP
- **Privacy contact:** contact@connectripjapan.com

### 2. Scope of This Policy

This policy applies to personal information we handle in connection with:

- Private Guide services (private tours planned around your request);
- Fixed Guided Tours (tours with a set itinerary and published price);
- general inquiries from travelers;
- business and partnership inquiries from companies and other organizations;
- guide applications and interviews; and
- the operation, security and improvement of this website.

This policy does not cover websites, apps or services run by others, including social media platforms and the external forms we link to (such as Google Forms). Those services have their own privacy policies. This policy does apply to the personal information we receive through them.

### 3. Information We Collect

#### Information you give us

- Booking requests (Private Guide and Fixed Guided Tours): your name, email address, phone number (optional), country or region of residence (optional), preferred and alternative dates and start times, tour length, the number of adults and children (or, for a fixed tour, the number of guests and your preferred guide language), the areas and interests you choose, and anything you write in your message.
- Health and similar information: we do not ask for information about your health, medical conditions or disabilities through this website, and our forms are not designed to collect it. Please do not include it in your request. If such information is needed to deliver your tour safely, we will explain why and ask for your explicit consent before we receive it. If you send it to us without being asked, we will not use it unless you give that consent, and we will delete it if you do not.
- Inquiries: your name, email address and the details of your question. For business inquiries, also your company or organization name, your role and your business contact details.
- Guide applications and interviews: your name, contact details, area of residence, age range, languages and language level, guiding experience, availability, current occupation and other information you give us in the application form or in an interview. This includes applications and partner survey answers sent through the forms on our earlier website.
- Messages: if you contact us by email, WhatsApp or a social media direct message, we receive your message and the contact details or account name that the service shows us.
- Photos and videos taken during a tour in which you appear (see Section 5).

#### Payment information

If you pay an invoice through Stripe, you enter your card or payment details on Stripe's systems, and we do not receive or store your full card number. We receive the information we need to confirm and record your payment, such as the amount, date, payment status and limited card details (for example, the card brand and last four digits).

#### Information collected automatically

When you visit this website, the servers of our hosting provider (Vercel) process technical information that your browser sends, such as your IP address, browser type, device information, the pages requested and the date and time of access. This is used to deliver the website, keep it secure and prevent abuse. Our booking form also uses your IP address for a short time to limit repeated submissions.

If you agree, this website also uses Google Analytics, which uses cookies to collect information about how you use the website. We do not use it unless you accept analytics cookies, and we do not use advertising cookies. See Section 9.

### 4. How We Collect Information

We collect personal information:

- directly from you, when you fill in a form on this website, email us, message us on WhatsApp or social media, call us, or talk to us during a tour;
- through the external forms we link to, such as the Google Forms used for guide and partner applications;
- from the guides who deliver your tour, for example if something happens on the day that we need to follow up on;
- from travel companies or other business partners who make a request on your behalf, where this applies; and
- automatically, when you use this website (see Sections 3 and 9).

### 5. How We Use Personal Information

We use personal information for the following purposes:

- to reply to your inquiries and booking requests, check availability and prepare quotes;
- to prepare, confirm and deliver your tour, including choosing a guide and contacting you before, during and after your tour;
- to issue invoices, process payments, cancellations and refunds, and keep accounting records;
- to provide customer support, handle feedback, complaints and incidents, and keep tours safe;
- to review guide applications, arrange interviews and manage our work with guides;
- to reply to business inquiries and manage our relationships with business partners;
- to run, maintain and secure this website, and to prevent fraud, spam and abuse;
- to understand how visitors find and use this website, through Google Analytics, if you accept analytics cookies (see Section 9);
- to improve our services, using information that does not identify you wherever possible;
- to send marketing messages, only if you have agreed to receive them (see below); and
- to comply with laws and regulations, respond to requests from public authorities, and establish or defend legal claims.

We do not use personal information beyond these purposes without your consent, except where the law allows it.

#### Service messages and marketing

Messages that are needed for your inquiry or booking are service messages: for example replies, quotes, invoices, booking confirmations, changes to your schedule and safety information. We send them whatever your marketing choices are.

We do not currently send newsletters or other marketing messages. If we start, we will send them only to people who have opted in, and you will be able to unsubscribe at any time with the link in the message or by contacting us. Unsubscribing does not stop service messages.

#### Photos and videos

Our guides may take photos or videos during a tour, for example as a souvenir for you. We do not use images in which you can be identified on our website, on social media or in advertising unless you have given us permission for that use, and we keep a record of that permission. For children, we ask a parent or guardian. Saying no does not affect your tour.

You can withdraw your permission at any time. We will then stop using the images in new material and remove them from our own website and social media accounts where we reasonably can. We may not be able to withdraw material that has already been printed or shared by others.

### 6. Sharing and Disclosure

We do not sell personal information. We do not give personal information to third parties except in the cases below or where the law otherwise allows it.

- Guides who deliver your tour: guides deliver tours on our behalf. We share only what a guide needs for your tour, usually your name, the date, time and meeting point, the number of people, your areas and interests, and the language. We share your phone number or messaging contact with the guide only when it is needed to reach you on the day. Because guides handle this information on our behalf, we supervise how they handle it, as the APPI requires.
- Service providers who work for us (see Section 7).
- Business transfers: if our business is merged, acquired or transferred, personal information may pass to the new owner, who must continue to protect it as described in this policy.
- Legal requirements and protection: where the law requires it; where it is necessary to protect someone's life, body or property and it is difficult to get your consent; or in response to lawful requests from courts, the police or other public authorities.
- With your consent: in any other case.

We do not share personal information with other companies for joint use.

### 7. Third-Party Service Providers

We use service providers to run our business. Where they handle personal information on our behalf, they may use it only to provide their services to us, and we supervise them as the APPI requires. The table describes the services and the information involved.

| Provider | What they do for us | Information involved |
|---|---|---|
| Vercel | Hosting this website and processing form submissions | Technical information about your visit and the details you send through our forms |
| Neon | Database that stores booking requests and inquiries, and their handling history | The details you enter in the booking request and inquiry forms |
| Resend | Sending an email notice to our staff when a booking request or inquiry arrives | The details of your request, including your name and email address |
| Microsoft (Microsoft 365) | Our company mailbox (contact@connectripjapan.com): receiving and replying to email | Your email address and the content of your messages |
| Google (Google Forms) | Guide and partner application forms | The details you enter in those forms |
| Google (Google Analytics) | Measuring how visitors use this website, only if you accept analytics cookies (see Section 9) | Information about your visit and your device collected through cookies, such as the pages you view, how you arrived at the website and your approximate location |
| Stripe (when used for payment) | Invoices and payments | Your name, email address and payment information |
| Neon (past application data) | Storing guide applications and partner survey answers received through our earlier website | The details given in those forms |

Our Vercel application processing region and Neon database storage region are configured in Singapore. These settings do not describe every location where a provider or its subprocessors may process data.

If you contact us through WhatsApp, Instagram, Facebook or TikTok, those companies also handle your messages under their own privacy policies.

### 8. International Data Transfers

Some of our service providers are located outside Japan or handle data outside Japan.

We provide personal data to a third party in a foreign country, including a service provider that handles it on our behalf, only as Article 28 of the APPI permits: either with your consent, given after we have informed you of the country, its personal information protection system and the measures the recipient takes to protect personal information; or to a recipient that has established a system meeting the standards set under the APPI. In the second case, we take the necessary measures to make sure that system continues to be applied, and we give you information about those measures if you ask.

Where a provider only stores data for us and does not handle the data itself, we still protect it, taking into account the personal information protection system of the country concerned (see Section 11).

### 9. Cookies and Analytics

Cookies are small text files that a website stores in your browser. Similar technologies include local storage and session storage.

#### Google Analytics

With your consent, this website uses Google Analytics 4, a web analytics service provided by Google LLC (United States). We use it to understand how visitors find and use this website, for example which pages are viewed, where visits come from (such as a search engine, social media or another website), the approximate country or region of visitors and the type of device, so that we can improve the website and our services. We look at this information in aggregate reports and do not use it to identify individual visitors.

If you accept analytics cookies, Google Analytics stores cookies in your browser (named "_ga" and "_ga_" followed by an identifier) that keep a random identifier for up to 2 years, and your browser sends Google information such as:

- the pages you visit, the page or website you came from, and the date, time and length of your visit;
- your interactions with the website, such as scrolling, clicks on links to other websites, and whether a booking request or inquiry was successfully sent (but not what you wrote in it);
- your browser, operating system, language, screen size and type of device; and
- your IP address, which Google uses to estimate your approximate location (such as your country, region and city). Google Analytics does not log or store IP addresses.

We do not send Google your name, email address, phone number, the content of your messages, or any other information you enter in our forms. We do not use Google Analytics advertising features, such as Google signals or remarketing, our Google Analytics account is not linked to Google Ads, and we do not allow this information to be used for personalized advertising.

Google handles this information on its systems, which may be located in the United States and other countries outside Japan (see Section 8). For how Google uses information from websites that use its services, see https://policies.google.com/technologies/partner-sites and Google's Privacy Policy at https://policies.google.com/privacy

We have set Google Analytics to delete the visit-level and user-level information linked to its cookies after 14 months. Reports that only show totals and do not identify individual visitors may be kept longer.

#### Your choice

Google Analytics is off until you choose. When you first visit, a banner asks whether you accept analytics cookies. Google Analytics is loaded only if you select "Accept Analytics". If you select "Reject Analytics" or make no choice, it is not loaded and no information is sent to Google through it. Closing the banner or continuing to browse is not treated as consent. Rejecting analytics cookies does not affect your use of this website.

You can change your choice or withdraw your consent at any time with the "Cookie Settings" link at the bottom of every page. If you withdraw it, Google Analytics stops collecting information from that point and we delete its cookies from your browser. Withdrawing consent does not affect information collected before you withdrew it.

We remember your choice in your browser's local storage for 12 months, after which we ask again. This record contains only your choice and the date, stays in your browser and is not sent to us or to Google.

You can also block or delete cookies in your browser settings, or use Google's browser add-on to opt out of Google Analytics: https://tools.google.com/dlpage/gaoptout

#### Other storage

We do not use advertising or social media tracking cookies, and we do not use advertising tags.

We use your browser's session storage for one functional purpose only: to remember, while your browser tab is open, that the opening animation on our home page has already been shown. This stays in your browser, is not sent to us, and is cleared when you close the tab.

If you have questions about cookies or Google Analytics, please contact us (see Section 14).

### 10. Data Retention

We keep personal information only for as long as we need it for the purposes in this policy.

Where a law requires us to keep certain records, such as accounting and tax records, we keep them for the period that law requires and use them only for that reason.

When we no longer need personal information, we delete it or make it anonymous without delay.

The IP address that our booking and inquiry forms use to limit repeated submissions is kept for about 10 minutes.

For how long Google Analytics information and your cookie choice are kept, see Section 9.

### 11. Data Security

We take steps to prevent the leakage, loss or damage of personal information and to manage it safely, including:

- Organization: we have appointed a Personal Information Management Officer (Soma Beppu, Director & Deputy Representative |⁠ EVP), who is responsible for how we handle personal information, and we limit access to personal information to the people who need it.
- Technical security: encrypted connections (HTTPS) on this website, a password-protected administration area with limits on repeated login attempts, and access controls on the services we use.
- Understanding the external environment: our service providers may handle or store data outside Japan. We take security measures based on an understanding of the personal information protection systems of those countries.

If a data breach is likely to harm your rights and interests, we will report it to the Personal Information Protection Commission of Japan and tell you, as the law requires.

### 12. Your Privacy Rights

Under the APPI, you can ask us to:

- disclose the personal information we hold about you, and records of when we gave it to third parties;
- correct, add to or delete information that is inaccurate;
- stop using or delete information that we handle against the law, that we no longer need, or whose handling may harm your rights or legitimate interests; and
- stop giving it to third parties.

#### How to make a request

Contact us at contact@connectripjapan.com. We will confirm your identity before we act, for example by asking for details that match our records. Someone you authorize can make a request for you with proof of that authority. For disclosure, you can ask us to provide the information electronically (for example, by email) or in writing. We will reply without undue delay and within the time the law requires.

As a rule, requests for disclosure, correction, suspension of use or deletion, and the other requests above are free of charge.

If the law allows or requires us to refuse a request, for example where it would seriously disrupt our business or break another law, we will tell you why.

### 13. Children's Privacy and Policy Updates

#### Children

Our services are booked by adults. Children may join tours with a parent or guardian, who gives us the information we need about them, such as the number of children. We do not knowingly collect personal information directly from children under 16 through this website. If you think a child has sent us personal information, please contact us and we will delete it.

#### Updates to this policy

We may update this policy when our services, the providers we use or the law change. We will post the new version on this page with a new "Last updated" date. If the changes are significant, we will tell you in advance with a notice on this website or, where appropriate, by email. Where the law requires your consent for a change, we will ask for it.

### 14. Contact Us

For questions, requests or complaints about how we handle personal information, please contact:

- **Company:** Connectrip Japan Co., Ltd.
- **Responsible Person:** Soma Beppu, Director & Deputy Representative |⁠ EVP
- **Privacy Contact:** contact@connectripjapan.com
- **Address:** 1-15-25 Nakajima, Nishiyodogawa-ku, Osaka, Japan

We can reply in English or Japanese.

If you are not satisfied with our reply, you can also contact the Personal Information Protection Commission of Japan: https://www.ppc.go.jp/en/


---

## 11. 変更後の全文（日本語参考訳）

## プライバシーポリシー（日本語参考訳）

> 公開されるのは英語版です。この日本語訳は承認用の参考訳です。【変更】は今回の GA4 対応で追加・変更した箇所で、それ以外は現在の公開文（`main`）の訳です。

最終更新日：2026-11-19（※公開日に更新が必要）

### 1. はじめに・個人情報取扱事業者

Connectrip Japan 株式会社（「Connectrip Japan」「当社」）は、お客様のプライバシーを尊重します。本プライバシーポリシーは、お客様が当社ウェブサイトを訪問する、当社に問い合わせる、当社サービスを依頼・予約する、または当社での業務に応募する際に、当社が個人情報をどのように取得・利用・共有・保護するかを説明するものです。

当社は、個人情報の保護に関する法律（個人情報保護法）その他の日本の関係法令に従って個人情報を取り扱います。

Connectrip Japan 株式会社は、お客様の個人情報について責任を負う事業者（「データ管理者」）です。

- **会社名：** Connectrip Japan 株式会社
- **所在地：** 大阪市西淀川区中島1丁目15番25号
- **代表者：** 代表取締役（Representative Director & CEO） Riku Oizumi（日本語表記はデータ未登録のためローマ字のまま）
- **個人情報管理責任者：** 取締役副代表（Director & Deputy Representative | EVP） 別府壮真
- **プライバシー窓口：** contact@connectripjapan.com

### 2. 本ポリシーの適用範囲

本ポリシーは、次に関連して当社が取り扱う個人情報に適用されます。

- プライベートガイドサービス（ご要望に合わせて計画する貸切ツアー）
- 定型ガイドツアー（行程と料金が決まっているツアー）
- 旅行者からの一般的なお問い合わせ
- 企業・団体からのビジネス・提携に関するお問い合わせ
- ガイドの応募・面接
- 本ウェブサイトの運営・安全確保・改善

本ポリシーは、SNS や当社がリンクする外部フォーム（Google フォームなど）を含め、他者が運営するウェブサイト・アプリ・サービスには適用されません。それらのサービスにはそれぞれのプライバシーポリシーがあります。ただし、それらを通じて当社が受け取る個人情報には本ポリシーが適用されます。

### 3. 取得する情報

#### お客様からご提供いただく情報

- 予約リクエスト（プライベートガイド・定型ツアー）：氏名、メールアドレス、電話番号（任意）、居住国・地域（任意）、希望日・代替日と開始時刻、ツアー時間、大人・子どもの人数（定型ツアーの場合は参加人数と希望ガイド言語）、選択したエリア・興味、メッセージに記入された内容。
- 健康等に関する情報：当社は本ウェブサイトで、健康状態・病歴・障害に関する情報をお尋ねしておらず、フォームもその取得を想定していません。リクエストに含めないでください。ツアーを安全に実施するために必要な場合は、理由をご説明し、受け取る前に明示的な同意をお願いします。求めていないのに送られてきた場合は、その同意がない限り利用せず、同意がなければ削除します。
- お問い合わせ：氏名、メールアドレス、お問い合わせ内容。ビジネスのお問い合わせでは、会社・団体名、役職、業務上の連絡先も含みます。
- ガイドの応募・面接：氏名、連絡先、居住地域、年齢層、言語とその水準、ガイド経験、稼働可能な日時、現在の職業、その他応募フォームや面接でご提供いただく情報。以前のウェブサイトのフォームから送られた応募・パートナーアンケートの回答を含みます。
- メッセージ：メール、WhatsApp、SNS のダイレクトメッセージで連絡いただいた場合は、メッセージと、そのサービスが表示する連絡先またはアカウント名を受け取ります。
- お客様が写っているツアー中の写真・動画（第5章参照）。

#### お支払い情報

Stripe で請求書をお支払いいただく場合、カード等の情報は Stripe のシステムに入力され、当社はカード番号の全桁を受け取らず、保存もしません。当社が受け取るのは、金額、日付、支払い状況、限られたカード情報（カードブランドと下4桁など）といった、支払いの確認・記録に必要な情報です。

#### 自動的に取得される情報

本ウェブサイトを訪問すると、当社のホスティング事業者（Vercel）のサーバーが、IP アドレス、ブラウザの種類、端末情報、リクエストされたページ、アクセス日時など、ブラウザが送信する技術的情報を処理します。これはウェブサイトの提供、安全確保、不正利用の防止に使われます。予約フォームでは、連続送信を制限するために IP アドレスを短時間利用します。

【変更】お客様が同意した場合、本ウェブサイトは Google アナリティクスも利用します。Google アナリティクスは Cookie を使って、お客様のウェブサイトの利用状況に関する情報を収集します。分析用 Cookie を承諾いただかない限り利用せず、広告用 Cookie は使用しません。第9章をご覧ください。

（変更前：本ウェブサイトは現在、分析や広告のための Cookie を使用していません。第9章をご覧ください。）

### 4. 情報の取得方法

当社は次の方法で個人情報を取得します。

- お客様から直接：本ウェブサイトのフォームへの入力、メール、WhatsApp や SNS でのメッセージ、電話、ツアー中の会話
- 当社がリンクする外部フォーム（ガイド・パートナー応募用の Google フォームなど）を通じて
- ツアーを担当するガイドから（当日に対応が必要なことが起きた場合など）
- 該当する場合、お客様に代わって依頼する旅行会社その他の取引先から
- 【変更】本ウェブサイトの利用時に自動的に（第3章および第9章参照）

### 5. 個人情報の利用目的

当社は次の目的で個人情報を利用します。

- お問い合わせ・予約リクエストへの回答、空き状況の確認、見積りの作成
- ツアーの準備・確定・実施（ガイドの選定、ツアー前・中・後のご連絡を含む）
- 請求書の発行、支払い・キャンセル・返金の処理、会計記録の保管
- カスタマーサポート、ご意見・苦情・事故への対応、ツアーの安全確保
- ガイド応募の審査、面接の手配、ガイドとの業務管理
- ビジネスのお問い合わせへの回答、取引先との関係管理
- 本ウェブサイトの運営・保守・安全確保、不正・スパム・濫用の防止
- 【追加】分析用 Cookie を承諾いただいた場合に、Google アナリティクスを通じて、訪問者がどのように本ウェブサイトを見つけ、利用しているかを把握すること（第9章参照）
- サービスの改善（可能な限り個人を特定しない情報を利用）
- 受信に同意いただいた場合に限るマーケティングメッセージの送信（下記参照）
- 法令の遵守、公的機関からの要請への対応、法的請求の確立・防御

法令で認められる場合を除き、お客様の同意なくこれらの目的を超えて個人情報を利用しません。

#### サービスメッセージとマーケティング

お問い合わせやご予約に必要なメッセージ（回答、見積り、請求書、予約確定、日程変更、安全情報など）はサービスメッセージであり、マーケティングに関する選択にかかわらず送信します。

当社は現在、ニュースレターその他のマーケティングメッセージを送信していません。開始する場合は、受信を希望された方にのみ送信し、メッセージ内のリンクまたは当社への連絡でいつでも配信停止できます。配信停止してもサービスメッセージは止まりません。

#### 写真・動画

ガイドがツアー中に、お客様の記念などとして写真や動画を撮影することがあります。お客様が識別できる画像は、その利用について許可をいただかない限り、当社ウェブサイト・SNS・広告に使用せず、許可の記録を保管します。お子様については保護者に確認します。お断りいただいてもツアーには影響しません。

許可はいつでも撤回できます。撤回された場合、新たな制作物での使用を止め、合理的に可能な範囲で当社のウェブサイト・SNS アカウントから削除します。すでに印刷された、または他者に共有された制作物は回収できない場合があります。

### 6. 共有と開示

当社は個人情報を販売しません。次の場合または法令で認められる場合を除き、第三者に個人情報を提供しません。

- ツアーを担当するガイド：ガイドは当社に代わってツアーを実施します。ガイドに共有するのはツアーに必要な情報のみで、通常は氏名、日時と集合場所、人数、エリア・興味、言語です。電話番号やメッセージの連絡先は、当日の連絡に必要な場合にのみ共有します。ガイドは当社に代わってこれらの情報を取り扱うため、個人情報保護法に従い、その取扱いを監督します。
- 当社の業務を行うサービス事業者（第7章参照）
- 事業の承継：合併・買収・事業譲渡の場合、個人情報が新たな事業者に引き継がれることがあり、その事業者は本ポリシーに沿って保護を続けなければなりません。
- 法令上の要請と保護：法令に基づく場合、人の生命・身体・財産の保護に必要で同意を得ることが困難な場合、裁判所・警察その他の公的機関からの適法な要請に応じる場合。
- お客様の同意がある場合：その他の場合。

当社は、他社と個人情報を共同利用しません。

### 7. 委託先（第三者のサービス事業者）

当社は事業の運営にサービス事業者を利用しています。事業者が当社に代わって個人情報を取り扱う場合、当社へのサービス提供のためにのみ利用でき、当社は個人情報保護法に従い監督します。表はサービス内容と関係する情報を示します。

| 事業者 | 当社のために行うこと | 関係する情報 |
|---|---|---|
| Vercel | 本ウェブサイトのホスティングとフォーム送信の処理 | 訪問に関する技術的情報、フォームで送信された内容 |
| Neon | 予約リクエスト・お問い合わせとその対応履歴を保存するデータベース | 予約リクエスト・お問い合わせフォームに入力された内容 |
| Resend | 予約リクエスト・お問い合わせの到着をスタッフにメールで通知 | リクエストの内容（氏名・メールアドレスを含む） |
| Microsoft（Microsoft 365） | 当社メールボックス（contact@connectripjapan.com）での受信と返信 | メールアドレスとメッセージの内容 |
| Google（Google フォーム） | ガイド・パートナーの応募フォーム | それらのフォームに入力された内容 |
| 【追加】Google（Google アナリティクス） | 本ウェブサイトの利用状況の計測（分析用 Cookie を承諾いただいた場合のみ。第9章参照） | Cookie を通じて収集される訪問と端末に関する情報（閲覧ページ、ウェブサイトへの到達経路、おおよその所在地など） |
| Stripe（支払いに利用する場合） | 請求書と支払い | 氏名、メールアドレス、支払い情報 |
| Neon（過去の応募データ） | 以前のウェブサイトで受け付けたガイド応募・パートナーアンケート回答の保存 | それらのフォームでご提供いただいた内容 |

当社の Vercel のアプリケーション処理リージョンと Neon のデータベース保存リージョンはシンガポールに設定されています。これらの設定は、事業者またはその再委託先がデータを処理しうるすべての場所を示すものではありません。

WhatsApp、Instagram、Facebook、TikTok を通じて当社に連絡された場合、それらの企業も各社のプライバシーポリシーに基づいてメッセージを取り扱います。

### 8. 外国への個人データの移転

当社のサービス事業者の一部は日本国外にあり、または日本国外でデータを取り扱います。

当社は、外国にある第三者（当社に代わって取り扱うサービス事業者を含む）への個人データの提供を、個人情報保護法第28条が認める場合に限って行います。すなわち、移転先の国名、その国の個人情報保護制度、移転先が講じる個人情報保護の措置についてお知らせしたうえでお客様の同意を得る場合、または同法の基準に適合する体制を整備した移転先に提供する場合です。後者の場合、その体制が継続的に実施されるよう必要な措置を講じ、ご請求があればその措置に関する情報を提供します。

事業者がデータを保存するだけで、データ自体を取り扱わない場合でも、当社は該当国の個人情報保護制度を踏まえて保護します（第11章参照）。

### 9. Cookie と解析【この章は全面改訂】

Cookie とは、ウェブサイトがブラウザに保存する小さなテキストファイルです。類似の技術としてローカルストレージやセッションストレージがあります。

#### Google アナリティクス

お客様の同意がある場合、本ウェブサイトは Google LLC（米国）が提供するウェブ解析サービス Google アナリティクス 4 を利用します。訪問者がどのように本ウェブサイトを見つけ、利用しているか（例えば、どのページが閲覧されているか、訪問がどこから来ているか（検索エンジン、SNS、他のウェブサイトなど）、訪問者のおおよその国・地域、端末の種類）を把握し、ウェブサイトとサービスを改善するために利用します。当社はこれらの情報を集計レポートとして確認し、個々の訪問者の特定には使用しません。

分析用 Cookie を承諾いただくと、Google アナリティクスはお客様のブラウザに Cookie（「_ga」および「_ga_」に識別子が続く名前）を保存し、ランダムな識別子を最長2年間保持します。また、お客様のブラウザは次のような情報を Google に送信します。

- 閲覧したページ、遷移元のページまたはウェブサイト、訪問の日時と滞在時間
- ウェブサイトでの操作（スクロール、他のウェブサイトへのリンクのクリック、予約リクエストやお問い合わせが正常に送信されたかどうか（記入内容は含みません）など）
- ブラウザ、OS、言語、画面サイズ、端末の種類
- IP アドレス（Google がおおよその所在地（国・地域・都市など）の推定に使用します。Google アナリティクスは IP アドレスを記録・保存しません）

当社は、氏名、メールアドレス、電話番号、メッセージの内容その他フォームに入力された情報を Google に送信しません。Google シグナルやリマーケティングなどの Google アナリティクスの広告機能は使用せず、当社の Google アナリティクスのアカウントは Google 広告とリンクしておらず、これらの情報をパーソナライズド広告に使用させません。

Google は、米国その他日本国外にある可能性のある同社のシステムでこれらの情報を取り扱います（第8章参照）。Google がそのサービスを利用するウェブサイトからの情報をどのように使用するかは https://policies.google.com/technologies/partner-sites を、Google のプライバシーポリシーは https://policies.google.com/privacy をご覧ください。

当社は Google アナリティクスにおいて、Cookie に紐づく訪問単位・ユーザー単位の情報を14か月後に削除するよう設定しています。個々の訪問者を特定しない合計値のみのレポートは、それより長く保持される場合があります。

#### お客様の選択

Google アナリティクスは、お客様が選択するまでオフです。初回訪問時にバナーで分析用 Cookie を承諾するかどうかをお尋ねします。Google アナリティクスは「Accept Analytics（承諾）」を選択した場合にのみ読み込まれます。「Reject Analytics（拒否）」を選択した場合や選択しない場合は読み込まれず、Google アナリティクスを通じて Google に情報が送信されることはありません。バナーを閉じることや閲覧を続けることは同意として扱いません。分析用 Cookie を拒否しても、本ウェブサイトの利用に影響はありません。

各ページ下部の「Cookie Settings」から、いつでも選択を変更し、同意を撤回できます。撤回すると、その時点から Google アナリティクスは情報の収集を停止し、当社はその Cookie をお客様のブラウザから削除します。撤回前に収集された情報には影響しません。

お客様の選択は、ブラウザのローカルストレージに12か月間記録し、その後改めてお尋ねします。この記録には選択内容と日付のみが含まれ、お客様のブラウザ内にとどまり、当社にも Google にも送信されません。

ブラウザの設定で Cookie をブロック・削除することや、Google アナリティクスをオプトアウトする Google のブラウザアドオン（https://tools.google.com/dlpage/gaoptout ）を利用することもできます。

#### その他の保存技術

当社は広告用・SNS 追跡用の Cookie を使用せず、広告タグも使用しません。

当社は、ブラウザのセッションストレージを1つの機能目的にのみ使用します。ブラウザのタブが開いている間、ホームページのオープニング演出がすでに表示されたことを記憶するためです。この情報はブラウザ内にとどまり、当社に送信されず、タブを閉じると消去されます。

Cookie や Google アナリティクスについてのご質問は、当社までお問い合わせください（第14章参照）。

（変更前の第9章：Cookie の説明／「本ウェブサイトは現在、分析・広告・SNS 追跡用の Cookie を使用しておらず、Google アナリティクスや Google タグマネージャーなどのツールも読み込んでいません。広告タグも使用していません。」／セッションストレージの説明／「ブラウザの設定で Cookie をブロック・削除することもできます。」）

### 10. 保存期間

当社は、本ポリシーの目的に必要な期間に限り個人情報を保存します。

会計・税務記録など、法令で保存が義務付けられている記録は、その法令が定める期間保存し、その目的にのみ利用します。

個人情報が不要になった場合は、遅滞なく削除するか匿名化します。

予約・お問い合わせフォームが連続送信の制限に利用する IP アドレスは、約10分間保持します。

【追加】Google アナリティクスの情報と Cookie に関する選択の記録の保存期間は、第9章をご覧ください。

### 11. 安全管理措置

当社は、個人情報の漏えい・滅失・毀損を防止し、安全に管理するため、次の措置を講じています。

- 組織的措置：個人情報管理責任者（取締役副代表（Director & Deputy Representative | EVP） 別府壮真）を置き、個人情報の取扱いに責任を負わせるとともに、個人情報へのアクセスを必要な者に限定しています。
- 技術的措置：本ウェブサイトでの暗号化通信（HTTPS）、ログイン試行回数を制限したパスワード保護の管理画面、利用するサービスでのアクセス制御。
- 外的環境の把握：当社のサービス事業者は日本国外でデータを取り扱い・保存する場合があります。当社はそれらの国の個人情報保護制度を把握したうえで安全管理措置を講じます。

お客様の権利利益を害するおそれのある漏えい等が発生した場合は、法令に従い個人情報保護委員会に報告し、お客様にお知らせします。

### 12. お客様の権利

個人情報保護法に基づき、お客様は当社に次のことを請求できます。

- 当社が保有するお客様の個人情報の開示、および第三者に提供した記録の開示
- 内容が事実でない情報の訂正・追加・削除
- 違法に取り扱われている情報、不要となった情報、または取扱いによりお客様の権利・正当な利益が害されるおそれのある情報の利用停止・消去
- 第三者への提供の停止

#### 請求の方法

contact@connectripjapan.com までご連絡ください。対応の前に、当社の記録と照合できる情報をお尋ねするなどして本人確認を行います。お客様が委任した代理人は、その権限を証明して請求できます。開示については、電子的方法（メールなど）または書面での提供を選べます。不当に遅滞することなく、法令の定める期間内に回答します。

開示・訂正・利用停止・消去その他上記の請求は、原則として無料です。

業務に著しい支障がある場合や他の法令に違反する場合など、法令により請求をお断りできる、またはお断りしなければならない場合は、その理由をお知らせします。

### 13. 子どものプライバシーと本ポリシーの改定

#### 子ども

当社のサービスは成人が予約します。お子様は保護者とともにツアーに参加でき、子どもの人数など必要な情報は保護者からご提供いただきます。当社は本ウェブサイトを通じて16歳未満の子どもから直接個人情報を取得することを意図していません。子どもが個人情報を送信したと思われる場合はご連絡ください。削除します。

#### 本ポリシーの改定

当社は、サービス、利用する事業者または法令の変更に応じて本ポリシーを改定することがあります。新しい版は「最終更新日」を更新してこのページに掲載します。重要な変更の場合は、本ウェブサイト上の告知または適切な場合はメールで事前にお知らせします。変更に法令上お客様の同意が必要な場合は、同意をお願いします。

### 14. お問い合わせ

個人情報の取扱いに関するご質問・ご請求・苦情は、次までご連絡ください。

- **会社名：** Connectrip Japan 株式会社
- **責任者：** 取締役副代表（Director & Deputy Representative | EVP） 別府壮真
- **プライバシー窓口：** contact@connectripjapan.com
- **所在地：** 大阪市西淀川区中島1丁目15番25号

英語または日本語で回答できます。

当社の回答にご納得いただけない場合は、個人情報保護委員会にもご相談いただけます：https://www.ppc.go.jp/en/
