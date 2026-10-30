# Interview Booking System — 技術仕様

ガイド応募者の面談予約システムの **技術仕様の正本**。

- 事業・運用の正本（Why / What / Operation）：Obsidian `04_TRAVEL/Guide Community/Interview Booking System.md`
- この文書（How / Technical Specification）：実装・DB・API・Calendar 連携・セキュリティ・テスト
- 役割分担の決定：Workspace `~/Connectrip/docs/os/decisions/ADR-0008-interview-booking-docs.md`

| 項目 | 値 |
|---|---|
| 状態 | 結合試験完了・本番前（開発用 DB と実 Google Calendar で予約フロー全体を確認。§12-1） |
| 最終更新 | 2026-10-30 |
| 分岐元 | `feature/guide-community`（`8ce631b`） |
| 実装 | worktree `~/Projects/connectrip-japan-guide-interviews`（branch `feature/guide-interviews`）。HEAD `13eb26c` ＋ 未 commit の修正（§13-5） |

記法：**確定** = 人間が決定した仕様。**ドラフト** = 先行ドラフト実装にあり、人間の決定ではないもの。**Unknown / 要確認** = 未決定。

---

## 1. 目的

ガイド応募者が、面接官（壮真）の Google Calendar のプライベート情報を見ることなく面談可能な時間だけを確認し、面談希望日時を申請できるようにする。応募者が選んだ時点では確定せず、Admin で人間が承認して初めて確定する。（確定）

## 2. 全体フロー（確定）

```text
Admin が応募者に予約リンクを発行            → INVITED
応募者が /interview/[token] で枠を選んで申請 → PENDING_APPROVAL（枠を仮押さえ）
壮真が Admin で確認・承認                   → APPROVING
  FreeBusy 再確認 → DB 競合再確認 → Calendar event 作成 → Google Meet 生成 → DB 保存
                                            → CONFIRMED
応募者へ確定メール（Meet URL を含む）
```

- 承認前に Google Meet を作らない。（確定）
- 却下は `REJECTED`。仮押さえは解放される。

## 3. 面談ルール（確定）

| 項目 | 値 |
|---|---|
| 曜日 | 月〜金 |
| 祝日 | 受付可能 |
| 受付時間 | 10:00〜21:00 |
| 面談時間 | 30 分 |
| 前バッファ | 15 分 |
| 後バッファ | 15 分 |
| 最終開始 | 20:15（面談＋後バッファが 21:00 までに終わる） |
| 1 日最大 | 5 件（`PENDING_APPROVAL` と `CONFIRMED` を数える） |
| 申請期限 | 開始 24 時間前まで |
| 表示期間 | 14 日（今日を含む JST の暦日） |
| token 有効期限 | 14 日 |
| Timezone | `Asia/Tokyo`（DST なし。固定 `+09:00` で計算してよい） |

- 面談を入れたくない日は、壮真が Google Calendar に予定を入れてブロックする。システムに休日設定は持たない。（確定）
- 枠の刻み：15 分（確定 2026-10-30。`SLOT_STEP_MINUTES`）
- 面談同士の間隔：**最低 15 分**（確定 2026-10-30）。隣接する面談では、前の面談の後バッファと次の面談の前バッファが同じ 15 分を共有する。例：10:00–10:30 面談A → 10:30–10:45 バッファ（共有） → 10:45–11:15 面談B。30 分空ける必要はない。
- ルールの値はコードの 1 か所に置き、枠の表示・申請・承認時の再確認がすべて同じ判定を使う（ドラフト：`src/features/guide-interviews/rules.ts`、`checkSlot()`）。

### 3-1. 枠の判定

開始時刻 `start` について、次をすべて満たすときに予約できる。

1. 15 分刻みで、秒・ミリ秒が 0
2. JST で月〜金
3. `start >= 10:00`、かつ `start + 30分 + 後バッファ15分 <= 21:00`
4. `start >= now + 24h`
5. 日付が表示期間（今日から 14 日）内
6. 同じ日の保持中の面談が 5 件未満
7. Calendar の busy 区間が `[start - 15分, start + 30分 + 15分)` と重ならない
8. 他の保持中の面談との間が 15 分以上（`[start, end + 15分)` 同士が重ならない。DB の EXCLUDE 制約と同じ規則）

「保持中」= `PENDING_APPROVAL`・`APPROVING`・`CONFIRMED`。`APPROVING` は承認処理中の `PENDING_APPROVAL` なので、件数・競合の判定に含める。

## 4. プライバシー（確定）

- Google Calendar の event title・description・location・attendees、その他の予定内容を応募者へ **絶対に** 表示しない。
- 原則 **FreeBusy のみ** を使う（busy の開始・終了時刻だけ）。
- 応募者向け API が返すのは `date` と `available slots` だけ。
- Calendar の内容を DB にもログにも保存しない。DB に保存するのは、こちらで作成した event の id と Meet URL だけ。
- 他の応募者が仮押さえした枠は、応募者には単に「空いていない」として見せる（理由を区別しない）。
- AVAILABLE は DB に保存せず、リクエストのたびに計算する。

## 5. 予約状態（確定）

| status | 意味 | 枠を保持 |
|---|---|---|
| `INVITED` | 予約リンク発行済み、日時未選択 | – |
| `PENDING_APPROVAL` | 申請済み、承認待ち（仮押さえ） | ○ |
| `APPROVING` | 承認処理中（Calendar event 作成中） | ○ |
| `CONFIRMED` | 確定 | ○ |
| `REJECTED` | 却下 | – |
| `CANCELLED` | 取消 | – |
| `COMPLETED` | 実施済み | – |

遷移（ドラフト。太字以外は §11 で要確認）：

```text
INVITED → PENDING_APPROVAL → APPROVING → CONFIRMED → COMPLETED
                           ↘ REJECTED   ↘ (失敗時) PENDING_APPROVAL
INVITED / PENDING_APPROVAL / CONFIRMED → CANCELLED
```

## 6. DB

**確定**：`guide_interviews` を追加し、既存の `guide_applications` と紐付ける。token の平文は保存せず `booking_token_hash` に SHA-256 で保存する。ダブルブッキングの防止は DB レベルでも強制する。

**ドラフト**（`sql/guide-interviews.sql`、未適用）：

- 追加型のみ（`CREATE EXTENSION IF NOT EXISTS btree_gist`、`CREATE TABLE IF NOT EXISTS`）。既存テーブルは変更しない。
- 主な列：`id`、`guide_application_id`（FK）、`interviewer`（既定 `'soma'`）、`status`（CHECK）、`status_reason`、`booking_token_hash`（UNIQUE）、`token_expires_at`、`requested_start_at`、`requested_end_at`、`hold_end_at`、`requested_at`、`google_event_id`、`meet_url`、`invitation_email_sent_at`、`confirmation_email_sent_at`、`approved_at`、`rejected_at`、`cancelled_at`、`created_at`、`updated_at`
- DB が強制する規則：
  - 申請時刻は常に 30 分。`hold_end_at = requested_end_at + 15分`（CHECK）
  - `INVITED`・`CANCELLED` 以外は時刻が必須（CHECK）
  - `meet_url` は `CONFIRMED`・`COMPLETED`・`CANCELLED` だけが持てる（CHECK）
  - **重複防止**：保持中の行について、同じ `interviewer` の `tstzrange(requested_start_at, hold_end_at)` が重ならない（EXCLUDE USING gist）
  - 1 応募につき未終了の面談は 1 件（partial UNIQUE index）
- 1 日 5 件の上限は、advisory lock をかけたトランザクション内で数えて強制する（DB の制約ではない）。

適用手順：開発用 DB で先に確認し、**本番への適用は人間が行う**（`node scripts/init-db.mjs sql/guide-interviews.sql`）。Preview / Development が本番 DB を向いている問題が未解決のため、Preview 上では書き込み操作をしない（Workspace `docs/os/open-issues.md`）。

## 7. Google Calendar 連携

**確定**：面接官（壮真）本人の Google アカウントを OAuth 2.0 で接続する。予定の内容を読むための不要な権限は取得しない。応募者を attendee に追加しない。Google Calendar から招待メールを送らない。

**ドラフト**（`src/lib/google-calendar.ts`）：

| 項目 | 内容 |
|---|---|
| scope | `calendar.freebusy`（busy 時刻のみ）、`calendar.events.owned`（自分で作った event の作成・削除） |
| token | refresh token から access token を取得してメモリにキャッシュ。`invalid_grant` などは `CalendarAuthError`（再接続が必要） |
| FreeBusy | `POST /freeBusy`。表示期間全体を 1 回で問い合わせる |
| event 作成 | `conferenceDataVersion=1&sendUpdates=none`、`visibility: private`、attendees なし。event id を先に生成して DB に保存し、再試行しても重複しない（409 なら既存を再利用） |
| Meet | `hangoutsMeet` の createRequest。作成完了を最大 5 回ポーリング。失敗時は `MeetCreationError` → event を削除して承認を失敗にする |
| 削除 | `sendUpdates=none`。404 / 410 は削除済みとみなす |
| タイムアウト | 1 リクエスト 8 秒 |
| refresh token の取得 | `scripts/google-calendar-auth.mjs`（一度きりの取得スクリプト。§13-2） |

**OAuth の公開状態（確定方針）**：本番運用では refresh token が継続して使える必要がある。Google Cloud の OAuth 同意画面が「テスト」のままだと refresh token は 7 日で失効するため、**本番運用前に適切な公開状態へ変更する**。Google Cloud の実設定は人間が行い、まだ実施しない。

## 8. API・画面

### 8-1. 応募者（確定：URL は `/interview/[token]` または同等）

既存の `src/app/guide-community` に合わせ、ロケールの外の `src/app/interview/[token]` に置く（提案）。

| 操作 | 入力 | 返すもの |
|---|---|---|
| 空き枠の取得 | token | `[{ date: "YYYY-MM-DD", slots: ["HH:mm", …] }]` のみ |
| 申請 | token、`date`、`time` | 受付結果。再検証して `PENDING_APPROVAL` |

- token は推測困難な十分に長いランダム値（例：32 バイト以上の CSPRNG を base64url で表す）。URL に入れるのは平文で、DB には SHA-256 だけを保存する。（確定）
- token の形式が不正なものは DB に問い合わせずに弾く。
- 無効なリンクと期限切れのリンクは別のメッセージで表示してよい（確定 2026-10-30）。内部情報を推測できない表現にし、応募者の有無や DB の状態は表示しない。文言：
  - Invalid：`This interview booking link is invalid.`
  - Expired：`This interview booking link has expired. Please contact Connectrip Japan for a new link.`
- 応募者向けの画面・メールは英語のみ（確定 2026-10-30）。多言語化は将来の Phase。
- 申請時は §3-1 を再判定し、DB のトランザクション（advisory lock ＋ EXCLUDE 制約）で確定させる。
- 公開エンドポイントには既存の `src/lib/rate-limit.ts` を適用する。

### 8-2. Admin（確定）

既存の `/admin/(protected)/guide-applications/[id]` に面談管理 UI を追加する。最低限、次を扱う。

- 面談ステータス、希望日時、申請日時、Meet URL
- 承認、却下、確定メールの再送

認証は既存の Admin 認証（`src/lib/admin-auth.ts`、共有 `ADMIN_PASSWORD`）を使う。

### 8-3. 承認処理（確定）

1. Google Calendar FreeBusy を再確認
2. DB の競合を再確認
3. Google Calendar event を作成
4. Google Meet を生成
5. DB へ保存
6. `CONFIRMED` へ更新
7. 応募者へ確定メール

実装方針（ドラフト）：`PENDING_APPROVAL → APPROVING` を条件付き UPDATE で取り、二重承認を防ぐ。Calendar 側が失敗したら作った event を削除して `PENDING_APPROVAL` に戻す。FreeBusy の判定では、自分が作成中の event を busy から除く必要がある（再試行時）。

## 9. メール（確定）

- 既存の `src/lib/mailer.ts`（nodemailer / SMTP）を使う。
- Google Meet URL は承認後の確定メールでだけ応募者へ送る。
- SMTP の送信に失敗しても `CONFIRMED` は取り消さない。`confirmation_email_sent_at = null` のままにし、Admin に再送ボタンを表示する。
- 予約リンクの案内メール（`invitation_email_sent_at`）の要否・文面：Unknown / 要確認（§11）。
- 応募者宛てのメールは英語のみ（確定 2026-10-30）。
- **申請の通知**（確定 2026-10-30）：応募者が申請したら `CONTACT_TO_EMAIL` 宛てに通知する。通知の失敗で申請を失敗扱いにしない（DB への保存が先で、通知は後）。通知の失敗はログか Admin 上で確認できるようにする。

## 9-1. 応募進捗の自動同期（確定 2026-10-30）

`guide_applications.pipeline_status` を自動で進める（手動更新ではなく自動同期を基本とする）。

| 面談の状態 | pipeline |
|---|---|
| `CONFIRMED` | 面談予定 |
| `COMPLETED` | 面談済み |

## 9-2. 別の時間を依頼（確定 2026-10-30）

Admin の操作で、現在の申請を削除せず `PENDING_APPROVAL → CANCELLED` にして履歴に残す。そのうえで新しい予約 token を発行し、新しいリンクを応募者へ送る。旧 token は再利用できない状態にする。

## 10. 環境変数（名前のみ）

| 変数 | 用途 | 状態 |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth client | 新規 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth client | 新規 |
| `GOOGLE_CALENDAR_REFRESH_TOKEN` | 壮真のアカウントの refresh token | 新規 |
| `GOOGLE_CALENDAR_ID` | 対象カレンダー（未設定なら `primary`） | 新規 |
| `INTERVIEW_PUBLIC_BASE_URL` | 予約リンクの URL を組み立てる基準 | 新規 |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | メール送信 | 既存 |
| `POSTGRES_URL` | DB | 既存 |
| `ADMIN_PASSWORD` | Admin 認証 | 既存 |

値はどこにも書かない。Netlify / Vercel への設定は人間が行う。

### 10-1. `INTERVIEW_PUBLIC_BASE_URL`（確定 2026-10-30）

- 招待メールの予約リンク（`<base>/interview/<token>`）と、Admin への申請通知メールの管理画面リンクを組み立てる基準 URL。末尾の `/` は取り除かれる（`src/lib/interviews.ts` の `publicBaseUrl()`）。
- **Production では、実際の公開 URL（`https://` で始まる本番サイトの origin）を環境変数として設定する前提とする。** コードには既定値を持たせない。
- **Production で `localhost`・`127.0.0.1`・Preview の URL を使わない。** これらが入っていると、応募者に届くリンクが開けない。
- 未設定の場合はリクエストの origin（Server Action では `x-forwarded-host` / `host` ヘッダー）を使う。Production ではこの代替に頼らず、必ず設定する。
- 本番の公開 URL の値：Unknown / 要確認（人間が決めて Netlify に設定する。公式 HP `connectripjapan.com` は現在 Framer で、Site Not Found の未解決事項がある）。
- ローカル開発の `.env.local` では localhost の値になっている（2026-10-30 の結合試験で、port 3100 で起動しても予約リンクが `localhost:3000` になったことで確認）。ローカルで別の port を使うときはリンクの port が実際と合わないことがあるが、Production には影響しない。
- 本番 Deploy 前の確認（人間）：Netlify の環境変数に設定されていること、値が `https://` の本番 origin で `localhost` を含まないこと。Admin で予約リンクを発行し、表示されたリンクのホストが本番であることを確認する。

## 11. 未解決事項（Unknown / 要確認）

1. ~~面談同士の間隔~~ → 解決（2026-10-30）：最低 15 分。バッファは共有する（§3）
2. ~~枠の刻み~~ → 解決（2026-10-30）：15 分（§3）
3. 予約リンクの発行方法。ドラフトは「Admin のボタンで発行し、自動メールを送り、リンクを Admin に表示してコピーもできる」
4. 却下時に応募者へメールを送るか。ドラフトは「Admin が送るかどうかを選べる」
5. 応募者による取消・日時変更を許すか。Admin の「別の時間を依頼」は採用済み（§9-2）
6. `COMPLETED` へ変える担当と時期
7. ~~`pipeline_status` との自動同期~~ → 解決（2026-10-30）：自動同期する（§9-1）
8. token の期限切れ後に状態を確認できるか。ドラフトは、申請済み・確定済みなら期限後も状態を表示する（Meet URL は出さない）
9. ~~応募者向けの言語~~ → 解決（2026-10-30）：英語のみ（§8-1、§9）
10. Google Cloud の OAuth アプリの所有者。公開状態は §7 の方針どおり、本番前に変更する
11. ~~開発用 DB の準備~~ → 解決（2026-10-30）：Neon branch `guide-interviews-dev`（endpoint `ep-lively-dust-aob9gecd`）に migration を適用し、結合試験に使用。Workspace の R0（Preview / Development が本番 DB を向いている問題）は別途未解決
13. 本番の `INTERVIEW_PUBLIC_BASE_URL` の値（§10-1）
12. ~~申請時の Admin への通知~~ → 解決（2026-10-30）：送る。失敗しても申請は成立（§9）

## 12. テスト項目

- 枠の計算（純粋関数）：曜日、祝日、10:00 / 20:15 / 20:30 の境界、24 時間前、14 日目と 15 日目、5 件目と 6 件目、busy と前後バッファ、面談同士の間隔、`2026-02-30` などの不正日付
- token：長さ・ランダム性、ハッシュのみ保存、期限切れ、不一致、状態不正の応答が同じであること
- 同時実行：同じ枠への 2 件の同時申請で 1 件だけ成功する。6 件目の同時申請が拒否される
- 承認：FreeBusy 再確認で埋まっていた場合、Meet 作成の失敗、二重承認、再試行で event が重複しないこと
- メール：送信失敗で `CONFIRMED` が残り、再送で `confirmation_email_sent_at` が入ること
- プライバシー：応募者向け API のレスポンスとログに Calendar の内容が含まれないこと
- 実行方法：ドラフトの `availability.test.ts` は `bun:test` を使う（`bun test`）。`package.json` にテストスクリプトはない。テスト用ファイルは `tsconfig.json` の exclude で型検査から外している

### 12-1. 結合試験の結果（2026-10-30）

環境：worktree の `next dev`（ローカル）＋ Neon `guide-interviews-dev` ＋ 壮真の実 Google Calendar。SMTP の変数を空にして起動し、メールは 1 通も送っていない（ログに「送信しない」と出ることを確認）。テスト応募者はすべて `@example.com`。ブラウザ確認は headless Chromium（PC 1280px / スマホ 390px）。試験用のスクリプトは repo に含めていない。

| 項目 | 結果 |
|---|---|
| FreeBusy：テスト予定（11/4 14:00–15:00）を作成 | 13:30〜15:00 の 7 枠だけが除外された（前後バッファ 15 分どおり。13:15 と 15:15 は残る） |
| FreeBusy：実カレンダーの予定 | 終日予定の日（11/2）は表示されず、11/6 9:00–12:00 の予定に重なる申請は拒否された |
| 予定に重なる時刻の申請 | `CALENDAR_BUSY`（応募者には `SLOT_UNAVAILABLE`） |
| 予約申請 → 承認 → Calendar event → Meet → `CONFIRMED` | 成功。event は private・attendees なし。DB の `meet_url` と event の `hangoutLink` が一致。pipeline は「面談予定」へ自動で移動 |
| Admin：予約リンク発行・承認・`CONFIRMED` 表示・Meet URL 表示 | 成功（PC / スマホ）。SMTP 未設定の案内とコピー欄が出る |
| 応募者画面：選択・申請済み・確定 | 成功（PC / スマホ、横スクロールなし）。確定後も画面に Meet URL は出ない |
| invalid / expired token | 「This link is not valid」/「This link has expired」を表示（§13-4 ④ の文言差は未対応のまま） |
| 同じ枠への同時申請 2 件 | 1 件 201、もう 1 件 409 `SLOT_UNAVAILABLE`。DB の `PENDING_APPROVAL` は 1 件だけ |
| 1 日 5 件（`PENDING_APPROVAL` 3 ＋ `CONFIRMED` 2） | その日が空き枠から消え、6 件目の申請は 409 `SLOT_UNAVAILABLE`、状態は `INVITED` のまま |
| Admin からの取消（`CONFIRMED`） | DB が `CANCELLED`、Calendar event は削除（Google が `cancelled` を返す）、FreeBusy でその枠が空く |
| レート制限 | 連続申請で 429 `RATE_LIMITED`（IP ごとに 10 回/分）。同じ IP から複数の応募者が同時に申請する場合は当たる可能性がある（低リスク） |
| 後片付け | テスト用の Calendar event と、開発用 DB のテスト応募・面談をすべて削除（両テーブル 0 件） |

見つかった問題と対応は §13-5。

## 13. 先行ドラフトとの関係

**決定（2026-10-30）**：worktree `~/Projects/connectrip-japan-guide-interviews`（branch `feature/guide-interviews`）のドラフトを実装の土台にする。確定仕様と矛盾する部分は確定仕様を優先して直す。


### 13-1. 調査時点

- 調査日時：2026-10-30 01:37 JST（読み取りのみ。worktree には書き込んでいない）
- branch `feature/guide-interviews`、HEAD `13eb26c`「wip: implement guide interview booking flow before integration testing」（2026-10-30 01:07:09、`8ce631b` の上に 1 commit、33 files、+3145 / −10）。commit message の記載：「実際の Neon DB と Google Calendar ではまだ試験していない」
- 未 commit：`scripts/check-interview-db.mjs`（untracked）のみ
- 最後のファイル更新は 01:07:57。5 分以上の変更停止を確認してから調査した（01:20 の時点で 12 分、調査時点で約 29 分変更なし）
- 単体テスト：`bun test src/features/guide-interviews` → **27 pass / 0 fail**（01:37 実行）

### 13-2. ファイル（commit `13eb26c` ＋ untracked 1）

| 区分 | ファイル | 内容 |
|---|---|---|
| DB | `sql/guide-interviews.sql` | §6。追加型のみ。EXCLUDE（`hold_end_at = end + 15分`）で面談同士の間隔 15 分を強制。未適用 |
| ルール | `src/features/guide-interviews/rules.ts` | §3 の値 |
| ルール | `src/features/guide-interviews/availability.ts` | `checkSlot()`（申請）、`checkApproval()`（承認時。過去・Calendar・他の面談だけを再確認し、24 時間ルールは見ない）、`availableSlots()`、`bookingWindow()`、`holdEnd()`、JST 変換 |
| ルール | `src/features/guide-interviews/token.ts` | 32 バイトの乱数を base64url（43 文字）に。形式チェック。SHA-256（hex） |
| ルール | `src/features/guide-interviews/types.ts` | 7 status、`HELD_STATUSES`、`OPEN_STATUSES`、行の型、Admin 用の日本語ラベル |
| 文言 | `src/features/guide-interviews/messages.ts` | 応募者向けのエラーコードと英語の文言。Calendar の予定・他の面談・1 日の上限は `SLOT_UNAVAILABLE` 1 つにまとめる（理由を区別させない） |
| 文言 | `src/features/guide-interviews/admin-messages.ts` | Admin 向けの失敗メッセージ（日本語） |
| 文言 | `src/features/guide-interviews/format.ts` | Admin 向けの日時表示（JST） |
| テスト | `src/features/guide-interviews/availability.test.ts` | `bun:test`。27 件 |
| DB 層 | `src/lib/data/guide-interviews.ts` | 下記 13-3 |
| 外部 | `src/lib/google-calendar.ts` | §7 |
| 外部 | `src/lib/interview-email.ts` | 応募者宛て（英語）：招待・確定・却下。Admin 宛て（日本語）：申請の通知。8 秒で打ち切り、例外を投げず `{ sent }` を返す |
| 外部 | `src/lib/mailer.ts`（変更） | `sendMail` に任意の `to`（未指定なら従来どおり `CONTACT_TO_EMAIL`）。`escapeHtml`・`isMailConfigured` を export。SMTP 未設定で `to` ありのときは本文をログに出さない。既存の呼び出し元の動作は不変 |
| フロー | `src/lib/interviews.ts` | 下記 13-3 |
| API | `src/app/api/interviews/availability/route.ts` | 応募者。`POST { token }`（token を query string に出さない）。IP ごとに 30 回/分 |
| API | `src/app/api/interviews/request/route.ts` | 応募者。`POST { token, date, time }` → 201。IP ごとに 10 回/分 |
| API | `src/app/api/interviews/approve/route.ts`、`reject/route.ts` | Admin（`isAdminAuthenticated`）。同じ処理を Server Action からも呼べる |
| API | `src/app/api/interviews/respond.ts` | 応答の共通処理。Calendar・DB の障害は応募者には `UNAVAILABLE`（503）とだけ返し、詳細はログに出す |
| 応募者画面 | `src/app/interview/layout.tsx` | 独立した root layout（英語）。`noindex`・`nofollow`、`referrer: no-referrer`（token つき URL を外部に送らない） |
| 応募者画面 | `src/app/interview/[token]/page.tsx` | 表示の振り分け |
| 応募者画面 | `src/components/interview/BookingFlow.tsx`、`BookingCalendar.tsx`、`TimeSlotPicker.tsx`、`InterviewStatus.tsx` | 日付と時刻の選択、申請、状態表示。Meet URL は表示しない |
| Admin | `src/app/admin/(protected)/guide-applications/[id]/InterviewPanel.tsx` | 面談パネル（下記 13-3） |
| Admin | `src/app/admin/(protected)/guide-applications/[id]/interview-actions.ts` | Server Action。各操作で Admin セッションを再確認 |
| Admin | `src/app/admin/(protected)/guide-applications/[id]/page.tsx`（変更） | 面談パネルを追加。サイドバーの sticky を外した |
| Admin | `src/app/admin/(protected)/guide-applications/page.tsx`（変更） | 一覧の上に「承認待ちの面談」を表示 |
| 設定 | `src/proxy.ts`（変更） | `interview` を i18n の matcher から除外 |
| 設定 | `src/app/robots.ts`（変更） | `/interview` を disallow |
| 設定 | `tsconfig.json`（変更） | `**/*.test.ts` を exclude |
| 手順 | `scripts/google-calendar-auth.mjs` | refresh token を取得する一度きりのスクリプト。PKCE と state を使い、localhost で受ける。scope は `calendar.freebusy`・`calendar.events.owned` だけ。コメントに Google Cloud の手順（同意画面を "In production" にする）を記載 |
| 手順 | `scripts/check-interview-db.mjs`（repo に含める。§13-5） | `preflight`：接続先の Neon endpoint id・DB 名・件数を表示（秘密は出さない）。`verify`：migration 後にテーブル・拡張・制約・index を確認。本番に migration を適用する前にも、接続先の確認に使う |

### 13-3. 実装されている処理

- **招待** `issueInvitation`：応募を `FOR UPDATE` でロックする。保持中の面談があれば拒否し、未使用の `INVITED` は `CANCELLED` にして新しい token を発行する。英語の招待メールを送る。リンクは Admin 画面にその場だけ表示する（コピー用。DB には平文がないので再表示できない）
- **応募者の表示**：`invalid` / `expired` / `closed`（取消・却下・完了済み）/ `unavailable`（障害）/ `choose` / `requested` / `confirmed`
- **空き枠**：表示期間の FreeBusy を 1 回取得し、保持中の面談と合わせて計算する
- **申請**：先に安い規則を確認し、その日の FreeBusy を取得する。トランザクション内で token の行を `FOR UPDATE` し、日ごとの advisory lock の下で再判定して `PENDING_APPROVAL` にする。EXCLUDE 違反は `SLOT_UNAVAILABLE` にする。**保存の後に** Admin へ通知する（通知は例外を投げず、失敗はログだけ）
- **承認**：条件付き UPDATE で `APPROVING` にし（120 秒以上止まったものは引き継いで前の event を削除）、FreeBusy と DB を再確認し、event と Meet を作成し、`CONFIRMED` と Meet URL を保存する。同じトランザクションで pipeline を「面談予定」にする。確定メールが送れたときだけ `confirmation_email_sent_at` を記録する。途中で失敗したら event を削除して `PENDING_APPROVAL` に戻す
- **Admin パネル**：状態、希望日時・面談日時、申請日時、Meet URL（開く・コピー）、確定メールの送信状態を表示する。操作は状態ごとに出し分ける：`PENDING_APPROVAL` は承認・却下（理由、通知するか）・別の時間を依頼。`APPROVING` は承認の再試行。`CONFIRMED` は確定メール再送・面談済みにする・取消。`INVITED` はリンクの再発行・取消。面談がなければ予約リンクの発行
- **別の時間を依頼**：`PENDING_APPROVAL → CANCELLED`（行は残る）→ 新しい token を発行して招待メールを送る。旧 token は `closed` 表示になり、申請に使えない
- **面談済み**：Admin の「面談済みにする」ボタン。終了時刻を過ぎた `CONFIRMED` だけを `COMPLETED` にし、pipeline を「面談済み」にする
- **取消**：確定済みなら Calendar の event も削除する。削除に失敗したら手動削除を促す。応募者への連絡は別途行うと表示する

### 13-4. 確定仕様との照合（2026-10-30 01:37 時点）

| 分類 | 項目 |
|---|---|
| 実装済み | 面談ルール全項目（15 分刻み、面談同士の間隔 15 分）／枠の計算と承認時の再確認／FreeBusy だけを使い、Calendar の内容を返さない・保存しない／7 status、AVAILABLE を保存しない／仮押さえと他の応募者への非表示／DB でのダブルブッキング防止と 1 日 5 件／token（256 bit、SHA-256 のみ保存、14 日）／承認の 7 手順と失敗時の巻き戻し／承認前に Meet を作らない／attendee なし、Google から招待しない／Meet URL は確定メールだけで送る（画面には出さない）／メール失敗でも `CONFIRMED` を維持し、再送ボタン／OAuth の最小 scope と refresh token の取得スクリプト／応募者 URL `/interview/[token]`／Admin の面談管理（ステータス・希望日時・申請日時・Meet URL・承認・却下・再送）／**① 進捗の自動同期**／**② 申請通知（失敗しても申請は成立、失敗はログ）**／**③ 英語のみ**／**⑤ 別の時間を依頼（履歴を残し、旧 token は使えない）**／公開 API のレート制限、検索除外、Referer 抑止 |
| 一部実装 | テスト（枠の計算 27 件だけ。DB・同時実行・Calendar・メール・画面のテストはない。`package.json` にテストスクリプトがない）／② の通知失敗はログだけで、Admin 画面では確認できない（「ログまたは Admin」の条件は満たす）／`.env.example` に新しい変数名がない（変数名の grep で確認） |
| 未実装 | ~~実 DB・実 Google Calendar での結合試験~~ → 完了（§12-1）／「別の時間を依頼」は取消と新規発行が 1 トランザクションではない（取消後に発行が失敗すると、応募者に有効なリンクがない状態になる。Admin がリンクを再発行すれば戻せる） |
| 仕様と不一致 | **④ 文言**：確定した例は `This interview booking link is invalid.` だが、ドラフトは API が `This booking link is not valid. Please check the link in your email.`、画面が見出し `This link is not valid` を使う（期限切れはほぼ一致）。また、確定仕様にない `closed` 状態（`This link is no longer active`）があり、「そのリンクが以前は有効だった」ことが分かる。内部状態を出さない方針に照らして、invalid と同じ表示にするか判断が必要／確定表示の `The Google Meet link has been sent to you by email.` は、確定メールの送信に失敗した場合は事実と異なる |
| 人間作業が必要 | 開発用 DB の準備と migration の適用（`check-interview-db.mjs preflight` で接続先が開発用だと確認してから。本番は人間）／Google Cloud：Calendar API の有効化、OAuth client（Desktop app）、同意画面を本番前に "In production" へ／壮真のアカウントで `google-calendar-auth.mjs` を実行して refresh token を取得／Netlify の環境変数（§10）／既存の SMTP 設定で応募者宛てに送れるか確認／§11 の 3〜6・8・10・11 の判断／`check-interview-db.mjs` を commit するか（untracked のまま） |

2026-10-30 の結合試験後の状態：開発用 DB の準備・migration・refresh token の取得は完了。`check-interview-db.mjs` は repo に含めることに決定。残る人間作業は、本番 migration、Netlify の環境変数（§10、特に §10-1）、OAuth 同意画面の公開状態、SMTP で応募者宛てに送れるかの確認、§11 の判断。

### 13-5. 結合試験後の修正（2026-10-30、未 commit）

| 問題 | 対応 | ファイル |
|---|---|---|
| Admin で承認した直後、Internal Management の進捗ドロップダウンが古い値（アンケート回答）のまま。DB は「面談予定」に変わっているため、そのまま「保存する」を押すと進捗が巻き戻る | `<select>` は `defaultValue`（非制御）で、再描画しても表示が変わらなかった。`key={app.pipeline_status}` を付け、進捗が変わったときだけ select を作り直す。社内評価・社内メモは作り直さないので入力中の内容は消えない。面談済み（`COMPLETED` → 面談済み）でも同じく効く | `src/app/admin/(protected)/guide-applications/[id]/page.tsx` |
| 予約リンクの基準 URL を Production で取り違える恐れ | コードは変えず、§10-1 に Production の前提と Deploy 前の確認を明記 | この文書 |
| 接続先 DB の確認手段が untracked | `scripts/check-interview-db.mjs` を repo に含める | `scripts/check-interview-db.mjs` |

確認：ブラウザで承認 → 再読み込みなしでドロップダウンが「面談予定」→「保存する」後も DB・画面とも「面談予定」。`tsc --noEmit`・`eslint`・`next build`・`bun test src/features/guide-interviews`（27 pass）がすべて成功。

## 14. 実装担当

| 担当 | 範囲 |
|---|---|
| Claude | DB、API、Google Calendar、FreeBusy、予約ロジック、仮押さえ、Admin 承認、Google Meet、メール、基本 UI、セキュリティ、テスト |
| Astra（UI/UX 担当の AI） | 最終 UI、UX 改善、レスポンシブ、デザイン統一、アニメーション、Admin UI の仕上げ |

Astra は DB・API・Calendar 連携・予約ルール・セキュリティ・ステータス設計を変更しない。UI だけで済まない変更が必要なら、仕様変更として扱う。

## 15. 更新ルール

- 実装前にこの文書を確認する。コードとこの文書が食い違う場合は、勝手に仕様を変えず差分を報告する。
- 更新する節目：実装開始前 / DB migration 確定時 / Google Calendar 連携完成時 / 予約フロー完成時 / Astra の UI 仕上げ後 / 本番 Deploy 前 / 大きな仕様変更時
- 面談時間・最大件数・Calendar 連携・ステータス・DB 構造・メールフロー・Admin 承認フロー・プライバシー・担当者の変更では、Obsidian ノートも必ず確認する。
- 実装完了時は、変更した仕様・ファイル・DB 変更・新しい環境変数・テスト結果・残課題をこの文書に反映する。

## 16. 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-10-30 | 初版。人間が確定した仕様と、先行ドラフトの確認結果を記載 |
| 2026-10-30 | 面談の間隔 15 分（バッファ共有）と 15 分刻みを確定。ドラフトを実装の土台にすることを決定。§13 を再調査の結果で更新。OAuth の公開状態の方針を §7 に追記 |
| 2026-10-30 | 進捗の自動同期、申請通知（失敗しても申請は成立）、英語のみ、無効・期限切れリンクの文言、「別の時間を依頼」を確定（§8-1、§9、§9-1、§9-2、§11） |
| 2026-10-30 | §13 を再調査（HEAD `13eb26c`、01:37 時点）。API・応募者画面・Admin パネル・認証スクリプトを反映。単体テスト 27 pass |
| 2026-10-30 | 開発用 DB と実 Google Calendar で結合試験を実施（§12-1）。承認直後の進捗ドロップダウンの不具合を修正し、`check-interview-db.mjs` を repo に含めることにした（§13-5）。`INTERVIEW_PUBLIC_BASE_URL` の Production の前提を §10-1 に明記。§11-11 を解決、§11-13 を追加 |
