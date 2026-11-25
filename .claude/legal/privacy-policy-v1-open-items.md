# Privacy Policy V1 未確定事項チェックリスト（2026-11-14 作成、2026-11-15 更新）

2026-11-15 更新: 経営会議（11/16）用の資料ができた。判断する項目は `management-meeting-2026-11-16-privacy.md`、根拠は `privacy-policy-v1-audit.md`、運用は `privacy-operations-manual.md` を参照。

原稿: `.claude/legal/privacy-policy-v1-draft.md`（`src/website-v1/content/privacyPolicy.ts` から自動生成）
実装: `/v1/privacy-policy`（プレビュー限定。公開モードは 404。既存の `/privacy` は変更なし）

公開できる条件は次の3つで、`privacyPolicyPublishable()` が判定します。
- 承認（`PRIVACY_POLICY_APPROVAL`）が記録されている
- 本文に `{{…}}` が残っていない
- 各節の `pending` が空

これらがそろっても、公開には別途、PUBLIC_PATHS の変更とデプロイの判断が必要です。

## A. 会社情報（推測で確定しない）
| # | 項目 | 現在の表示 | 確認すること |
|---|---|---|---|
| A1 | 登記住所 | **決定済み（2026-11-15 経営判断）**: 1-15-25 Nakajima, Nishiyodogawa-ku, Osaka, Japan（大阪市西淀川区中島1丁目15番25号）。会社データ `content/data/company.ts` から第1・14条に表示 | 対応済み（経営判断で確定） |
| A2 | 代表者 | Riku Ohizumi, Representative Director & CEO（2026-11-15 指示で確定。`content/officers.ts`） | 対応済み |
| A3 | 個人情報の問い合わせ先メール | **決定済み（2026-11-15 経営判断）**: contact@connectripjapan.com | 経営判断は完了。技術的な確認（送受信テスト・担当者・返信期限）が未完了: `PRIVACY_TECH_CHECKS`（会議資料 C1） |
| A4 | 個人情報管理責任者 | **決定済み（2026-11-15 経営判断）**: Soma Beppu（別府壮真）, Director & Deputy Head（取締役副代表） | 対応済み。`officers.ts` の `PRIVACY_OFFICER` で第1・11・14条に表示。取締役副代表は社内の役職で、代表権はない |
| A5 | 施行日（Last updated） | 未記入 | 承認日に記入 |

## B. 外部サービスと移転先
| # | 項目 | コードで確認できた事実 | 確認すること |
|---|---|---|---|
| B1 | 予約リクエストの保存 | Google Apps Script → Google スプレッドシート（BOOKING_GAS_URL は設定済み） | Google アカウントの種類（Workspace か個人か）、データの保存地域 |
| B2 | ガイド・パートナー応募 | 外部の Google フォームへのリンクのみ | 回答の保存先スプレッドシートと閲覧者 |
| B3 | 決済 | Stripe の請求書払いは文面の説明のみで、コードにはない | Stripe アカウントが稼働しているか、契約主体（Stripe, Inc. か Stripe Payments Japan 株式会社か） |
| B8 | 旧応募データ | Postgres に `guide_applications`・`partner_registrations`・`partner_applications` があり、通知メール（Resend）に回答の全文が残っている | 本番 DB にデータがあるか。あれば保存期間を当てはめる（会議資料 C5、F7）。ポリシーでは `{{legacyStore}}` |
| B4 | ホスティング | netlify.toml（テスト配信）と、Vercel の Postgres/Blob の設定が両方ある | 本番で V1 を配信する事業者 |
| B5 | メール | 旧サイトは Resend の SMTP。V1 の予約 API はメールを送らない | 業務メール（例: Google Workspace）と、自動送信に何を使うか |
| B6 | 面談 | 面談用の Apps Script があるが、内容は未確認 | 面談ツール（Zoom、Google Meet など）と、録画の有無 |
| B7 | 外国にある第三者への提供（APPI 第28条） | Google と Stripe は米国の事業者 | 「基準適合体制」と「本人同意」のどちらを根拠にするか。求めに応じて情報を提供する手順 |

## C. Cookie・計測
| # | 項目 | 事実 | 確認すること |
|---|---|---|---|
| C1 | Website V1 の計測タグ | GTM・GA4・広告タグ・Search Console の確認タグは、いずれもない | 公開時に導入するか。導入するなら第9節と同意バナーを見直す |
| C2 | 現行サイトの GTM | `src/app/[locale]` に GTM のコードがある（ローカルでは NEXT_PUBLIC_GTM_ID は未設定）。本番で設定されているかは不明 | V1 に切り替わると計測が止まることを了承するか |
| C3 | Search Console | コード上の確認タグはない（DNS で確認している可能性あり） | 利用しているか（Cookie は使わないので、記載は任意） |
| C4 | Cookie 同意の管理 | 未実装。現状は Cookie を使っていないので不要 | 計測を入れる場合に実装する |

## D. 保存期間・削除
| # | 項目 | 確認すること |
|---|---|---|
| D1 | 第10節の保存期間 | 11/15 の暫定基準（8項目）を反映済み。会議で承認する（F1） |
| D2 | 自動削除 | 未実装。スプレッドシートと Google フォームの定期削除の手順を決める |
| D3 | 法定保存義務 | 法人税法（帳簿・書類は原則7年、欠損金がある場合は10年）、旅行業法上の記録保存義務の有無を確認 |

## E. 法務確認（専門家へ）
- E1: APPI の公表事項（第32条: 名称・住所・代表者、利用目的、開示等の手続、手数料、苦情窓口、安全管理措置）がそろっているか
- E2: 開示等の請求の手数料: **決定済み（2026-11-15 経営判断）: 原則無料**。第12条に反映
- E3: 要配慮個人情報（健康状態、アレルギー）を取得するときの同意の取り方（いまは自由記述の欄で取得）
- E4: GDPR / UK GDPR の記載（法的根拠、十分性認定の扱い、代理人の要否）
- E5: 未成年者の年齢基準（いまは16歳）
- E6: 写真・動画の利用許諾の取り方（ツアー当日の同意書など）
- E7: Terms & Conditions と Cancellation & Refund Policy（どちらも下書き）との整合

## F. 自分で変更できないもの（外部の Google フォーム）
次の2つは、フォームの説明文にプライバシーポリシーへのリンクと、利用目的を追加する必要があります。
- ガイド応募フォーム: `GUIDE_FORM_URL`
- パートナー応募フォーム: `PARTNER_FORM_URL`

ガイド応募フォーム用の文例:
> ご回答いただいた情報は、ガイド採用の選考、面談のご連絡、採用後の業務連絡のためにのみ利用します。詳しくはプライバシーポリシー（https://connectripjapan.com/privacy-policy）をご覧ください。

URL は公開時の確定 URL に置き換えてください。
